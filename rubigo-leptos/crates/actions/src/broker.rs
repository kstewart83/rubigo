//! ActionBroker Trait and Error Types
//!
//! The ActionBroker trait abstracts the transport mechanism,
//! allowing the same action dispatch code to work in both
//! Tauri (native) and Axum (browser) deployments.

use async_trait::async_trait;
use serde::{de::DeserializeOwned, Serialize};
use thiserror::Error;

/// Errors that can occur during action dispatch
#[derive(Debug, Error)]
pub enum ActionError {
    /// Serialization failed
    #[error("Failed to serialize action: {0}")]
    Serialization(String),

    /// Deserialization failed  
    #[error("Failed to deserialize response: {0}")]
    Deserialization(String),

    /// Transport error (network, IPC, etc.)
    #[error("Transport error: {0}")]
    Transport(String),

    /// Server returned an error
    #[error("Server error: {0}")]
    Server(String),

    /// Action was rejected (validation, authorization, etc.)
    #[error("Action rejected: {0}")]
    Rejected(String),
}

/// Trait for types that can be dispatched as actions
pub trait Action: Serialize + DeserializeOwned + Send + Sync + 'static {
    /// The response type for this action
    type Response: Serialize + DeserializeOwned + Send + Sync;

    /// Action identifier for routing
    fn action_type(&self) -> &'static str;
}

/// Trait for action dispatch implementations
///
/// Implementations of this trait handle the actual transport
/// of actions to the backend, whether via Tauri commands or HTTP.
#[async_trait(?Send)]
pub trait ActionBroker {
    /// Dispatch an action and await its response
    async fn dispatch<A: Action>(&self, action: A) -> Result<A::Response, ActionError>;
}

/// A broker that always fails - useful for testing or placeholder
pub struct NoOpBroker;

#[async_trait(?Send)]
impl ActionBroker for NoOpBroker {
    async fn dispatch<A: Action>(&self, _action: A) -> Result<A::Response, ActionError> {
        Err(ActionError::Transport(
            "NoOpBroker: No transport configured".to_string(),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn action_error_display() {
        let err = ActionError::Transport("connection refused".to_string());
        assert_eq!(err.to_string(), "Transport error: connection refused");
    }
}
