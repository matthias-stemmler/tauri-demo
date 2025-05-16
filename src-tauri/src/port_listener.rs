/// The actual "business" logic, a small wrapper around the `netstat2` and `sysinfo` crates
use crate::error::Error;
use serde::Serialize;
use std::sync::{Arc, Mutex};

#[derive(Debug, Default)]
pub(crate) struct Manager {
    system: Arc<Mutex<sysinfo::System>>,
}

impl Manager {
    pub(crate) fn new() -> Self {
        Self::default()
    }

    pub(crate) async fn get_port_listeners<C: FromIterator<PortListener> + Send + 'static>(
        &self,
    ) -> Result<C, Error> {
        let system = Arc::clone(&self.system);

        let port_listeners =
            tauri::async_runtime::spawn_blocking::<_, Result<_, Error>>(move || {
                let mut system = system.lock().unwrap();
                system.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

                Ok(netstat2::get_sockets_info(
                    netstat2::AddressFamilyFlags::all(),
                    netstat2::ProtocolFlags::all(),
                )?
                .into_iter()
                .flat_map(|socket_info| {
                    let port = socket_info.local_port();
                    let system = &system;

                    socket_info
                        .associated_pids
                        .into_iter()
                        .flat_map(move |process_id| {
                            system
                                .process(sysinfo::Pid::from_u32(process_id))
                                .map(|process| PortListener {
                                    port,
                                    process_id,
                                    process_name: process.name().to_string_lossy().into(),
                                })
                        })
                })
                .collect())
            })
            .await??; // outer error = panics caught by the async runtime, inner error = error returned by the spawned closure

        Ok(port_listeners)
    }

    pub(crate) async fn kill_process(&self, process_id: u32) -> Result<(), Error> {
        let system = Arc::clone(&self.system);

        tauri::async_runtime::spawn_blocking(move || {
            let pid = sysinfo::Pid::from_u32(process_id);

            let killed = {
                let mut system = system.lock().unwrap();
                system.refresh_processes(sysinfo::ProcessesToUpdate::Some(&[pid]), true);
                system
                    .process(pid)
                    .map(|process| process.kill())
                    .unwrap_or(false)
            };

            if killed {
                Ok(())
            } else {
                Err(Error::new("Failed to kill process".into()))
            }
        })
        .await??;

        Ok(())
    }
}

#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PortListener {
    // Order of fields determines the derived implementation of `Ord`/`PartialOrd`
    port: u16,
    process_name: String,
    process_id: u32,
}
