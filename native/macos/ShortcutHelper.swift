import Foundation
import AppKit
import ApplicationServices
import CoreServices

// Emits a JSON value to stdout and exits.
func emit(_ object: Any) -> Never {
    let data = (try? JSONSerialization.data(withJSONObject: object, options: [])) ?? Data("null".utf8)
    FileHandle.standardOutput.write(data)
    exit(0)
}

func appInfo(_ app: NSRunningApplication) -> [String: Any] {
    return [
        "id": app.bundleIdentifier ?? "",
        "name": app.localizedName ?? "",
        "pid": Int(app.processIdentifier)
    ]
}

func listApps() -> Never {
    let apps = NSWorkspace.shared.runningApplications
    let out = apps
        .filter { $0.activationPolicy == .regular }
        .map { appInfo($0) }
    emit(out)
}

func frontmost() -> Never {
    if let app = NSWorkspace.shared.frontmostApplication {
        emit(appInfo(app))
    }
    emit(NSNull())
}

func activate(_ pid: pid_t) -> Never {
    if let app = NSRunningApplication(processIdentifier: pid) {
        app.activate(options: [.activateIgnoringOtherApps])
    }
    emit(["ok": true])
}

func axTrusted() -> Never {
    emit(["trusted": AXIsProcessTrusted()])
}

// Reports whether the app already holds Automation (Apple events) permission,
// probed against System Events without prompting. macOS has no global Automation
// grant, so System Events stands in as the representative target. Only an explicit
// noErr counts as granted; a not-running target (procNotFound) reads as not granted.
func automationTrusted() -> Never {
    var target = AEAddressDesc()
    let bundleId = Data("com.apple.systemevents".utf8)
    let created = bundleId.withUnsafeBytes { raw in
        AECreateDesc(typeApplicationBundleID, raw.baseAddress, bundleId.count, &target)
    }
    if created != noErr {
        emit(["trusted": false])
    }
    let status = AEDeterminePermissionToAutomateTarget(&target, typeWildCard, typeWildCard, false)
    AEDisposeDesc(&target)
    emit(["trusted": status == noErr])
}

func copyAttr(_ element: AXUIElement, _ attribute: String) -> CFTypeRef? {
    var value: CFTypeRef?
    let result = AXUIElementCopyAttributeValue(element, attribute as CFString, &value)
    return result == .success ? value : nil
}

// Reads menu-bar accelerators for the app with the given pid via Accessibility.
func readMenu(_ pid: pid_t) -> Never {
    let appElement = AXUIElementCreateApplication(pid)
    // Guard against unresponsive apps hanging the reader.
    AXUIElementSetMessagingTimeout(appElement, 2.0)

    var out: [[String: Any]] = []

    guard let menuBarRef = copyAttr(appElement, kAXMenuBarAttribute as String) else {
        emit(out)
    }
    let menuBar = menuBarRef as! AXUIElement

    func walk(_ element: AXUIElement, depth: Int) {
        if depth > 12 { return }
        guard let childrenRef = copyAttr(element, kAXChildrenAttribute as String),
              let children = childrenRef as? [AXUIElement] else { return }

        for child in children {
            let cmdChar = copyAttr(child, "AXMenuItemCmdChar") as? String
            let virtualKey = copyAttr(child, "AXMenuItemCmdVirtualKey") as? Int
            let modifiers = copyAttr(child, "AXMenuItemCmdModifiers") as? Int
            let title = copyAttr(child, kAXTitleAttribute as String) as? String

            let hasChar = (cmdChar?.isEmpty == false)
            let hasVirtualKey = (virtualKey != nil && virtualKey! > 0)
            if hasChar || hasVirtualKey {
                out.append([
                    "title": title ?? "",
                    "cmdChar": cmdChar ?? "",
                    "cmdVirtualKey": virtualKey ?? -1,
                    "cmdModifiers": modifiers ?? 0
                ])
            }
            walk(child, depth: depth + 1)
        }
    }

    walk(menuBar, depth: 0)
    emit(out)
}

// Entry point.
let args = CommandLine.arguments
guard args.count >= 2 else {
    emit(["error": "missing subcommand"])
}

switch args[1] {
case "apps":
    listApps()
case "frontmost":
    frontmost()
case "axtrust":
    axTrusted()
case "autotrust":
    automationTrusted()
case "activate":
    guard args.count >= 3, let pid = Int32(args[2]) else { emit(["error": "missing pid"]) }
    activate(pid)
case "menu":
    guard args.count >= 3, let pid = Int32(args[2]) else { emit(["error": "missing pid"]) }
    readMenu(pid)
default:
    emit(["error": "unknown subcommand: \(args[1])"])
}
