<p align="center"><img width="401" height="401" alt="An active gas stove burner, as seen from the top." src="https://github.com/user-attachments/assets/08ba8e34-fe8b-4949-b0a1-72c2b7d29330" /></p>

# What Can't I Press?

- Support: `macOS`, `Windows`
- [Roadmap](https://github.com/ericwbailey/what-cant-i-press/blob/main/ROADMAP.md)

**Helps to show what keyboard shortcuts are already claimed by different screen readers and apps**. This helps to prevent collisions when creating new keybindings. 

For example, <kbd>h</kbd> is often used to toggle open help dialogs. <kbd>h</kbd> is also the most popular navigation technique used by the two most popular screen readers on the planet. 

> [!NOTE]  
> This app cannot not detect **all** keyboard shortcuts. This is because some keyboard shortcuts can be implemented in a way that scanning cannot detect. **Treat the app as a starting point**.

## How to use

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

The full "scan all apps" sweep also sends Apple events to briefly activate each running app—macOS may prompt for Automation permission the first time.

#### Windows

UI Automation needs no up-front permission for ordinary apps. Reading menu accelerators from an app running as administrator requires this app to run elevated as well. These apps are silently skipped otherwise.

## Privacy

All work is performed on-device. Nothing about what you scan ever leaves your computer.

The keyboard shortcuts the app reads are analyzed locally and shown only to you. No data is collected, stored off-device, or sent anywhere. 

There is no telemetry or analytics. Its only network activity is checking GitHub for new releases and opening links, such as the project page, and that is only triggered by manual activation. 

---

<details>
<summary>
How the scan works
</summary>
<p><b>macOS</b>:</p>
<ul>
  <li>Lists the running app through a small bundled Swift helper.</li>
  <li>For each app, reads its menu bar with macOS Accessibility services and pulls the shortcut shown next to every menu command.</li>
  <li>Layers on any custom shortcuts set in System Settings → Keyboard → Keyboard Shortcuts → App Shortcuts — for both the specific app and "All Applications" — which override the app's defaults.</li>
  <li>Reads the built-in macOS system shortcuts from the symbolic-hotkeys preferences file and decodes each into a key, modifiers, and a plain-English label.</li>
  <li>Flags apps that register hidden global hotkeys at runtime. Their binary imports <code>RegisterEventHotKey</code> as a coverage gap, since those can't be enumerated.</li>
</ul>
<p><b>Windows</b>:</p>
<ul>
  <li>Lists the running apps by finding processes that have a visible main window, using the window title as the name.</li>
  <li>For each app, uses Windows UI Automation to walk its menu bars and read the accelerator key listed on each menu item.</li>
  <li>Falls back to scanning the whole window when no menu bar is found, and drops duplicate entries.</li>
  <li>Uses a built-in, hand-maintained list of Windows system shortcuts (<kbd>Win</kbd> + <kbd>E</kbd>, <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Esc</kbd>, <kbd>Alt</kbd> + <kbd>Tab</kbd>, etc.), because Windows exposes no store to read these from.</li>
  <li>Needs no special permission for normal apps. Apps running as administrator stay unreadable unless this app is also elevated.</li>
</ul>
</details>
