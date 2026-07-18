import type { PermissionStatus, ReaderShortcuts, ScanOptions, ScanProgress, ScanResult } from './scan'

/** IPC channel identifiers shared by main and preload. */
export const IPC = {
  scan: 'shortcuts:scan',
  scanProgress: 'shortcuts:scan-progress',
  cancelScan: 'shortcuts:cancel-scan',
  readerShortcuts: 'shortcuts:reader',
  permissionStatus: 'shortcuts:permission-status',
  requestPermission: 'shortcuts:request-permission',
  openExternal: 'app:open-external',
  quit: 'app:quit',
  exportJson: 'app:export-json',
  setAlwaysOnTop: 'app:set-always-on-top',
  menuCommand: 'app:menu-command'
} as const

/**
 * Actions the tray context menu forwards to the renderer, which owns the scan
 * flow, export payload, and pin state. (Quit is handled in main directly.)
 */
export type MenuCommand = 'scan-frontmost' | 'scan-all' | 'export' | 'toggle-pin'

/** The typed surface exposed to the renderer via the preload bridge. */
export interface ShortcutApi {
  scan(options: ScanOptions): Promise<ScanResult>
  cancelScan(): Promise<void>
  onScanProgress(callback: (progress: ScanProgress) => void): () => void
  /** Curated screen-reader shortcuts, available without running a scan. */
  getReaderShortcuts(): Promise<ReaderShortcuts>
  getPermissionStatus(): Promise<PermissionStatus>
  requestPermission(): Promise<PermissionStatus>
  openExternal(url: string): Promise<void>
  quit(): Promise<void>
  /** Writes the given JSON to a user-chosen file. Resolves true when saved. */
  exportJson(json: string, fileName: string): Promise<boolean>
  /** Pins/unpins the popover above all other windows. Resolves the new state. */
  setAlwaysOnTop(pinned: boolean): Promise<boolean>
  /** Subscribes to tray-menu commands forwarded from main. Returns an unsubscribe. */
  onMenuCommand(callback: (command: MenuCommand) => void): () => void
}
