import type { Shortcut, Platform, ShortcutConfidence, ShortcutScope } from './shortcuts'

/** Tri-state permission result for OS capabilities the scan depends on. */
export type PermissionState = 'granted' | 'denied' | 'unknown' | 'not-required'

export interface PermissionStatus {
  /** Accessibility (macOS) / UI Automation (Windows) access to read menus. */
  accessibility: PermissionState
  /** Optional human-readable explanation / remediation hint. */
  details?: string
}

export interface ScanOptions {
  /**
   * When true, the scan briefly activates each running app to read its menu
   * shortcuts (disruptive). When false, only the frontmost app's menus are read.
   */
  scanAllApps: boolean
}

export interface ScanProgress {
  phase: 'starting' | 'os' | 'apps' | 'curated' | 'aggregating' | 'done'
  current?: number
  total?: number
  appName?: string
}

/**
 * A marker recording that an app has keyboard shortcuts that no general method
 * can enumerate (e.g. runtime `RegisterEventHotKey` registrations, raw key-event
 * handlers). Surfaced so the shortcut list never implies it is exhaustive. The
 * exact key values are, by definition, not statically resolvable.
 */
export interface CoverageGap {
  appId?: string
  appName: string
  /** Extractor id that produced the marker, e.g. `binary-flag`. */
  source: string
  confidence: ShortcutConfidence
  scope: ShortcutScope
  /** Human-readable description of what could not be enumerated. */
  detail: string
}

export interface ScanResult {
  generatedAt: number
  platform: Platform
  permission: PermissionStatus
  shortcuts: Shortcut[]
  appsScanned: number
  /** Non-exhaustiveness markers for scanned apps (runtime hotkeys, raw handlers). */
  coverageGaps: CoverageGap[]
}

/**
 * Curated screen-reader (JAWS/NVDA/Narrator/VoiceOver) shortcuts, resolvable
 * without a scan so the renderer can always show those sections — including at
 * launch before any scan has run.
 */
export interface ReaderShortcuts {
  platform: Platform
  shortcuts: Shortcut[]
}
