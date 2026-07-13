import type { RawShortcut, Platform } from '@shared/shortcuts'
import type { PermissionStatus } from '@shared/scan'
import type { PlatformProvider, RunningApp } from '../types'

/**
 * macOS provider. Real capabilities (symbolic-hotkeys parsing, Accessibility
 * menu reading, app activation) are implemented in Phase 2. This skeleton keeps
 * the scan pipeline wired end-to-end.
 */
export class MacProvider implements PlatformProvider {
  readonly platform: Platform = 'darwin'

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
    // implemented in Phase 2
  }

  async permissionStatus(): Promise<PermissionStatus> {
    return { accessibility: 'unknown' }
  }

  async requestPermission(): Promise<PermissionStatus> {
    return { accessibility: 'unknown' }
  }
}
