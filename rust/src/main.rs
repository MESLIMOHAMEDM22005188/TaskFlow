mod realtime;
mod web;

use std::{env, net::SocketAddr, sync::Arc};

use axum::{routing::get, Router};
use realtime::RoomHub;
use sqlx::{mysql::MySqlPoolOptions, MySqlPool};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::EnvFilter;

#[derive(Clone)]
pub struct AppState {
    pub db: Option<MySqlPool>,
    pub rooms: Arc<RoomHub>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .init();

    let db = match env::var("DATABASE_URL") {
        Ok(url) if !url.trim().is_empty() => {
            let pool = MySqlPoolOptions::new()
                .max_connections(env::var("DB_CONNECTION_LIMIT").ok().and_then(|v| v.parse().ok()).unwrap_or(5))
                .connect(&url)
                .await?;
            tracing::info!("MariaDB connection pool ready");
            Some(pool)
        }
        _ => {
            tracing::warn!("DATABASE_URL is not set; starting in preview mode without persistence");
            None
        }
    };

    let state = AppState {
        db,
        rooms: Arc::new(RoomHub::default()),
    };

    let app = Router::new()
        .route("/", get(web::home))
        .route("/health", get(web::health))
        .route("/ws", get(realtime::websocket))
        .with_state(state)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let port = env::var("PORT").ok().and_then(|v| v.parse().ok()).unwrap_or(8100);
    let address = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(address).await?;
    tracing::info!(%address, "Grindly Rust server listening");
    axum::serve(listener, app).await?;

    Ok(())
}
