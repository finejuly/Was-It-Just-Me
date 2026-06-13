// "Was It Just Me?" — Tauri v2 desktop shell.
//
// PRIVACY POSTURE (important): this native layer contains NO location data and
// NO privacy logic. It never computes, stores, or transmits a latitude or
// longitude. The tray "I noticed something" item and the OS-global shortcut do
// exactly one thing: emit a `wijm://notice` event to the webview. The web app's
// UNCHANGED `sendSignal()` path then runs `transformSignal` (jitter + bucketing)
// and `SignalStore.add` — byte-for-byte the same path as the in-page Space
// hotkey. There is a single privacy implementation, and it lives in the web code.
//
// User decisions applied (ISSUE-202606131317, approved):
//   - bridge mechanism = Tauri EVENT (frontend listens, calls sendSignal())
//   - global shortcut  = Cmd/Ctrl+Shift+Space
//   - close behavior   = keep running (hide window to tray; tray Quit exits)
//   - packaging        = macOS only (handled in tauri.conf.json bundle targets)

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, WindowEvent,
};

/// The single event the native shell fires; the webview listens for it and runs
/// the unchanged web send path. Keep this string in sync with `src/main.ts`.
const NOTICE_EVENT: &str = "wijm://notice";

/// Emit the "notice" event to the whole app. The frontend listener turns this
/// into one call to the existing `sendSignal()` (privacy applied there).
fn fire_notice<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    // Payload is empty on purpose: the native side knows nothing about location.
    let _ = app.emit(NOTICE_EVENT, ());
}

/// Show + focus the main window (used by the tray "Show map" item and when the
/// user re-activates a window that was hidden to the tray).
fn show_main<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.set_focus();
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(build_global_shortcut())
        .setup(|app| {
            let handle = app.handle();

            // --- System tray ------------------------------------------------
            let notice_item =
                MenuItem::with_id(app, "notice", "I noticed something", true, None::<&str>)?;
            let show_item =
                MenuItem::with_id(app, "show", "Show map", true, None::<&str>)?;
            let quit_item =
                MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&notice_item, &show_item, &quit_item])?;

            let _tray = TrayIconBuilder::with_id("wijm-tray")
                .tooltip("Was It Just Me?")
                .icon(app.default_window_icon().cloned().unwrap())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    // Tray "I noticed something": fire one signal via the web path.
                    "notice" => fire_notice(app),
                    "show" => show_main(app),
                    // Quit is the ONLY real exit (close-to-tray keeps the app alive).
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            // --- Close behavior: keep running (hide to tray) ----------------
            // Decision #4: closing the window does not quit; it hides so the
            // background global hotkey keeps working. Quit only via the tray.
            if let Some(win) = handle.get_webview_window("main") {
                let win_handle = win.clone();
                win.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = win_handle.hide();
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the Was It Just Me? desktop shell");
}

/// Build the global-shortcut plugin with `Cmd/Ctrl+Shift+Space` bound to fire a
/// single notice event (decision #3). The plugin fires while the app is
/// unfocused/backgrounded — that is the whole point of the native shell.
fn build_global_shortcut<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    use tauri_plugin_global_shortcut::{
        Builder as ShortcutBuilder, Code, Modifiers, Shortcut, ShortcutState,
    };

    // CmdOrCtrl + Shift + Space. On macOS this is Cmd+Shift+Space; elsewhere
    // Ctrl+Shift+Space. `SUPER` maps to Cmd on macOS.
    let chord = Shortcut::new(
        Some(Modifiers::SUPER | Modifiers::SHIFT),
        Code::Space,
    );

    ShortcutBuilder::new()
        .with_shortcut(chord)
        .expect("failed to register global shortcut Cmd/Ctrl+Shift+Space")
        .with_handler(move |app, _shortcut, event| {
            // Fire once per press (on key-down), not on release, so a single
            // chord press produces exactly one signal.
            if event.state() == ShortcutState::Pressed {
                fire_notice(app);
            }
        })
        .build()
}
