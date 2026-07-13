import type { Modifier, RawShortcut } from '@shared/shortcuts'

type Entry = [modifiers: Modifier[], key: string, description: string]

/**
 * Curated list of Windows system-reserved keyboard shortcuts. Windows exposes no
 * enumerable store for these (the shell hardcodes them), so they are maintained
 * here and labelled as a curated source. Covers the common Windows 10/11 global
 * combinations most likely to collide with a new binding.
 */
const ENTRIES: Entry[] = [
  [['super'], 'Space', 'Switch input language / keyboard layout'],
  [['super'], 'D', 'Show or hide the desktop'],
  [['super'], 'E', 'Open File Explorer'],
  [['super'], 'L', 'Lock the PC'],
  [['super'], 'R', 'Open the Run dialog'],
  [['super'], 'I', 'Open Settings'],
  [['super'], 'A', 'Open Quick Settings'],
  [['super'], 'N', 'Open notifications and calendar'],
  [['super'], 'S', 'Open search'],
  [['super'], 'Q', 'Open search'],
  [['super'], 'Tab', 'Open Task View'],
  [['super'], 'V', 'Open clipboard history'],
  [['super'], 'X', 'Open the Quick Link menu'],
  [['super'], 'G', 'Open Xbox Game Bar'],
  [['super'], 'H', 'Start voice typing'],
  [['super'], 'K', 'Open Cast'],
  [['super'], 'P', 'Choose a presentation display mode'],
  [['super'], 'U', 'Open Accessibility settings'],
  [['super'], 'M', 'Minimize all windows'],
  [['super'], 'Up', 'Maximize the window'],
  [['super'], 'Down', 'Minimize or restore the window'],
  [['super'], 'Left', 'Snap the window to the left'],
  [['super'], 'Right', 'Snap the window to the right'],
  [['super'], '.', 'Open the emoji panel'],
  [['super'], '+', 'Open Magnifier and zoom in'],
  [['super'], '-', 'Zoom out in Magnifier'],
  [['super'], 'Escape', 'Close Magnifier'],
  [['super'], 'Pause', 'Open the About / System page'],
  [['super'], '1', 'Open or switch to the first taskbar app'],
  [['super', 'shift'], 'S', 'Capture a screenshot with Snipping Tool'],
  [['super', 'shift'], 'M', 'Restore minimized windows'],
  [['super', 'control'], 'D', 'Create a new virtual desktop'],
  [['super', 'control'], 'Left', 'Switch to the virtual desktop on the left'],
  [['super', 'control'], 'Right', 'Switch to the virtual desktop on the right'],
  [['super', 'control'], 'F4', 'Close the current virtual desktop'],
  [['super', 'control'], 'Return', 'Turn on Narrator'],
  [['control', 'shift'], 'Escape', 'Open Task Manager'],
  [['control', 'option'], 'ForwardDelete', 'Open the security options screen'],
  [['option'], 'Tab', 'Switch between open apps'],
  [['option'], 'Escape', 'Cycle through open windows'],
  [['option'], 'F4', 'Close the active window or app'],
  [['option'], 'Space', 'Open the window system menu']
]

/** Builds the curated Windows OS shortcut set as normalized raw shortcuts. */
export function windowsOsShortcuts(): RawShortcut[] {
  return ENTRIES.map(([modifiers, key, description]) => ({
    key,
    modifiers,
    origin: 'os',
    segment: 'global-os',
    source: 'curated',
    appName: 'Windows',
    description,
    enabled: true
  }))
}
