use crate::model::{Context, Event, NetworkModel};
use nexosim::ports::Output;
use wasmtime::{Engine, Instance, Linker, Memory, Module, Store, TypedFunc};

#[derive(Debug, Clone)]
pub struct WasmContext {
    // Host state exposed to WASM if needed
}

pub struct WasmHostWrapper {
    store: Store<WasmContext>,
    // Channel for outbound packets from WASM
    // We use a shared channel because host functions (closures) need to write to it,
    // but they can't access 'self' directly.
    _outbound_tx: std::sync::mpsc::Sender<Event>,
    outbound_rx: std::sync::mpsc::Receiver<Event>,

    _instance: Instance,
    memory: Memory,
    process_func: TypedFunc<(i32, i32), i32>,
    alloc_func: TypedFunc<i32, i32>,
    pub id: u32,
    pub output: Output<Event>,
}

impl WasmHostWrapper {
    pub fn new(
        engine: &Engine,
        module_bytes: &[u8],
        id: u32,
        _offset: usize,
    ) -> anyhow::Result<Self> {
        let mut store = Store::new(engine, WasmContext {});
        let module = Module::new(engine, module_bytes)?;
        let mut linker = Linker::new(engine);

        // Create a channel for outbound packets
        let (tx, rx) = std::sync::mpsc::channel();
        let tx_clone = tx.clone();

        // Define host imports (e.g. logging)
        linker.func_wrap(
            "env",
            "host_log",
            move |mut caller: wasmtime::Caller<'_, _>, ptr: i32, len: i32| {
                let mem = match caller.get_export("memory") {
                    Some(wasmtime::Extern::Memory(m)) => m,
                    _ => return,
                };

                let (mem, _ctx) = mem.data_and_store_mut(&mut caller);

                // Safety: Validate bounds
                let offset = ptr as usize;
                let length = len as usize;
                if offset + length <= mem.len() {
                    let bytes = &mem[offset..offset + length];
                    if let Ok(msg) = std::str::from_utf8(bytes) {
                        tracing::info!("[WASM LOG]: {}", msg);
                    }
                }
            },
        )?;

        // Define send_packet
        linker.func_wrap(
            "env",
            "send_packet",
            move |mut caller: wasmtime::Caller<'_, _>, ptr: i32, len: i32| {
                let mem = match caller.get_export("memory") {
                    Some(wasmtime::Extern::Memory(m)) => m,
                    _ => return,
                };

                let (mem, _ctx) = mem.data_and_store_mut(&mut caller);
                let offset = ptr as usize;
                let length = len as usize;

                if offset + length <= mem.len() {
                    let bytes = &mem[offset..offset + length];
                    // Parse packet manually (skipping id checks for now, trusting guest)
                    // Format: src(4) + dest(4) + data(...)
                    if bytes.len() >= 8 {
                        let src = u32::from_le_bytes(bytes[0..4].try_into().unwrap());
                        let dest = u32::from_le_bytes(bytes[4..8].try_into().unwrap());
                        let data = bytes[8..].to_vec();

                        let packet = crate::model::Packet { src, dest, data };
                        // Send to channel
                        let _ = tx_clone.send(Event::PacketReceived(packet));
                    }
                }
            },
        )?;

        let instance = linker.instantiate(&mut store, &module)?;

        let memory = instance
            .get_memory(&mut store, "memory")
            .ok_or_else(|| anyhow::anyhow!("WASM module must export 'memory'"))?;

        let process_func =
            instance.get_typed_func::<(i32, i32), i32>(&mut store, "process_packet")?;
        let alloc_func = instance.get_typed_func::<i32, i32>(&mut store, "guest_alloc")?;

        Ok(Self {
            store,
            _outbound_tx: tx,
            outbound_rx: rx,
            _instance: instance,
            memory,
            process_func,
            alloc_func,
            id,
            output: Output::default(),
        })
    }
}

// Manually implement Debug because Store/Instance/Func don't implement it
impl std::fmt::Debug for WasmHostWrapper {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("WasmHostWrapper")
            .field("id", &self.id)
            .finish()
    }
}

impl NetworkModel for WasmHostWrapper {
    fn process_event(&mut self, event: Event, _ctx: &mut Context) {
        if let Event::PacketReceived(packet) = event {
            // UNSAFE: Direct write to WASM memory
            let payload_len = packet.data.len();
            let total_len = 8 + payload_len; // 4 src + 4 dest + data

            // Allocate memory in guest
            let ptr = match self.alloc_func.call(&mut self.store, total_len as i32) {
                Ok(p) => p,
                Err(e) => {
                    tracing::error!("WASM allocation failed: {}", e);
                    return;
                }
            };
            let guest_offset = ptr as usize;

            unsafe {
                let raw_mem = self.memory.data_mut(&mut self.store);

                // Safety check: ensure we don't write out of bounds
                if guest_offset + total_len > raw_mem.len() {
                    tracing::error!("WASM memory overflow: allocated pointer out of bounds");
                    return;
                }

                let dest_ptr = raw_mem.as_mut_ptr().add(guest_offset);

                // Serialize: Src (4) + Dest (4) + Data
                let src_bytes = packet.src.to_le_bytes();
                let dest_bytes = packet.dest.to_le_bytes();

                std::ptr::copy_nonoverlapping(src_bytes.as_ptr(), dest_ptr, 4);
                std::ptr::copy_nonoverlapping(dest_bytes.as_ptr(), dest_ptr.add(4), 4);
                std::ptr::copy_nonoverlapping(packet.data.as_ptr(), dest_ptr.add(8), payload_len);
            }

            tracing::info!(
                "WASM Wrapper calling process_packet (ptr={}, len={})",
                guest_offset,
                total_len
            );

            // Call WASM function with (offset, length)
            // Result: 0=Drop, 1=Forward (simplified)
            match self
                .process_func
                .call(&mut self.store, (guest_offset as i32, total_len as i32))
            {
                Ok(result) => {
                    if result == 1 {
                        // Forward logic would go here
                        tracing::info!("WASM component {} forwarded packet", self.id);
                    } else {
                        tracing::info!("WASM component {} dropped packet", self.id);
                    }
                }
                Err(e) => {
                    tracing::error!("WASM execution failed: {}", e);
                }
            }

            // Drain outbound queue
            while let Ok(out_event) = self.outbound_rx.try_recv() {
                // If it's a packet, we might want to ensure src/dest are correct?
                // For now, just forward.
                let _ = self.output.send(out_event);
            }
        }
    }

    fn id(&self) -> u32 {
        self.id
    }
}
