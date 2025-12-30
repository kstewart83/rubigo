//! A Region is a single orthogonal state container

use crate::types::*;
use std::collections::HashMap;

/// Runtime state for a single region
#[derive(Debug, Clone)]
pub struct Region {
    pub id: String,
    pub current_state: String,
    states: HashMap<String, StateConfig>,
}

impl Region {
    pub fn new(id: String, initial: String, states: HashMap<String, StateConfig>) -> Self {
        Self {
            id,
            current_state: initial,
            states,
        }
    }
    
    /// Send an event to this region, returns actions to execute
    pub fn send(&mut self, event: &Event, guard_fn: impl Fn(&str) -> bool) -> TransitionResult {
        let mut result = TransitionResult::default();
        
        let Some(state_config) = self.states.get(&self.current_state) else {
            return result;
        };
        
        let Some(transition) = state_config.on.get(&event.name) else {
            return result;
        };
        
        let (target, actions, guard) = match transition {
            TransitionConfig::Target(t) => (t.clone(), vec![], None),
            TransitionConfig::Full { target, actions, guard } => {
                (target.clone(), actions.clone(), guard.clone())
            }
        };
        
        // Check guard if present
        if let Some(guard_name) = guard {
            if !guard_fn(&guard_name) {
                return result;
            }
        }
        
        // Execute exit actions from current state
        result.actions.extend(state_config.exit.clone());
        
        // Execute transition actions
        result.actions.extend(actions);
        
        // Move to new state
        self.current_state = target.clone();
        
        // Execute entry actions on new state
        if let Some(new_state) = self.states.get(&self.current_state) {
            result.actions.extend(new_state.entry.clone());
        }
        
        result.new_states.insert(self.id.clone(), self.current_state.clone());
        result.handled = true;
        
        result
    }
    
    pub fn is_final(&self) -> bool {
        self.states
            .get(&self.current_state)
            .map(|s| s.final_state)
            .unwrap_or(false)
    }
}
