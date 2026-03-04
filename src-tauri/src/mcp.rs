use std::io::{BufRead, BufReader, Write};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use tauri::{AppHandle, Emitter, State};

pub struct McpState {
    pub process: Mutex<Option<Child>>,
}

impl Default for McpState {
    fn default() -> Self {
        Self {
            process: Mutex::new(None),
        }
    }
}

#[tauri::command]
pub fn start_mcp_server(
    app: AppHandle,
    state: State<'_, McpState>,
    command: String,
    args: Vec<String>,
) -> Result<(), String> {
    let mut child = Command::new(command)
        .args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    let mut proc_guard = state.process.lock().unwrap();
    if let Some(mut old_proc) = proc_guard.take() {
        let _ = old_proc.kill();
    }

    *proc_guard = Some(child);
    drop(proc_guard);

    let app_clone = app.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for l in reader.lines().map_while(Result::ok) {
            let _ = app_clone.emit("mcp-stdout", l);
        }
    });

    let app_clone2 = app.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for l in reader.lines().map_while(Result::ok) {
            let _ = app_clone2.emit("mcp-stderr", l);
        }
    });

    Ok(())
}

#[tauri::command]
pub fn send_mcp_message(state: State<'_, McpState>, message: String) -> Result<(), String> {
    let mut proc_guard = state.process.lock().unwrap();
    if let Some(child) = proc_guard.as_mut() {
        if let Some(stdin) = child.stdin.as_mut() {
            let msg = format!("{}\n", message);
            stdin.write_all(msg.as_bytes()).map_err(|e| e.to_string())?;
            let _ = stdin.flush(); // Ensure the message is sent immediately
        }
    }
    Ok(())
}
