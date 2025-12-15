use crate::generator::PacketGenerator;
use crate::wasm::WasmHostWrapper;
use enum_dispatch::enum_dispatch;

use nexosim::model::{Context as NexoContext, Model};
use nexosim::ports::Output;
use nexosim::simulation::Address;

// Placeholder structs for now
#[derive(Debug, Clone)]
pub struct RouterModel {
    pub id: u32,
    pub output: Output<Event>,
}
#[derive(Debug, Clone)]
pub struct SwitchModel {
    pub id: u32,
    pub output: Output<Event>,
}
#[derive(Debug, Clone)]
pub struct CableModel {
    pub id: u32,
    pub output: Output<Event>,
}

// Event definition (simplified for now)
#[derive(Debug, Clone)]
pub enum Event {
    PacketReceived(Packet),
    TimerExpired(u64),
}

#[derive(Debug, Clone)]
pub struct Packet {
    pub src: u32,
    pub dest: u32,
    pub data: Vec<u8>,
}

impl Packet {
    pub fn len(&self) -> usize {
        self.data.len()
    }
}

pub struct Context {
    // Context for the simulation (time, scheduler access, etc.)
    pub current_time: f64,
}

#[enum_dispatch]
pub trait NetworkModel {
    fn process_event(&mut self, event: Event, ctx: &mut Context);
    fn id(&self) -> u32;
}

// We will add WasmHostWrapper later in wasm.rs
#[enum_dispatch(NetworkModel)]
pub enum Component {
    Router(RouterModel),
    Switch(SwitchModel),
    OpticalCable(CableModel),
    // The bridge to the dynamic world
    WasmWrapper(WasmHostWrapper),
    // Traffic Source
    PacketGenerator(PacketGenerator),
}

impl Component {
    /// Connects this component's default output to the target component's input method.
    pub fn connect(&mut self, target: Address<Component>) {
        match self {
            Component::Router(c) => c.output.connect(Component::input, target),
            Component::Switch(c) => c.output.connect(Component::input, target),
            Component::OpticalCable(c) => c.output.connect(Component::input, target),
            Component::WasmWrapper(c) => c.output.connect(Component::input, target),
            Component::PacketGenerator(c) => c.output.connect(Component::input, target),
        }
    }
}

// Nexosim Model Integration
impl Model for Component {
    // We delegate init manually because we need to handle special cases like PacketGenerator
    // which needs to schedule its first tick.
    async fn init(self, ctx: &mut NexoContext<Self>) -> nexosim::model::InitializedModel<Self> {
        let mut component = self;
        match &mut component {
            Component::PacketGenerator(g) => {
                Component::data_source_tick(g, ctx);
            }
            _ => {}
        }
        component.into()
    }
}

impl Component {
    // Helper to run the tick logic for the generator variant
    pub fn data_source_tick(g: &mut PacketGenerator, ctx: &mut NexoContext<Component>) {
        // Log Metric
        if let Some(telemetry) = &g.telemetry {
            let t = ctx.time();
            let now_nanos = (t.as_secs() as u64) * 1_000_000_000 + (t.subsec_nanos() as u64);
            // Hack: We can't await here directly because data_source_tick is synchronous.
            // But we can spawn a task using the captured Handle, which allows spawning from non-runtime threads.
            if let Some(handle) = &g.handle {
                let telemetry = telemetry.clone();
                let id = g.id;
                handle.spawn(async move {
                    if let Err(e) = telemetry
                        .log_metric(id, now_nanos.try_into().unwrap_or(0), 1.0)
                        .await
                    {
                        tracing::error!("Telemetry write failed: {:?}", e);
                    } else {
                        tracing::info!("Telemetry write success for id {}", id);
                    }
                });
            }
        }

        let packet = g.create_packet();
        // Schedule send
        if let Err(e) = ctx.schedule_event(
            std::time::Duration::from_nanos(1),
            Component::send_packet_event,
            packet,
        ) {
            tracing::error!("Failed to schedule send_packet: {:?}", e);
        }

        let delay = g.next_delay();
        // Schedule next tick
        if let Err(e) = ctx.schedule_event(delay, Component::trigger_tick, ()) {
            tracing::error!("Failed to schedule next tick: {:?}", e);
        }
    }

    // Callback to send the packet
    pub fn send_packet_event<'a>(
        c: &'a mut Component,
        packet: Packet,
        _ctx: &'a mut NexoContext<Component>,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = ()> + Send + 'a>> {
        Box::pin(async move {
            tracing::info!("Generator sending packet...");
            if let Component::PacketGenerator(g) = c {
                let mut output = g.output.clone();
                output.send(Event::PacketReceived(packet)).await;
                tracing::info!("Packet sent successfully (await returned).");
            }
        })
    }

    // Callback to trigger next tick
    pub fn trigger_tick<'a>(
        c: &'a mut Component,
        _: (),
        ctx: &'a mut NexoContext<Component>,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = ()> + Send + 'a>> {
        Box::pin(async move {
            if let Component::PacketGenerator(g) = c {
                Component::data_source_tick(g, ctx);
            }
        })
    }
    pub async fn input(&mut self, event: Event, _ctx: &mut NexoContext<Self>) {
        tracing::info!("Component input: {:?}", event);
        // We need to map NexoContext to our internal Context if they differ,
        // or just use NexoContext directly.
        // For now, let's adapt `process_event` to take `&mut self` and `Event`.
        // We'll ignore ctx for the moment or pass it if we update the trait.

        // Note: The `NetworkModel` trait defined `process_event` synchronously.
        // We might need to make it async or wrap it.
        // Since `enum_dispatch` handles the forwarding, we can just call it.

        // Create a temporary local context wrapper if needed, or update NetworkModel.
        // Let's update NetworkModel to use nexosim Context or generic.

        let mut local_ctx = Context { current_time: 0.0 }; // Placeholder
        self.process_event(event, &mut local_ctx);
    }
}

// Implementations
impl NetworkModel for RouterModel {
    fn process_event(&mut self, _event: Event, _ctx: &mut Context) {
        // Router logic
    }
    fn id(&self) -> u32 {
        self.id
    }
}

impl NetworkModel for SwitchModel {
    fn process_event(&mut self, _event: Event, _ctx: &mut Context) {
        // Switch logic
    }
    fn id(&self) -> u32 {
        self.id
    }
}

impl NetworkModel for CableModel {
    fn process_event(&mut self, _event: Event, _ctx: &mut Context) {
        // Cable logic
    }
    fn id(&self) -> u32 {
        self.id
    }
}
