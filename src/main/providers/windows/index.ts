import type { RawShortcut, Platform } from '@shared/shortcuts'
import type { PermissionStatus } from '@shared/scan'
import type { PlatformProvider, RunningApp } from '../types'

/**
 * Windows provider. Real capabilities (UI Automation accelerators, window
 * activation, process enumeration, curated OS list) are implemented in Phase 3.
 * This skeleton keeps the scan pipeline wired end-to-end.
 */
export class WindowsProvider implements PlatformProvider {
  readonly platform: Platform = 'win32'

  async listRunningApps(): Promise<RunningApp[]> {
    return []
  }

  async readOsShortcuts(): Promise<RawShortcut[]> {
    return []
  }

  async readAppMenuShortcuts(): Promise<RawShortcut[]> {
    return []
  }

  async getFrontmostApp(): Promise<RunningApp | null> {
    return null
  }

  async activateApp(): Promise<void> {
    // implemented in Phase 3
  }

  async permissionStatus(): Promise<PermissionStatus> {
    return { accessibility: 'not-required' }
  }

  async requestPermission(): Promise<PermissionStatus> {
    return { accessibility: 'not-required' }
  }
}
