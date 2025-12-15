use crate::metalog::MetalogDistribution;
use crate::model::Packet;
use crate::model::{Event, NetworkModel};
use crate::telemetry::TelemetrySystem;
use nexosim::ports::Output;
use rand::SeedableRng;
use rand::distr::Distribution;
use rand::rngs::StdRng;
use std::sync::Arc;
use std::time::Duration;
use tokio::runtime::Handle;

#[derive(Debug)]
pub struct PacketGenerator {
    pub output: Output<Event>,
    pub inter_arrival: MetalogDistribution,
    pub rng: StdRng,
    pub id: u32,
    pub dest_id: u32,
    pub telemetry: Option<Arc<TelemetrySystem>>,
    pub handle: Option<Handle>,
}

// Static assertion to ensure PacketGenerator implies Send.
// This is critical because nexosim requires models to be Send for potential multi-threaded execution.
fn _assert_send<T: Send>() {}
fn _check_send() {
    _assert_send::<PacketGenerator>();
}

impl PacketGenerator {
    // Constructor
    pub fn new(
        id: u32,
        dest_id: u32,
        inter_arrival: MetalogDistribution,
        telemetry: Option<Arc<TelemetrySystem>>,
    ) -> Self {
        let handle = if telemetry.is_some() {
            Some(Handle::current())
        } else {
            None
        };

        Self {
            output: Output::default(),
            inter_arrival,
            rng: StdRng::from_os_rng(),
            id,
            dest_id,
            telemetry,
            handle,
        }
    }

    // Helper to sample delay
    pub fn next_delay(&mut self) -> Duration {
        let delay_sec = self.inter_arrival.sample(&mut self.rng).max(0.000_001);
        let delay_ns = (delay_sec * 1_000_000_000.0) as u64;
        Duration::from_nanos(delay_ns)
    }

    pub fn create_packet(&self) -> Packet {
        Packet {
            src: self.id,
            dest: self.dest_id,
            data: vec![0; 64],
        }
    }
}

impl NetworkModel for PacketGenerator {
    fn process_event(&mut self, _event: Event, _ctx: &mut crate::model::Context) {
        // Source does not process input events (yet)
    }
    fn id(&self) -> u32 {
        self.id
    }
}

// Removed impl NetworkModel and impl Model for PacketGenerator
// Logic moved to Component in model.rs
