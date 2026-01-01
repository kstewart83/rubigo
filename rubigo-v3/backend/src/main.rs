//! Rubigo V3 Backend
//!
//! Axum-based server that:
//! - Serves API routes under `/api/*`
//! - In dev mode: proxies frontend requests to Vite dev server
//! - In prod mode: serves static files from `frontend/dist`

use axum::{
    body::Body,
    extract::State,
    http::{Request, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::get,
    Router,
};
use hyper_util::{client::legacy::Client, rt::TokioExecutor};
use std::net::SocketAddr;
use std::path::PathBuf;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

/// Application state
#[derive(Clone)]
struct AppState {
    /// Vite dev server URL for proxying (only in dev mode)
    vite_url: Option<String>,
    /// Path to static files (only in prod mode)
    static_dir: Option<PathBuf>,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "rubigo_v3_backend=debug,tower_http=debug".into()),
        )
        .init();

    // Determine mode based on environment
    let is_dev = std::env::var("DEV").is_ok() || !PathBuf::from("frontend/dist").exists();
    
    let vite_port = std::env::var("VITE_PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(37001);
    
    let state = if is_dev {
        tracing::info!("🔧 Development mode - proxying to Vite at port {}", vite_port);
        AppState {
            vite_url: Some(format!("http://127.0.0.1:{}", vite_port)),
            static_dir: None,
        }
    } else {
        tracing::info!("📦 Production mode - serving from frontend/dist");
        AppState {
            vite_url: None,
            static_dir: Some(PathBuf::from("frontend/dist")),
        }
    };

    // Build API routes
    let api_routes = Router::new()
        .route("/hello", get(api_hello))
        .route("/health", get(|| async { "OK" }));

    // Build main router
    let app = Router::new()
        .nest("/api", api_routes)
        // Fallback handles frontend (either proxy or static)
        .fallback(frontend_handler)
        .with_state(state)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive());

    // Get port from environment
    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(37000u16);

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    tracing::info!("🚀 Rubigo V3 backend listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

/// Handle frontend requests - proxy to Vite or serve static
async fn frontend_handler(
    State(state): State<AppState>,
    req: Request<Body>,
) -> Response {
    // Dev mode: proxy to Vite
    if let Some(vite_url) = &state.vite_url {
        return proxy_to_vite(vite_url, req).await;
    }

    // Prod mode: serve static files
    if let Some(static_dir) = &state.static_dir {
        let path = req.uri().path();
        let file_path = static_dir.join(path.trim_start_matches('/'));
        
        // If file exists, serve it; otherwise serve index.html (SPA)
        if file_path.exists() && file_path.is_file() {
            return serve_static_file(&file_path).await;
        } else {
            return serve_static_file(&static_dir.join("index.html")).await;
        }
    }

    // Fallback: simple HTML page
    Html(r#"<!DOCTYPE html>
<html>
<head><title>Rubigo V3</title></head>
<body>
<h1>Rubigo V3</h1>
<p>Frontend not configured. Run <code>just frontend-build</code> or start Vite dev server.</p>
</body>
</html>"#).into_response()
}

/// Proxy request to Vite dev server
async fn proxy_to_vite(vite_url: &str, req: Request<Body>) -> Response {
    let client: Client<_, Body> = Client::builder(TokioExecutor::new())
        .build_http();

    let uri = format!("{}{}", vite_url, req.uri().path_and_query().map(|pq| pq.as_str()).unwrap_or("/"));
    
    let proxy_req = Request::builder()
        .method(req.method())
        .uri(&uri)
        .body(req.into_body())
        .unwrap();

    match client.request(proxy_req).await {
        Ok(res) => {
            let (parts, body) = res.into_parts();
            Response::from_parts(parts, Body::new(body))
        }
        Err(e) => {
            tracing::warn!("Proxy error (Vite may not be running): {}", e);
            (
                StatusCode::BAD_GATEWAY,
                Html(format!(r#"<!DOCTYPE html>
<html>
<head>
    <title>Vite Not Running</title>
    <style>
        body {{ font-family: system-ui; background: #1a1a2e; color: #eee; padding: 2rem; }}
        code {{ background: #333; padding: 0.25rem 0.5rem; border-radius: 4px; }}
    </style>
</head>
<body>
    <h1>⚠️ Vite Dev Server Not Running</h1>
    <p>The frontend dev server is not responding at <code>{}</code></p>
    <p>Start it with: <code>just frontend-dev</code></p>
    <p>Or use the full dev command: <code>just dev</code></p>
    <hr>
    <p><small>Error: {}</small></p>
</body>
</html>"#, vite_url, e))
            ).into_response()
        }
    }
}

/// Serve a static file
async fn serve_static_file(path: &PathBuf) -> Response {
    match tokio::fs::read(path).await {
        Ok(contents) => {
            let mime = mime_guess::from_path(path)
                .first_or_octet_stream()
                .to_string();
            Response::builder()
                .header("Content-Type", mime)
                .body(Body::from(contents))
                .unwrap()
        }
        Err(_) => StatusCode::NOT_FOUND.into_response(),
    }
}

/// Simple API endpoint
async fn api_hello() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({
        "message": "Hello from Rubigo V3 API!",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}
