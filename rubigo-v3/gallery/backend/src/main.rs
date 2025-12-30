//! Gallery Backend - Axum server for Component Gallery
//! 
//! Serves spec files and proxies to Vite for frontend assets.

use axum::{
    Router,
    routing::get,
    http::{Request, StatusCode, Uri},
    body::Body,
};
use hyper_util::{client::legacy::Client, rt::TokioExecutor};
use http_body_util::BodyExt;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod routes;

const GALLERY_PORT: u16 = 37002;
const VITE_PORT: u16 = 37003;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        // API routes
        .route("/api/specs", get(routes::specs::list_specs))
        .route("/api/specs/{id}", get(routes::specs::get_spec))
        .route("/api/vectors/{id}", get(routes::vectors::get_vectors))
        // Health check
        .route("/api/health", get(|| async { "ok" }))
        // Vite proxy for everything else
        .fallback(vite_proxy)
        .layer(cors);

    let addr = format!("0.0.0.0:{}", GALLERY_PORT);
    tracing::info!("🖼️  Gallery backend listening on http://localhost:{}", GALLERY_PORT);
    tracing::info!("   Proxying to Vite dev server on port {}", VITE_PORT);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

/// Proxy requests to Vite dev server
async fn vite_proxy(req: Request<Body>) -> Result<axum::response::Response, StatusCode> {
    let uri = req.uri().clone();
    let path = uri.path();
    
    // Build target URI
    let target_uri = format!("http://127.0.0.1:{}{}", VITE_PORT, path);
    let target_uri: Uri = target_uri.parse().map_err(|_| StatusCode::BAD_REQUEST)?;

    // Create hyper client
    let client: Client<_, Body> = Client::builder(TokioExecutor::new())
        .build_http();

    // Build new request
    let (parts, body) = req.into_parts();
    let mut new_req = Request::builder()
        .method(parts.method)
        .uri(target_uri);
    
    // Copy headers
    for (key, value) in parts.headers.iter() {
        new_req = new_req.header(key, value);
    }

    let new_req = new_req.body(body).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Send request
    match client.request(new_req).await {
        Ok(resp) => {
            let (parts, body) = resp.into_parts();
            let body_bytes = body.collect().await.map_err(|_| StatusCode::BAD_GATEWAY)?.to_bytes();
            let body = Body::from(body_bytes);
            Ok(axum::response::Response::from_parts(parts, body))
        }
        Err(_) => {
            // Vite not running - return helpful message
            Ok(axum::response::Response::builder()
                .status(StatusCode::SERVICE_UNAVAILABLE)
                .body(Body::from("Vite dev server not running. Start it with: just gallery-frontend"))
                .unwrap())
        }
    }
}
