use anyhow::{Result, anyhow};
use nexosim::ports::Output;
use nexosim_hybrid::{generator, metalog, model, simulation, telemetry, wasm};
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<()> {
    // 1. Init Telemetry & Tracing
    telemetry::init_tracing();
    tracing::info!("Initializing Simulation Engine...");

    // 2. Create Simulation Builder
    let mut builder = simulation::SimulationBuilder::new();

    // 3. Create Components

    // a) WASM Component
    tracing::info!("Compiling WASM Component...");
    // Load the compiled WASM module
    // Note: We assume the router-wasm crate has been built previously
    let wasm_path = "../router-wasm/target/wasm32-unknown-unknown/debug/router_wasm.wasm";
    let wasm_bytes = std::fs::read(wasm_path)
        .map_err(|e| anyhow!("Failed to read WASM module at {}: {}", wasm_path, e))?;
    let engine = wasmtime::Engine::default();
    let wasm_comp = wasm::WasmHostWrapper::new(&engine, &wasm_bytes, 101, 0)?;

    // b) Native Router
    let router = model::RouterModel {
        id: 202,
        output: Output::default(),
    };

    // c) Packet Generator (Source)
    // 4. Initialize Telemetry
    let telemetry = Arc::new(telemetry::TelemetrySystem::new().await?);

    // 50% probability median, unbounded
    let coeffs = vec![0.0, 1.0, 0.0, 0.5];
    let metalog = metalog::MetalogDistribution::new(coeffs, metalog::MetalogBounds::Unbounded);
    // We set destination to 202 (Router) so WASM (101) forwards it.
    let generator = generator::PacketGenerator::new(303, 202, metalog, Some(telemetry.clone()));

    // 5. Register Components
    let wasm_idx = builder.add_component(model::Component::WasmWrapper(wasm_comp), "wasm_node");
    let _router_idx = builder.add_component(model::Component::Router(router), "router_node");
    let gen_idx = builder.add_component(model::Component::PacketGenerator(generator), "generator");

    // 5. Connect Components
    // Generator -> WASM -> Router
    // Note: My WASM wrapper currently drops or forwards.
    // And I haven't implemented forwarding logic connection yet in WASM wrapper.
    // So let's just connect Generator -> WASM for now.
    builder.connect(gen_idx, wasm_idx);
    // Ideally WASM -> Router, but WasmHostWrapper needs to know how to emit.

    // 6. Build and Run
    tracing::info!("Building Simulation...");
    let mut sim = builder.build()?;

    tracing::info!("Starting Simulation Step Loop...");
    // Run for a few steps
    for i in 0..5 {
        tracing::info!("Step {}", i);
        sim.step()?;
        // Sleep to let async tasks inside nexosim run?
        // nexosim::step() usually processes all available events at current time.
        // We might need to advance time.
    }

    tracing::info!("Simulation Loop Verified.");

    // 7. Analysis
    // Allow async writes to flush
    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    let count = telemetry.get_total_packets().await?;
    tracing::info!("Total Packets Logged in Telemetry: {}", count);

    Ok(())
}
