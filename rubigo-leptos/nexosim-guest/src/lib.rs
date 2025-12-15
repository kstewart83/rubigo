#[derive(Debug, Clone)]
pub struct Packet {
    pub src: u32,
    pub dest: u32,
    pub data: Vec<u8>,
}

impl Packet {
    pub fn from_bytes(slice: &[u8]) -> Self {
        // Simplified deserialization (assuming zero-copy or simple layout for now)
        // In reality, we'd use bytemuck or rkyv.
        // For this demo, let's assume the first 8 bytes are src/dest and rest is data.
        if slice.len() < 8 {
            return Self {
                src: 0,
                dest: 0,
                data: vec![],
            };
        }

        let src = u32::from_le_bytes(slice[0..4].try_into().unwrap());
        let dest = u32::from_le_bytes(slice[4..8].try_into().unwrap());
        let data = slice[8..].to_vec();

        Self { src, dest, data }
    }
}

pub struct GuestContext;

impl GuestContext {
    pub fn log(&self, msg: &str) {
        crate::log_msg(msg);
    }

    pub fn send(&self, packet: Packet) {
        // Serialize packet (naive: src(4) + dest(4) + data)
        // In real app, use serde/rkyv.
        let mut bytes = Vec::with_capacity(8 + packet.data.len());
        bytes.extend_from_slice(&packet.src.to_le_bytes());
        bytes.extend_from_slice(&packet.dest.to_le_bytes());
        bytes.extend_from_slice(&packet.data);

        unsafe {
            send_packet(bytes.as_ptr(), bytes.len());
        }
    }
}

pub trait Handler {
    fn handle(packet: Packet, ctx: &mut GuestContext);
}

#[cfg(target_arch = "wasm32")]
unsafe extern "C" {
    #[link_name = "host_log"]
    fn log(ptr: *const u8, len: usize);
    fn send_packet(ptr: *const u8, len: usize);
}

#[cfg(not(target_arch = "wasm32"))]
unsafe fn log(_ptr: *const u8, _len: usize) {}
#[cfg(not(target_arch = "wasm32"))]
unsafe fn send_packet(_ptr: *const u8, _len: usize) {}

pub fn log_msg(msg: &str) {
    unsafe {
        log(msg.as_ptr(), msg.len());
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn guest_alloc(len: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(len);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[macro_export]
macro_rules! export {
    ($handler:ty) => {
        #[unsafe(no_mangle)]
        pub extern "C" fn process_packet(ptr: i32, len: i32) -> i32 {
            let slice = unsafe { std::slice::from_raw_parts(ptr as *const u8, len as usize) };
            let packet = $crate::Packet::from_bytes(slice);
            let mut ctx = $crate::GuestContext;
            <$handler>::handle(packet, &mut ctx);
            1 // Forward (Default)
        }
    };
}
