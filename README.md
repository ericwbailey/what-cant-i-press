# What Can't I Press

A macOS and Windows menu-bar app that audits which keyboard shortcuts are already
reserved — by the operating system and by running applications — so a combination
that is free for a new binding can be identified at a glance.

Clicking the tray icon collects reserved shortcuts and presents them in three
segments:

- **Global — operating system.** Reserved system-wide by the OS, always active
  (for example Spotlight's `⌘Space`, or `⇧⌘3` for screenshots).
- **Global — app (works when the app is not focused).** Registered system-wide by a
  running third-party app. Active while that app runs, regardless of which window is
  focused (for example a launcher's activation hotkey).
- **App menu (works only when that app is focused).** Menu accelerators, active only
  while the owning app is frontmost (for example `⌘W` to close a tab).

Each row is labelled with its source: **detected** (read live from the system) or
**curated** (from the bundled database, see [Data sources](#data-sources)).

## Data sources

No public OS API enumerates the global hotkeys registered by *other* processes.
Neither macOS (`RegisterEventHotKey`) nor Windows (`RegisterHotKey`) exposes the
registrations of another app. The "works when the app is not focused" segment
therefore cannot be produced by live detection and is sourced from a curated
database instead. Everything else is read live:

| Segment                | macOS source                                   | Windows source                          |
| ---------------------- | ---------------------------------------------- | --------------------------------------- |
| Global — operating system | `com.apple.symbolichotkeys` (detected)      | Curated OS-shortcut list                |
| Global — app           | Curated database, matched to running apps      | Curated database, matched to running apps |
| App menu               | Accessibility API — `AXMenuItem*` (detected)   | UI Automation accelerators (detected)   |

## Requirements

- Node.js 22+ and npm.
- **macOS build:** Xcode command-line tools (`swiftc`) to compile the helper.
- **Windows build:** the .NET SDK (`dotnet`) to publish the helper. The helper must
  be built on a Windows host; it cannot be cross-compiled from macOS.

## Develop

```sh
npm install
npm run build:helper:mac   # on macOS — compiles the Swift Accessibility helper
npm run dev
```

`npm run dev` starts electron-vite with hot reload. On macOS, grant Accessibility
permission (see [Permissions](#permissions)) before the app-menu scan returns data.

Type-check without building:

```sh
npm run typecheck
```

## Package

```sh
npm run build:mac   # → dist/*.dmg and dist/*.zip
npm run build:win   # → dist/*.exe  (run on Windows)
```

Each command builds the renderer, compiles the platform helper into `resources/bin`,
and runs electron-builder. `build:mac` signs under the hardened runtime using
`build/entitlements.mac.plist`; supply signing identity and notarization credentials
through the standard electron-builder environment variables for a distributable
build.

## Permissions

### macOS

The app-menu scan uses the Accessibility API, which requires explicit permission.
The in-app banner links to the setting; to grant it manually:

1. Open **System Settings → Privacy & Security → Accessibility**.
2. Enable **What Can't I Press** (in development, enable the **Electron** entry).
3. Reopen the popover and scan again.

The full "scan all apps" sweep also sends Apple events to briefly activate each
running app; macOS may prompt for Automation permission the first time.

### Windows

UI Automation needs no up-front permission for ordinary apps. Reading menu
accelerators from an app running **elevated** (as administrator) requires this app
to run elevated as well; otherwise those apps are silently skipped.

## Using it

- Click the tray icon to open the popover.
- **Scan** reads the OS shortcuts, the curated global hotkeys for running apps, and
  the frontmost app's menu accelerators.
- **Scan all apps** additionally activates each running app in turn to read its menus,
  then restores the app that was frontmost. This is disruptive (each app flashes
  forward) and is gated behind a confirmation dialog.
- Filter the results with the search box; click any row to copy its combination.

## Known limitations

- **Third-party global hotkeys are curated defaults.** They reflect each app's
  out-of-the-box bindings, not a user's custom remaps, and require ongoing
  maintenance as apps change.
- **Global hotkeys of other apps are not live-enumerable** on either platform; this
  is an OS constraint, not an implementation gap.
- **Scan-all is disruptive and slow** in proportion to the number of running apps,
  because each must be activated to expose its menus.
- **macOS app-menu reading needs Accessibility permission;** without it, only OS and
  curated shortcuts are returned.
- **Windows menus** are read via UI Automation for the focused window; some apps
  expose accelerators only once a menu is opened, and elevated apps are skipped
  unless this app is elevated too.
- **The Windows helper is untested on this machine** (built and verified on a
  Windows host is required).

## Extending the curated database

Global-hotkey defaults for third-party apps live in
`src/main/core/curated-data.ts`. Each entry keys on a macOS bundle id / Windows
process name (plus name aliases) and lists `{ combo, description }` shortcuts.
Add an app by appending an entry there; it is matched against running apps at scan
time and surfaced in the **Global — app** segment.

## Project layout

```
src/main/            Electron main process
  core/              schema, aggregation, curated database + matcher, scan runner
  providers/macos/   Swift-helper wiring, symbolic-hotkeys + menu decoders
  providers/windows/ UIA-helper wiring, accelerator parser, curated OS list
  ipc.ts window.ts   typed IPC, tray + frameless popover, scan guard
src/renderer/        popover UI (segmented results, filter, copy, banner)
src/shared/          domain model, combo formatting, segment labels
native/macos/        Swift Accessibility helper + build script
native/windows/      .NET UI Automation helper + build script
```
