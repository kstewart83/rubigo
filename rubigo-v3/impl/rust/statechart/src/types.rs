//! Core types for statechart definitions

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A statechart machine definition (JSON-serializable)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MachineConfig {
    /// Unique identifier for this machine
    pub id: String,

    /// Initial state (or map of region_id -> initial_state for parallel)
    pub initial: InitialState,

    /// Context schema - the machine's extended state
    #[serde(default)]
    pub context: serde_json::Value,

    /// State definitions
    pub states: HashMap<String, StateConfig>,

    /// Parallel regions (if any)
    #[serde(default)]
    pub regions: HashMap<String, RegionConfig>,

    /// Action definitions: name -> mutation expression
    #[serde(default)]
    pub actions: HashMap<String, ActionConfig>,
}

/// Action definition with mutation expression
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionConfig {
    /// Mutation expression like "context.checked = !context.checked"
    pub mutation: String,

    /// Optional description
    #[serde(default)]
    pub description: Option<String>,

    /// Events emitted by this action
    #[serde(default)]
    pub emits: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum InitialState {
    /// Single initial state (flat machine)
    Single(String),
    /// Map of region -> initial state (parallel machine)
    Parallel(HashMap<String, String>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateConfig {
    /// Transitions: event_name -> transition config
    #[serde(default)]
    pub on: HashMap<String, TransitionConfig>,

    /// Actions to run on entry
    #[serde(default)]
    pub entry: Vec<String>,

    /// Actions to run on exit
    #[serde(default)]
    pub exit: Vec<String>,

    /// Is this a final state?
    #[serde(default)]
    pub final_state: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum TransitionConfig {
    /// Simple: just a target state
    Target(String),
    /// Full: target + actions + guard
    Full {
        target: String,
        #[serde(default)]
        actions: Vec<String>,
        #[serde(default)]
        guard: Option<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionConfig {
    /// Initial state for this region
    pub initial: String,
    /// States in this region
    pub states: HashMap<String, StateConfig>,
}

/// An event sent to the machine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub name: String,
    #[serde(default)]
    pub payload: serde_json::Value,
}

/// Output from a transition
#[derive(Debug, Clone, Default)]
pub struct TransitionResult {
    /// Actions that should be executed
    pub actions: Vec<String>,
    /// New state(s) after transition
    pub new_states: HashMap<String, String>,
    /// Whether the event was handled
    pub handled: bool,
}
