import type { Shortcut, Platform } from './shortcuts'

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

export interface ScanResult {
  generatedAt: number
  platform: Platform
  permission: PermissionStatus
  shortcuts: Shortcut[]
  appsScanned: number
}
