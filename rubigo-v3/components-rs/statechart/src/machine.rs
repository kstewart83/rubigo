//! The Machine - orchestrates one or more parallel Regions

use crate::region::Region;
use crate::types::*;
use std::collections::HashMap;

/// Runtime state machine with parallel region support
#[derive(Debug)]
pub struct Machine {
    pub id: String,
    pub context: serde_json::Value,
    regions: Vec<Region>,
    actions: HashMap<String, ActionConfig>,
}

impl Machine {
    /// Create a machine from a config
    pub fn from_config(config: MachineConfig) -> Self {
        let mut regions = Vec::new();

        if config.regions.is_empty() {
            // Flat machine - single implicit region
            let initial = match config.initial {
                InitialState::Single(s) => s,
                InitialState::Parallel(mut map) => map.remove("main").unwrap_or_default(),
            };
            regions.push(Region::new("main".to_string(), initial, config.states));
        } else {
            // Parallel machine - multiple regions
            let initial_map = match config.initial {
                InitialState::Single(s) => {
                    let mut map = HashMap::new();
                    map.insert("main".to_string(), s);
                    map
                }
                InitialState::Parallel(map) => map,
            };

            for (region_id, region_config) in config.regions {
                let initial = initial_map
                    .get(&region_id)
                    .cloned()
                    .unwrap_or(region_config.initial.clone());
                regions.push(Region::new(region_id, initial, region_config.states));
            }
        }

        Self {
            id: config.id,
            context: config.context,
            regions,
            actions: config.actions,
        }
    }

    /// Send an event to all regions
    pub fn send(&mut self, event: Event) -> TransitionResult {
        self.send_with_guards(event, |_| true)
    }

    /// Send an event with a guard evaluator
    pub fn send_with_guards(
        &mut self,
        event: Event,
        guard_fn: impl Fn(&str) -> bool,
    ) -> TransitionResult {
        let mut combined = TransitionResult::default();

        for region in &mut self.regions {
            let result = region.send(&event, &guard_fn);
            combined.actions.extend(result.actions);
            combined.new_states.extend(result.new_states);
            combined.handled = combined.handled || result.handled;
        }

        // Action execution handled by caller (WASM wrapper or native test harness)
        // for action_name in &combined.actions {
        //     self.execute_action(action_name);
        // }

        combined
    }

    /// Execute an action's mutation on the context
    fn execute_action(&mut self, action_name: &str) {
        if let Some(action) = self.actions.get(action_name) {
            // Parse simple mutations like "context.field = value"
            let mutation = &action.mutation;

            // Handle: context.field = !context.field (toggle)
            if mutation.contains("= !context.") {
                if let Some(field) = self.parse_toggle_field(mutation) {
                    if let Some(current) = self.context.get(&field).and_then(|v| v.as_bool()) {
                        self.context[&field] = (!current).into();
                    }
                }
            }
            // Handle: context.field = true
            else if mutation.contains("= true") {
                if let Some(field) = self.parse_assign_field(mutation) {
                    self.context[&field] = true.into();
                }
            }
            // Handle: context.field = false
            else if mutation.contains("= false") {
                if let Some(field) = self.parse_assign_field(mutation) {
                    self.context[&field] = false.into();
                }
            }
        }
    }

    /// Parse field name from "context.field = !context.field"
    fn parse_toggle_field(&self, mutation: &str) -> Option<String> {
        // Extract field from "context.checked = !context.checked"
        let parts: Vec<&str> = mutation.split('=').collect();
        if parts.len() == 2 {
            let lhs = parts[0].trim();
            if lhs.starts_with("context.") {
                return Some(lhs[8..].to_string());
            }
        }
        None
    }

    /// Parse field name from "context.field = true" or "context.field = false"
    fn parse_assign_field(&self, mutation: &str) -> Option<String> {
        self.parse_toggle_field(mutation)
    }

    /// Get current state (for flat machines)
    pub fn current_state(&self) -> Option<&str> {
        self.regions.first().map(|r| r.current_state.as_str())
    }

    /// Get all current states (for parallel machines)
    pub fn current_states(&self) -> HashMap<String, String> {
        self.regions
            .iter()
            .map(|r| (r.id.clone(), r.current_state.clone()))
            .collect()
    }

    /// Check if all regions are in final states
    pub fn is_done(&self) -> bool {
        self.regions.iter().all(|r| r.is_final())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_counter() {
        let config: MachineConfig = serde_json::from_str(
            r#"{
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
        }"#,
        )
        .unwrap();

        let mut machine = Machine::from_config(config);

        assert_eq!(machine.current_state(), Some("active"));

        let result = machine.send(Event {
            name: "INCREMENT".into(),
            payload: serde_json::Value::Null,
        });

        assert!(result.handled);
        assert_eq!(result.actions, vec!["increment"]);
        assert_eq!(machine.current_state(), Some("active"));
    }
}
