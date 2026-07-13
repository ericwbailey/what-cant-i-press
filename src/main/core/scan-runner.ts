import type { ScanOptions, ScanProgress, ScanResult } from '@shared/scan'
import type { RawShortcut } from '@shared/shortcuts'
import type { PlatformProvider } from '../providers/types'
import { aggregate } from './aggregate'
import { getCuratedShortcuts } from './curated'

/** Simple cooperative cancellation token flipped by the cancel IPC. */
export interface Cancellation {
  cancelled: boolean
}

export type ProgressReporter = (progress: ScanProgress) => void

/**
 * Runs a full scan: OS shortcuts + app menu accelerators + curated global
 * hotkeys, then aggregates. The exhaustive activate-each-app menu sweep lives in
 * Phase 5; this runner currently reads the frontmost app's menus only.
 */
export async function runScan(
  provider: PlatformProvider,
  options: ScanOptions,
  onProgress: ProgressReporter,
  cancel: Cancellation
): Promise<ScanResult> {
  const notes: string[] = []
  const raws: RawShortcut[] = []
  onProgress({ phase: 'starting' })

  const permission = await provider.permissionStatus()

  onProgress({ phase: 'os' })
  try {
    raws.push(...(await provider.readOsShortcuts()))
  } catch {
    notes.push('Could not read operating-system shortcuts.')
  }

  const apps = await provider.listRunningApps()

  let appsScanned = 0
  if (!cancel.cancelled) {
    if (options.scanAllApps && apps.length > 0) {
      notes.push(
        'Full per-app menu scan is added in a later build; read the frontmost app only.'
      )
    }
    const frontmost = await provider.getFrontmostApp()
    if (frontmost) {
      onProgress({ phase: 'apps', current: 1, total: 1, appName: frontmost.name })
      try {
        raws.push(...(await provider.readAppMenuShortcuts(frontmost)))
        appsScanned = 1
      } catch {
        notes.push(`Could not read menus for ${frontmost.name}.`)
      }
    }
  }

  onProgress({ phase: 'curated' })
  raws.push(...getCuratedShortcuts(apps, provider.platform))

  onProgress({ phase: 'aggregating' })
  const shortcuts = aggregate(raws, provider.platform)

  onProgress({ phase: 'done' })
  return {
    generatedAt: Date.now(),
    platform: provider.platform,
    permission,
    shortcuts,
    appsScanned,
    notes
  }
}
