<p align="center"><img width="340" height="340" alt="An active gas stove burner, as seen from the top." src="https://github.com/user-attachments/assets/320154e2-6ae5-4487-bd96-c45812168670" /></p>

<h1 align="center">What Can't I Press?</h1>

<p align="center"><code>macOS</code>, <code>Windows</code> |  <a href="https://github.com/ericwbailey/what-cant-i-press/blob/main/ROADMAP.md">Roadmap</a></p>

**Helps to show what keyboard shortcuts are already claimed by different screen readers and apps**. This helps to prevent collisions when creating new keybindings. 

For example, <kbd>h</kbd> is often used to toggle open help dialogs. <kbd>h</kbd> is also [the most popular navigation technique used by the two most popular screen readers on the planet](https://webaim.org/projects/screenreadersurvey10/#finding). 

> [!NOTE]  
> This app cannot not detect **all** keyboard shortcuts. This is because some keyboard shortcuts can be implemented in a way that scanning cannot detect. **Treat the app as a starting point**.

## How to use

### Opening the app

What Can’t I Press lives in your menu bar (macOS) or system tray (Windows)—not the Dock or taskbar. Click its icon to open the popover. It also opens automatically the first time you launch it so you can find it.

### Scan to discover shortcuts

- Detect shortcuts in the app you had open prior to opening What Can’t I Press, or
- Scan all currently open apps (takes longer).

### Search and filter

- **Search by intent**. Search for keyboard shortcuts or commands to filter the list.
- **Search by keypress**. Enter keyboard shortcuts to also filter. 

### Copy to share

- Click a keyboard shortcut row to copy it to your clipboard. 
- Hold <kbd>Control</kbd> while clicking to copy it as HTML with each key wrapped in a `<kbd>` element, using the spelled-out key names. 
- Hold <kbd>Shift</kbd> while clicking to copy the same `<kbd>` HTML using the displayed symbols. 

### Export

JSON can be generated for what keyboard shortcuts are currently displayed. 

## Download & install

Download the latest installer from the [Releases page](https://github.com/ericwbailey/what-cant-i-press/releases/latest). Builds are currently unsigned and will need to be manually approved to run. 

### Permissions

#### macOS

The app uses the Accessibility API to scan, which requires explicit permission.
Here is how to enable it when prompted:

1. Open **System Settings** → **Privacy & Security** → **Accessibility**.
2. Enable **What Can't I Press**.
3. Reopen the app and scan again.

If the app is already listed and enabled but scanning still reports that
Accessibility access is needed—which can happen after installing an update—remove
the **What Can't I Press** entry with the **–** button, add the app again, enable
it, then reopen and scan.

The full "scan all apps" sweep briefly brings each running app to the foreground to read its menus, then restores focus to where it started.

#### Windows

UI Automation needs no up-front permission for ordinary apps. Reading menu accelerators from an app running as administrator requires this app to run elevated as well. These apps are silently skipped otherwise.

## Privacy

All work is performed on-device. Nothing about what you scan ever leaves your computer.

The keyboard shortcuts the app reads are analyzed locally and shown only to you. No data is collected, stored off-device, or sent anywhere. 

There is no telemetry or analytics. Its only network activity is checking GitHub for new releases and opening links, such as the project page, and that is only triggered by manual activation. 

## FAQ

### Why did you make this?

Manually discovering conflicts is a chore, yet is important work to do to ensure you don't unintentionally override something important. This helps to lower the burden of the act of discovery. 

For more background on this, read [_How an accessibility designer adds keyboard shortcuts to a web app_](https://ericwbailey.website/published/how-an-accessibility-designer-adds-keyboard-shortcuts-to-a-web-app/).

### What about screen reader passthrough keys?

We shouldn't put the burden on the person using assistive technology to use workarounds as much as possible.

### How do I suggest a feature?

[File an Issue that describes this feature](https://github.com/ericwbailey/what-cant-i-press/issues/new?template=feature_request.yml). Be sure to also [reference the project roadmap](https://github.com/ericwbailey/what-cant-i-press/blob/main/ROADMAP.md) before doing so.

### How do I report a bug?

[File an Issue that describes the bug](https://github.com/ericwbailey/what-cant-i-press/issues/new?template=bug_report.yml).

### How do I report an accessibility issue?

[File an Issue that describes the access barrier](https://github.com/ericwbailey/what-cant-i-press/issues/new?template=accessibility_issue.yml).

### Why did you use Electron to make this?

Electron is more mature compared to its counterparts, and allows me to more easily distribute the app across different operating systems.

### Why can't it detect every keyboard shortcut an app uses?

There is no central registry or technique used for declaring keyboard shortcuts. Because of this, some cannot be detected by scanning. This is due to how the keyboard shortcuts have been written in the application's code.

### How does the scanning work?

#### macOS

- Lists the running app through a small bundled Swift helper.
- For each app, reads its menu bar with macOS Accessibility services and pulls the shortcut shown next to every menu command.
- Layers on any custom shortcuts set in System Settings → Keyboard → Keyboard Shortcuts → App Shortcuts — for both the specific app and "All Applications" — which override the app's defaults.
- Reads the built-in macOS system shortcuts from the symbolic-hotkeys preferences file and decodes each into a key, modifiers, and a plain-English label.
- Flags apps that register hidden global hotkeys at runtime. Their binary imports `RegisterEventHotKey` as a coverage gap, since those can't be enumerated.

#### Windows

- Lists the running apps by finding processes that have a visible main window, using the window title as the name.
- For each app, uses Windows UI Automation to walk its menu bars and read the accelerator key listed on each menu item.
- Falls back to scanning the whole window when no menu bar is found, and drops duplicate entries.
- Uses a built-in, hand-maintained list of Windows system shortcuts (<kbd>Win</kbd> + <kbd>E</kbd>, <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Esc</kbd>, <kbd>Alt</kbd> + <kbd>Tab</kbd>, etc.), because Windows exposes no store to read these from.
