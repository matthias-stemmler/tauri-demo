use error::Error;
use serde::Serialize;
use std::{collections::BTreeSet, time::Duration};
use tauri::{Emitter, Manager};

mod error;
mod port_listener;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Channel to request refresh from commands to polling task
    let (refresh_tx, mut refresh_rx) = tauri::async_runtime::channel(1);

    tauri::Builder::default()
        // Tell Tauri to manage the state for us
        .manage(AppState::new(refresh_tx))
        // Register command handlers
        .invoke_handler(tauri::generate_handler![refresh, kill_process])
        .setup(|app| {
            // Need to get a "handle" and clone it because the app is not 'static
            let app_handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                loop {
                    // Repeatedly wait for some amount of time *or* until a refresh is requested
                    tokio::select! {
                        _ = tokio::time::sleep(Duration::from_secs(5)) => {}
                        _ = refresh_rx.recv() => {}
                    };

                    // Get port listeners and emit event
                    match app_handle
                        .state::<AppState>()
                        .manager
                        .get_port_listeners()
                        .await
                    {
                        Ok(port_listeners) => app_handle.emit(
                            "port_listeners_updated",
                            PortListenersUpdatedEvent { port_listeners },
                        ),
                        Err(err) => app_handle.emit("error", err),
                    }
                    .expect("should emit event");
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("should run Tauri application");
}

#[derive(Debug)]
struct AppState {
    manager: port_listener::Manager,
    refresh_tx: tauri::async_runtime::Sender<()>,
}

impl AppState {
    fn new(refresh_tx: tauri::async_runtime::Sender<()>) -> AppState {
        AppState {
            manager: port_listener::Manager::new(),
            refresh_tx,
        }
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PortListenersUpdatedEvent {
    // Make it a BTreeSet so it's serialized in sorted order (order is defined by the `Ord`/`PartialOrd` impl of `port_listener::PortListener`)
    port_listeners: BTreeSet<port_listener::PortListener>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[tauri::command]
async fn refresh(state: tauri::State<'_, AppState>) -> Result<(), Error> {
    state.refresh_tx.send(()).await?;
    Ok(())
}

#[tauri::command]
async fn kill_process(state: tauri::State<'_, AppState>, process_id: u32) -> Result<(), Error> {
    state.manager.kill_process(process_id).await?;
    state.refresh_tx.send(()).await?;
    Ok(())
}
