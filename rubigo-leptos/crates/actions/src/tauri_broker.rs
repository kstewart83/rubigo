//! Tauri ActionBroker Implementation
//!
//! Dispatches actions to the Tauri backend via IPC invoke.
//! Used in desktop deployments.

use crate::broker::{Action, ActionBroker, ActionError};

#[cfg(target_arch = "wasm32")]
use async_trait::async_trait;

/// Tauri-based action broker for desktop deployments
///
/// Uses Tauri's `invoke` command to dispatch actions to the Rust backend.
pub struct TauriBroker;

impl TauriBroker {
    /// Create a new Tauri broker
    pub fn new() -> Self {
        Self
    }
}

impl Default for TauriBroker {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(target_arch = "wasm32")]
#[async_trait(?Send)]
impl ActionBroker for TauriBroker {
    async fn dispatch<A: Action>(&self, action: A) -> Result<A::Response, ActionError> {
        use wasm_bindgen::prelude::*;
        use wasm_bindgen::JsValue;
        use wasm_bindgen_futures::JsFuture;

        // Import Tauri's invoke function
        #[wasm_bindgen]
        extern "C" {
            #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "core"], js_name = invoke)]
            fn tauri_invoke(cmd: &str, args: JsValue) -> js_sys::Promise;
        }

        // Serialize the action
        let action_data =
            serde_json::to_value(&action).map_err(|e| ActionError::Serialization(e.to_string()))?;

        // Create the args object with action_type and payload
        let args = serde_json::json!({
            "actionType": action.action_type(),
            "payload": action_data
        });

        let args_js = serde_wasm_bindgen::to_value(&args)
            .map_err(|e| ActionError::Serialization(e.to_string()))?;

        // Invoke the Tauri command
        let promise = tauri_invoke("dispatch_action", args_js);
        let result = JsFuture::from(promise).await.map_err(|e| {
            let msg = e
                .as_string()
                .unwrap_or_else(|| "Unknown Tauri error".to_string());
            ActionError::Transport(msg)
        })?;

        // Deserialize the response
        let response: A::Response = serde_wasm_bindgen::from_value(result)
            .map_err(|e| ActionError::Deserialization(e.to_string()))?;

        Ok(response)
    }
}

#[cfg(not(target_arch = "wasm32"))]
impl ActionBroker for TauriBroker {
    fn dispatch<'life0, 'async_trait, A: Action>(
        &'life0 self,
        _action: A,
    ) -> std::pin::Pin<
        Box<dyn std::future::Future<Output = Result<A::Response, ActionError>> + 'async_trait>,
    >
    where
        'life0: 'async_trait,
        Self: 'async_trait,
    {
        Box::pin(async move {
            Err(ActionError::Transport(
                "TauriBroker requires WASM target in Tauri WebView".to_string(),
            ))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tauri_broker_creation() {
        let _broker = TauriBroker::new();
        let _broker2 = TauriBroker::default();
    }
}
