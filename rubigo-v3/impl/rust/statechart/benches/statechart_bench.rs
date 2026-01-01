//! Performance benchmarks for the statechart interpreter
//!
//! Run with: cargo bench

use criterion::{black_box, criterion_group, criterion_main, Criterion, Throughput};
use rubigo_statechart::*;

fn event(name: &str) -> Event {
    Event {
        name: name.to_string(),
        payload: serde_json::Value::Null,
    }
}

/// Benchmark: Parse machine config from JSON
fn bench_parse_config(c: &mut Criterion) {
    let json = r#"{
        "id": "counter",
        "initial": "active",
        "context": { "value": 0 },
        "states": {
            "active": {
                "on": {
                    "INCREMENT": { "target": "active", "actions": ["increment"] },
                    "DECREMENT": { "target": "active", "actions": ["decrement"] }
                }
            }
        }
    }"#;
    
    c.bench_function("parse_simple_config", |b| {
        b.iter(|| {
            let config: MachineConfig = serde_json::from_str(black_box(json)).unwrap();
            black_box(config)
        })
    });
}

/// Benchmark: Simple transition throughput
fn bench_simple_transition(c: &mut Criterion) {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "counter",
        "initial": "active",
        "states": {
            "active": {
                "on": {
                    "INCREMENT": { "target": "active", "actions": ["increment"] }
                }
            }
        }
    }"#).unwrap();
    
    let mut group = c.benchmark_group("transitions");
    group.throughput(Throughput::Elements(1));
    
    group.bench_function("simple_transition", |b| {
        let mut machine = Machine::from_config(config.clone());
        b.iter(|| {
            let result = machine.send(black_box(event("INCREMENT")));
            black_box(result)
        })
    });
    
    group.finish();
}

/// Benchmark: Transition with guards
fn bench_guarded_transition(c: &mut Criterion) {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "guarded",
        "initial": "active",
        "states": {
            "active": {
                "on": {
                    "INCREMENT": { "target": "active", "actions": ["increment"], "guard": "canIncrement" }
                }
            }
        }
    }"#).unwrap();
    
    let mut group = c.benchmark_group("guards");
    group.throughput(Throughput::Elements(1));
    
    group.bench_function("guarded_transition", |b| {
        let mut machine = Machine::from_config(config.clone());
        b.iter(|| {
            let result = machine.send_with_guards(
                black_box(event("INCREMENT")),
                |g| g == "canIncrement"
            );
            black_box(result)
        })
    });
    
    group.finish();
}

/// Benchmark: Parallel regions
fn bench_parallel_regions(c: &mut Criterion) {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "parallel",
        "initial": { "a": "idle", "b": "idle" },
        "states": {},
        "regions": {
            "a": {
                "initial": "idle",
                "states": {
                    "idle": { "on": { "TOGGLE": "active" } },
                    "active": { "on": { "TOGGLE": "idle" } }
                }
            },
            "b": {
                "initial": "idle",
                "states": {
                    "idle": { "on": { "TOGGLE": "active" } },
                    "active": { "on": { "TOGGLE": "idle" } }
                }
            }
        }
    }"#).unwrap();
    
    let mut group = c.benchmark_group("parallel");
    group.throughput(Throughput::Elements(1));
    
    group.bench_function("two_region_transition", |b| {
        let mut machine = Machine::from_config(config.clone());
        b.iter(|| {
            let result = machine.send(black_box(event("TOGGLE")));
            black_box(result)
        })
    });
    
    group.finish();
}

/// Benchmark: High-frequency event storm (10k events)
fn bench_event_storm(c: &mut Criterion) {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "rapid",
        "initial": "a",
        "states": {
            "a": { "on": { "TICK": "b" } },
            "b": { "on": { "TICK": "a" } }
        }
    }"#).unwrap();
    
    let mut group = c.benchmark_group("throughput");
    group.throughput(Throughput::Elements(10_000));
    
    group.bench_function("10k_events", |b| {
        b.iter(|| {
            let mut machine = Machine::from_config(config.clone());
            for _ in 0..10_000 {
                machine.send(event("TICK"));
            }
            // Return owned value, not reference
            machine.is_done()
        })
    });
    
    group.finish();
}

/// Benchmark: Entry/exit action collection
fn bench_entry_exit_actions(c: &mut Criterion) {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "actions",
        "initial": "a",
        "states": {
            "a": {
                "entry": ["enterA"],
                "exit": ["exitA"],
                "on": { "GO": "b" }
            },
            "b": {
                "entry": ["enterB"],
                "exit": ["exitB"],
                "on": { "GO": "a" }
            }
        }
    }"#).unwrap();
    
    c.bench_function("transition_with_actions", |b| {
        let mut machine = Machine::from_config(config.clone());
        b.iter(|| {
            let result = machine.send(black_box(event("GO")));
            black_box(result)
        })
    });
}

criterion_group!(
    benches,
    bench_parse_config,
    bench_simple_transition,
    bench_guarded_transition,
    bench_parallel_regions,
    bench_event_storm,
    bench_entry_exit_actions,
);

criterion_main!(benches);
