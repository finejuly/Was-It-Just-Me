---
id: 202606131314
title: Swift toolchain/SDK version skew blocks building the native sender — realign Command Line Tools?
status: pending
type: blocker
created: 2026-06-13
raised_by: loop-orchestrate (loop #9)
relates_to: TASK-202606131313 (native menu-bar sender, increment A)
blocks: swift build / swift test for the native macOS sender
---

## Context
Loop #9 implemented increment A of the approved native menu-bar sender (TASK-...1313): the privacy bridge that lets the Swift app reuse the **unchanged, tested** TS privacy core via JavaScriptCore. The **JS half is done and verified offline** (`npm run build:core` produces the bundle; `src/core/bridge.test.ts` pins the exact contract; `npm test` is 57/57). The Swift sources are written (`native/WIJMCore/`: `Package.swift`, `SignalCore.swift`, parity tests).

**But Swift cannot compile on this machine.** Building reports a toolchain/SDK mismatch:

```
failed to build module 'Foundation'; this SDK is not supported by the compiler
(the SDK is built with 'Apple Swift version 6.2.1 ... swiftlang-6.2.1.4.7 ...',
 while this compiler is 'Apple Swift version 6.2.1 ... swiftlang-6.2.1.4.8 ...').
Please select a toolchain which matches the SDK.
```

This is **environment-wide, not a defect in our package** — verified two ways:
- A trivial empty SwiftPM package (`Package(name: "T", targets: [.target(name:"T")])`) fails the same way (manifest link error: undefined `PackageDescription.Package.__allocating_init`).
- A one-file `swiftc hello.swift` importing `Foundation` fails with the SDK-vs-compiler skew above.

`xcode-select -p` → `/Library/Developer/CommandLineTools`; `swift --version` → 6.2.1 (`swiftlang-6.2.1.4.8`); the SDK at that CLT path was built with `...4.7`. So the CLT's SDK and its compiler are out of sync.

## Why this needs you
It's a machine-level toolchain fix outside what the loop can safely do (it touches your system dev tools). The native sender (an approved, high-priority build) can't be `swift build`/`swift test`-verified until it's resolved.

## Options
1. **Reinstall / update the Command Line Tools** so the SDK and compiler match:
   `sudo rm -rf /Library/Developer/CommandLineTools && sudo xcode-select --install`
   (or update via Software Update / `softwareupdate --list`/`--install`). Re-aligns `...4.7` SDK with the `...4.8` compiler.
2. **If full Xcode is installed**, point the toolchain at it (its SDK+compiler are matched):
   `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
3. **Defer the native build for the hackathon** and ship the web app (current 57/57, working demo) as-is; keep the Swift bridge code in-tree for later. Lowest risk if the deadline is close — the web app already satisfies the live-demo spine.

## Recommendation
If you want the native sender for the demo: **Option 2 if Xcode.app is installed** (fastest), else **Option 1**. After fixing, `cd native/WIJMCore && swift build && swift test` should pass unchanged (the JS privacy contract is already green). If the deadline is tight, **Option 3** is a safe fallback — the web app is the working demo and the native work resumes post-toolchain-fix.

## How to answer
Move this file to `Issues/approved/` with a one-line note of which option you took (and run the fix), or to `Issues/rejected/` to defer the native sender (Option 3). Then loop #10 will re-run `swift build && swift test` and, if green, mark TASK-...1313 done and start increment B (TASK-...1315).

# Response

