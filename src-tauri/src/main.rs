// Thin binary entry point. All app logic lives in the lib (Tauri v2 layout) so
// it stays reusable; desktop just calls `run()`.
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

fn main() {
    was_it_just_me_lib::run();
}
