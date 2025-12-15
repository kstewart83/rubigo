use crate::model::Component;
use anyhow::{Result, anyhow};
use nexosim::simulation::{Mailbox, SimInit, Simulation as NexoSimulation};
use nexosim::time::MonotonicTime;

/// A builder that manages the lifecycle of models before simulation starts.
pub struct SimulationBuilder {
    models: Vec<(Component, String)>, // (Model, Name)
    // We wrap Mailbox in Option so we can take ownership during build()
    mailboxes: Vec<Option<Mailbox<Component>>>,
}

pub struct Simulation {
    sim: NexoSimulation,
}

impl SimulationBuilder {
    pub fn new() -> Self {
        Self {
            models: Vec::new(),
            mailboxes: Vec::new(),
        }
    }

    pub fn add_component(&mut self, component: Component, name: &str) -> usize {
        let idx = self.models.len();
        self.models.push((component, name.to_string()));
        self.mailboxes.push(Some(Mailbox::new()));
        idx
    }

    /// Establish a connection: Component[src] -> Component[target]
    pub fn connect(&mut self, src_idx: usize, target_idx: usize) {
        // We get the target mailbox address
        let target_addr = self.mailboxes[target_idx]
            .as_ref()
            .expect("Mailbox missing")
            .address();

        // Connect the source component's output to the target's address
        self.models[src_idx].0.connect(target_addr);
    }

    pub fn build(mut self) -> Result<Simulation> {
        let mut init = SimInit::new();
        let t0 = MonotonicTime::EPOCH;

        // Add all models
        // We drain the vectors to take ownership
        for (i, (model, name)) in self.models.into_iter().enumerate() {
            let mbox = self.mailboxes[i]
                .take()
                .ok_or_else(|| anyhow!("Mailbox already taken"))?;

            init = init.add_model(model, mbox, &name);
        }

        // Map execution error to anyhow
        let (sim, _) = init
            .init(t0)
            .map_err(|e| anyhow!("Simulation init failed: {:?}", e))?;

        Ok(Simulation { sim })
    }
}

impl Simulation {
    pub fn step(&mut self) -> Result<()> {
        self.sim
            .step()
            .map_err(|e| anyhow!("Simulation step failed: {:?}", e))?;
        Ok(())
    }
}
