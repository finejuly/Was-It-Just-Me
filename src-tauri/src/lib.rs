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
//
// STARTUP ROBUSTNESS (Review 6 — the built .app aborted on launch with SIGABRT):
// startup must be panic-free. The release profile uses `panic = "abort"`, so any
// panic at launch becomes a silent `abort()`. Therefore NOTHING in the launch
// path may `.expect()`/`.unwrap()`: a failed global-shortcut registration, a
// missing default icon, or a webview hiccup must log and continue, never crash.
// The app also runs as a menu-bar / accessory agent (Activation Policy =
// Accessory) — it lives in the menu bar (matching the product framing) and
// avoids the macOS foreground app-registration path implicated in the crash.

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
/// user re-activates a window that was hidden to the tray). As an accessory
/// (menu-bar) app the window starts hidden from the Dock; showing it from the
/// tray is the normal way in.
fn show_main<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.set_focus();
    }
}

pub fn run() {
    let builder = tauri::Builder::default()
        // The plugin is added with NO compile-time shortcut: registration happens
        // in `setup` where a failure can be handled gracefully (see below).
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();

            // --- Menu-bar / accessory (agent) app ---------------------------
            // Run without a Dock icon: the app lives in the menu bar. This also
            // keeps the process out of the macOS *foreground* app-registration
            // path that aborted on launch in Review 6. On the `&mut App` passed
            // to `setup` this is infallible (returns `()`), so it cannot panic.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // --- System tray ------------------------------------------------
            let notice_item =
                MenuItem::with_id(app, "notice", "I noticed something", true, None::<&str>)?;
            let show_item = MenuItem::with_id(app, "show", "Show map", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&notice_item, &show_item, &quit_item])?;

            // Build the tray. A missing default icon must NOT crash the app
            // (Review 6: any startup panic = abort). Set the icon only if present.
            let mut tray = TrayIconBuilder::with_id("wijm-tray")
                .tooltip("Was It Just Me?")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    // Tray "I noticed something": fire one signal via the web path.
                    "notice" => fire_notice(app),
                    "show" => show_main(app),
                    // Quit is the ONLY real exit (close-to-tray keeps the app alive).
                    "quit" => app.exit(0),
                    _ => {}
                });
            if let Some(icon) = app.default_window_icon().cloned() {
                tray = tray.icon(icon);
            } else {
                eprintln!("[wijm] no default window icon available; tray uses system default");
            }
            let _tray = tray.build(app)?;

            // --- Global shortcut: Cmd/Ctrl+Shift+Space ----------------------
            // Registered at runtime so a failure (e.g. the chord is already taken
            // by the OS or another app) does NOT panic/abort the launch. The tray
            // "I noticed something" and the in-window Space hotkey remain working
            // fallbacks for the demo if the OS-global chord can't be claimed.
            register_global_shortcut(&handle);

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
        });

    // Run the app. Do NOT `.expect()` here: with `panic = "abort"` an expect on a
    // runtime error would SIGABRT (the Review 6 failure mode). Log instead.
    if let Err(e) = builder.run(tauri::generate_context!()) {
        eprintln!("[wijm] desktop shell exited with error: {e}");
    }
}

/// Register `Cmd/Ctrl+Shift+Space` to fire a single notice event (decision #3),
/// at runtime, tolerating failure. The shortcut fires while the app is
/// unfocused/backgrounded — that is the whole point of the native shell. If the
/// chord cannot be registered, we log and continue: the app still launches and
/// the tray / in-window notice paths still work.
fn register_global_shortcut<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    use tauri_plugin_global_shortcut::{
        Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
    };

    // CmdOrCtrl + Shift + Space. On macOS this is Cmd+Shift+Space; elsewhere
    // Ctrl+Shift+Space. `SUPER` maps to Cmd on macOS.
    let chord = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::Space);

    let result = app.global_shortcut().on_shortcut(chord, move |app, _shortcut, event| {
        // Fire once per press (on key-down), not on release, so a single chord
        // press produces exactly one signal.
        if event.state() == ShortcutState::Pressed {
            fire_notice(app);
        }
    });

    if let Err(e) = result {
        eprintln!(
            "[wijm] global shortcut Cmd/Ctrl+Shift+Space not registered ({e}); \
             use the tray \"I noticed something\" item or the in-window Space hotkey instead"
        );
    }
}
