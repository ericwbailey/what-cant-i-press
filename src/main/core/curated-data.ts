import type { Modifier, Platform } from '@shared/shortcuts'

export interface CuratedShortcut {
  modifiers: Modifier[]
  key: string
  description: string
}

export interface CuratedApp {
  platform: Platform
  appName: string
  /** macOS bundle identifiers that identify this app. */
  bundleIds?: string[]
  /** Windows process (executable) base names, lower-cased, without extension. */
  processNames?: string[]
  /** Lower-cased substrings matched against a running app's name or id. */
  aliases?: string[]
  /**
   * Global hotkeys reserved system-wide while the app runs (the `global-app`
   * segment), independent of focus. Optional so an entry can supply only
   * `menuShortcuts`.
   */
  shortcuts?: CuratedShortcut[]
  /**
   * In-app shortcuts reserved only while the app is frontmost (the
   * `focused-menu` segment). These fill the gap on platforms whose menus cannot
   * be enumerated live: on Windows, UI Automation exposes no accelerator table
   * for a background app (classic menu items are absent from the tree until the
   * menu is opened, and modern apps have no classic menu). A live scan that does
   * recover a value supersedes the curated default here (aggregation prefers
   * `detected` over `curated`).
   */
  menuShortcuts?: CuratedShortcut[]
}

/**
 * Curated default hotkeys for common apps. `shortcuts` occupy the "works when
 * the app is not focused" (`global-app`) segment, which no OS API exposes for
 * other processes; `menuShortcuts` occupy the "only while frontmost"
 * (`focused-menu`) segment, used where menus cannot be enumerated live (Windows).
 * Values are the apps' shipped defaults and may be remapped by the user; the UI
 * surfaces that caveat. Identity is matched by bundle id / process name first,
 * with name aliases as a fallback.
 */
export const CURATED_APPS: CuratedApp[] = [
  {
    platform: 'darwin',
    appName: 'Raycast',
    bundleIds: ['com.raycast.macos'],
    aliases: ['raycast'],
    shortcuts: [{ modifiers: ['option'], key: 'Space', description: 'Toggle Raycast' }]
  },
  {
    platform: 'darwin',
    appName: 'Alfred',
    bundleIds: ['com.runningwithcrocodiles.alfred', 'com.alfredapp.Alfred'],
    aliases: ['alfred'],
    shortcuts: [{ modifiers: ['option'], key: 'Space', description: 'Show Alfred' }]
  },
  {
    platform: 'darwin',
    appName: 'Rectangle',
    bundleIds: ['com.knollsoft.Rectangle'],
    aliases: ['rectangle'],
    shortcuts: [
      { modifiers: ['control', 'option'], key: 'Left', description: 'Snap window to the left half' },
      { modifiers: ['control', 'option'], key: 'Right', description: 'Snap window to the right half' },
      { modifiers: ['control', 'option'], key: 'Up', description: 'Snap window to the top half' },
      { modifiers: ['control', 'option'], key: 'Down', description: 'Snap window to the bottom half' },
      { modifiers: ['control', 'option'], key: 'Return', description: 'Maximize window' }
    ]
  },
  {
    platform: 'darwin',
    appName: 'Magnet',
    bundleIds: ['com.crowdcafe.windowmagnet'],
    aliases: ['magnet'],
    shortcuts: [
      { modifiers: ['control', 'option'], key: 'Left', description: 'Snap window to the left half' },
      { modifiers: ['control', 'option'], key: 'Right', description: 'Snap window to the right half' },
      { modifiers: ['control', 'option'], key: 'Return', description: 'Maximize window' }
    ]
  },
  {
    platform: 'darwin',
    appName: '1Password',
    bundleIds: ['com.1password.1password', 'com.agilebits.onepassword7'],
    aliases: ['1password'],
    shortcuts: [
      { modifiers: ['command', 'shift'], key: 'Space', description: 'Open 1Password Quick Access' }
    ]
  },
  {
    platform: 'darwin',
    appName: 'Things',
    bundleIds: ['com.culturedcode.ThingsMac'],
    aliases: ['things'],
    shortcuts: [
      { modifiers: ['control'], key: 'Space', description: 'Show the Quick Entry panel' }
    ]
  },
  {
    platform: 'win32',
    appName: 'PowerToys',
    processNames: ['powertoys', 'powertoys.powerlauncher'],
    aliases: ['powertoys'],
    shortcuts: [
      { modifiers: ['option'], key: 'Space', description: 'Open PowerToys Run' },
      { modifiers: ['super', 'shift'], key: 'C', description: 'Open Color Picker' },
      { modifiers: ['super', 'shift'], key: 'T', description: 'Open Text Extractor (OCR)' },
      { modifiers: ['super', 'shift'], key: 'M', description: 'Open Screen Ruler' },
      { modifiers: ['super', 'control'], key: 'T', description: 'Toggle Always on Top' }
    ]
  },
  {
    platform: 'win32',
    appName: 'Flow Launcher',
    processNames: ['flow.launcher'],
    aliases: ['flow launcher', 'flow.launcher'],
    shortcuts: [{ modifiers: ['option'], key: 'Space', description: 'Open Flow Launcher' }]
  },
  {
    platform: 'win32',
    appName: 'ShareX',
    processNames: ['sharex'],
    aliases: ['sharex'],
    shortcuts: [
      { modifiers: [], key: 'PrintScreen', description: 'Capture the entire screen' },
      { modifiers: ['control'], key: 'PrintScreen', description: 'Capture a region' }
    ]
  },
  {
    platform: 'win32',
    appName: 'Snagit',
    processNames: ['snagit32', 'snagiteditor', 'snagit'],
    aliases: ['snagit'],
    shortcuts: [{ modifiers: [], key: 'PrintScreen', description: 'Capture (Snagit global capture)' }]
  },
  {
    platform: 'win32',
    appName: 'Notepad',
    processNames: ['notepad'],
    aliases: ['notepad'],
    menuShortcuts: [
      { modifiers: ['control'], key: 'N', description: 'New' },
      { modifiers: ['control', 'shift'], key: 'N', description: 'New window' },
      { modifiers: ['control'], key: 'O', description: 'Open' },
      { modifiers: ['control'], key: 'S', description: 'Save' },
      { modifiers: ['control', 'shift'], key: 'S', description: 'Save as' },
      { modifiers: ['control'], key: 'P', description: 'Print' },
      { modifiers: ['control'], key: 'W', description: 'Close' },
      { modifiers: ['control'], key: 'Z', description: 'Undo' },
      { modifiers: ['control'], key: 'Y', description: 'Redo' },
      { modifiers: ['control'], key: 'X', description: 'Cut' },
      { modifiers: ['control'], key: 'C', description: 'Copy' },
      { modifiers: ['control'], key: 'V', description: 'Paste' },
      { modifiers: ['control'], key: 'A', description: 'Select all' },
      { modifiers: ['control'], key: 'F', description: 'Find' },
      { modifiers: ['control'], key: 'H', description: 'Replace' },
      { modifiers: ['control'], key: 'G', description: 'Go to line' },
      { modifiers: [], key: 'F5', description: 'Insert date and time' }
    ]
  },
  {
    platform: 'win32',
    appName: 'File Explorer',
    processNames: ['explorer'],
    aliases: ['file explorer'],
    menuShortcuts: [
      { modifiers: ['control'], key: 'N', description: 'Open new window' },
      { modifiers: ['control'], key: 'W', description: 'Close window' },
      { modifiers: ['control', 'shift'], key: 'N', description: 'New folder' },
      { modifiers: ['control'], key: 'F', description: 'Search' },
      { modifiers: [], key: 'F2', description: 'Rename' },
      { modifiers: [], key: 'F5', description: 'Refresh' },
      { modifiers: ['option'], key: 'Return', description: 'Properties' },
      { modifiers: ['option'], key: 'Up', description: 'Up one level' },
      { modifiers: ['option'], key: 'Left', description: 'Back' },
      { modifiers: ['option'], key: 'Right', description: 'Forward' }
    ]
  },
  {
    platform: 'win32',
    appName: 'Windows Terminal',
    processNames: ['windowsterminal'],
    aliases: ['windows terminal'],
    menuShortcuts: [
      { modifiers: ['control', 'shift'], key: 'T', description: 'New tab' },
      { modifiers: ['control', 'shift'], key: 'W', description: 'Close tab' },
      { modifiers: ['control', 'shift'], key: 'D', description: 'Duplicate tab' },
      { modifiers: ['control', 'shift'], key: 'P', description: 'Open the command palette' },
      { modifiers: ['control', 'shift'], key: 'F', description: 'Find' },
      { modifiers: ['option', 'shift'], key: 'D', description: 'Split pane' },
      { modifiers: ['control'], key: ',', description: 'Open settings' }
    ]
  },
  {
    platform: 'win32',
    appName: 'Microsoft Edge',
    processNames: ['msedge'],
    aliases: ['microsoft edge'],
    menuShortcuts: [
      { modifiers: ['control'], key: 'T', description: 'New tab' },
      { modifiers: ['control'], key: 'W', description: 'Close tab' },
      { modifiers: ['control', 'shift'], key: 'T', description: 'Reopen closed tab' },
      { modifiers: ['control'], key: 'N', description: 'New window' },
      { modifiers: ['control', 'shift'], key: 'N', description: 'New InPrivate window' },
      { modifiers: ['control'], key: 'L', description: 'Select the address bar' },
      { modifiers: ['control'], key: 'D', description: 'Add this page to favorites' },
      { modifiers: ['control'], key: 'F', description: 'Find on page' },
      { modifiers: ['control'], key: 'R', description: 'Reload' },
      { modifiers: ['control'], key: 'P', description: 'Print' }
    ]
  }
]
