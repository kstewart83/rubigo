//! HTTP ActionBroker Implementation
//!
//! Dispatches actions to the server via HTTP POST requests.
//! Used in browser/Axum deployments.

use crate::broker::{Action, ActionBroker, ActionError};
use async_trait::async_trait;

/// HTTP-based action broker for browser deployments
pub struct HttpBroker {
    base_url: String,
}

impl HttpBroker {
    /// Create a new HTTP broker with the given base URL
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            base_url: base_url.into(),
        }
    }

    /// Create a broker pointing to the current origin
    pub fn from_origin() -> Self {
        // In browser, we can use relative URLs
        Self::new("/api/actions")
    }
}

#[async_trait(?Send)]
impl ActionBroker for HttpBroker {
    async fn dispatch<A: Action>(&self, action: A) -> Result<A::Response, ActionError> {
        // Serialize the action
        let body = serde_json::to_string(&action)
            .map_err(|e| ActionError::Serialization(e.to_string()))?;

        // Build the request URL with action type as path segment
        let url = format!("{}/{}", self.base_url, action.action_type());

        // In a real implementation, this would use gloo-net or reqwest
        // For now, we'll use a cfg-based approach for wasm vs native

        #[cfg(target_arch = "wasm32")]
        {
            use gloo_net::http::Request;

            let response = Request::post(&url)
                .header("Content-Type", "application/json")
                .body(&body)
                .map_err(|e| ActionError::Transport(e.to_string()))?
                .send()
                .await
                .map_err(|e| ActionError::Transport(e.to_string()))?;

            if !response.ok() {
                let status = response.status();
                let text = response.text().await.unwrap_or_default();
                return Err(ActionError::Server(format!("HTTP {}: {}", status, text)));
            }

            let text = response
                .text()
                .await
                .map_err(|e| ActionError::Transport(e.to_string()))?;

            serde_json::from_str(&text).map_err(|e| ActionError::Deserialization(e.to_string()))
        }

        #[cfg(not(target_arch = "wasm32"))]
        {
            // Native implementation would use reqwest
            // For now, return an error as this is primarily for WASM
            let _ = (url, body);
            Err(ActionError::Transport(
                "HttpBroker requires WASM target. Use native client for non-browser.".to_string(),
            ))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn http_broker_url_construction() {
        let broker = HttpBroker::new("https://api.example.com");
        assert_eq!(broker.base_url, "https://api.example.com");
    }

    #[test]
    fn http_broker_from_origin() {
        let broker = HttpBroker::from_origin();
        assert_eq!(broker.base_url, "/api/actions");
    }
}
