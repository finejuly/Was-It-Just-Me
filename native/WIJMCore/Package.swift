// swift-tools-version:6.2
// SwiftPM package for the native macOS sender's privacy bridge (TASK-202606131313, increment A).
//
// WIJMCore embeds JavaScriptCore (a macOS-bundled framework — no third-party deps)
// and calls the UNCHANGED TypeScript privacy core (bundled to Resources/wijm-core.js
// by `npm run build:core`). This is the de-risking spine for the menu-bar app:
// it proves Swift -> JSC -> tested privacy core parity, fully offline, before any
// NSStatusItem GUI / global hotkey is layered on (increment B).
import PackageDescription

let package = Package(
    name: "WIJMCore",
    platforms: [.macOS(.v12)],
    targets: [
        .target(
            name: "WIJMCore",
            // The JS bundle is shipped as a package resource and loaded at runtime
            // via Bundle.module. Regenerate it with `npm run build:core`.
            resources: [.copy("Resources/wijm-core.js")]
        ),
        .testTarget(
            name: "WIJMCoreTests",
            dependencies: ["WIJMCore"]
        ),
    ]
)
