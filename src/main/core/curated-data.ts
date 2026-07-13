import type { Modifier, Platform } from '@shared/shortcuts'

export interface CuratedShortcut {
  modifiers: Modifier[]
  key: string
  description: string
  /** Whether this hotkey is enabled by default in the app. */
  defaultEnabled?: boolean
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
  shortcuts: CuratedShortcut[]
}

/**
 * Curated default global hotkeys for common third-party apps. These occupy the
 * "works when the app is not focused" segment, which no OS API exposes for other
 * processes. Values are the apps' shipped defaults and may be remapped by the
 * user; the UI surfaces that caveat. Identity is matched by bundle id / process
 * name first, with name aliases as a fallback.
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
  }
]
