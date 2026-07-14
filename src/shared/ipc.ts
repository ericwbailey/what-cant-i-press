import type { PermissionStatus, ScanOptions, ScanProgress, ScanResult } from './scan'

/** IPC channel identifiers shared by main and preload. */
export const IPC = {
  scan: 'shortcuts:scan',
  scanProgress: 'shortcuts:scan-progress',
  cancelScan: 'shortcuts:cancel-scan',
  permissionStatus: 'shortcuts:permission-status',
  requestPermission: 'shortcuts:request-permission',
  openExternal: 'app:open-external',
  quit: 'app:quit',
  exportJson: 'app:export-json'
} as const

/** The typed surface exposed to the renderer via the preload bridge. */
export interface ShortcutApi {
  scan(options: ScanOptions): Promise<ScanResult>
  cancelScan(): Promise<void>
  onScanProgress(callback: (progress: ScanProgress) => void): () => void
  getPermissionStatus(): Promise<PermissionStatus>
  requestPermission(): Promise<PermissionStatus>
  openExternal(url: string): Promise<void>
  quit(): Promise<void>
  /** Writes the given JSON to a user-chosen file. Resolves true when saved. */
  exportJson(json: string): Promise<boolean>
}
