import type { RawShortcut, Platform } from '@shared/shortcuts'
import type { CoverageGap, PermissionStatus } from '@shared/scan'
import type { PlatformProvider, RunningApp } from './types'

/**
 * A provider for platforms without native integration. Everything resolves
 * empty and permissions are reported as not required, so a scan on an
 * unsupported OS still completes (with no results).
 */
export function createNullProvider(platform: Platform): PlatformProvider {
  return {
    platform,
    async listRunningApps(): Promise<RunningApp[]> {
      return []
    },
    async readOsShortcuts(): Promise<RawShortcut[]> {
      return []
    },
    async readAppMenuShortcuts(): Promise<RawShortcut[]> {
      return []
    },
    async getFrontmostApp(): Promise<RunningApp | null> {
      return null
    },
    async activateApp(): Promise<void> {
      // no-op
    },
    async readCoverageGaps(): Promise<CoverageGap[]> {
      return []
    },
    async permissionStatus(): Promise<PermissionStatus> {
      return { accessibility: 'not-required' }
    },
    async requestPermission(): Promise<PermissionStatus> {
      return { accessibility: 'not-required' }
    }
  }
}
