use std::{collections::HashMap, sync::{Arc, Mutex}};

use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, Query, State},
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::AppState;

const ROOM_CAPACITY: usize = 128;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ChatEvent {
    pub id: Uuid,
    pub room: String,
    pub author: String,
    pub content: String,
    pub sent_at: String,
}

#[derive(Default)]
pub struct RoomHub {
    rooms: Mutex<HashMap<String, broadcast::Sender<ChatEvent>>>,
}

impl RoomHub {
    fn subscribe(&self, room: &str) -> broadcast::Receiver<ChatEvent> {
        let mut rooms = self.rooms.lock().expect("room hub mutex poisoned");
        rooms
            .entry(room.to_owned())
            .or_insert_with(|| broadcast::channel(ROOM_CAPACITY).0)
            .subscribe()
    }

    fn publish(&self, event: ChatEvent) {
        let rooms = self.rooms.lock().expect("room hub mutex poisoned");
        if let Some(sender) = rooms.get(&event.room) {
            let _ = sender.send(event);
        }
    }
}

#[derive(Deserialize)]
pub struct RoomQuery {
    room: Option<String>,
}

pub async fn websocket(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Query(query): Query<RoomQuery>,
) -> impl IntoResponse {
    let room = query.room.unwrap_or_else(|| "general".to_owned());
    let room = sanitize_room(&room);
    ws.on_upgrade(move |socket| handle_socket(socket, state, room))
}

fn sanitize_room(value: &str) -> String {
    let cleaned: String = value.chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
        .take(40)
        .collect();
    if cleaned.is_empty() { "general".to_owned() } else { cleaned }
}

async fn handle_socket(socket: WebSocket, state: AppState, room: String) {
    let (mut sender, mut receiver) = socket.split();
    let mut room_rx = state.rooms.subscribe(&room);

    let welcome = serde_json::json!({
        "type": "system",
        "room": room,
        "content": "Connecté au salon. Les messages sont temporaires dans cette première version."
    });
    if sender.send(Message::Text(welcome.to_string().into())).await.is_err() {
        return;
    }

    loop {
        tokio::select! {
            incoming = receiver.next() => {
                let Some(Ok(message)) = incoming else { break; };
                match message {
                    Message::Text(text) => {
                        if text.len() > 2000 { continue; }
                        let Ok(mut event) = serde_json::from_str::<ChatEvent>(&text) else { continue; };
                        event.id = Uuid::new_v4();
                        event.room = room.clone();
                        event.author = event.author.chars().take(32).collect();
                        event.content = event.content.trim().chars().take(1000).collect();
                        if event.content.is_empty() { continue; }
                        state.rooms.publish(event);
                    }
                    Message::Close(_) => break,
                    Message::Ping(payload) => {
                        if sender.send(Message::Pong(payload)).await.is_err() { break; }
                    }
                    _ => {}
                }
            }
            outgoing = room_rx.recv() => {
                match outgoing {
                    Ok(event) => {
                        let payload = match serde_json::to_string(&event) {
                            Ok(value) => value,
                            Err(_) => continue,
                        };
                        if sender.send(Message::Text(payload.into())).await.is_err() { break; }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(broadcast::error::RecvError::Closed) => break,
                }
            }
        }
    }
}
