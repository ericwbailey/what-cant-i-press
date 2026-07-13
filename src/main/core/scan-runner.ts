import type { ScanOptions, ScanProgress, ScanResult } from '@shared/scan'
import type { RawShortcut } from '@shared/shortcuts'
import type { PlatformProvider, RunningApp } from '../providers/types'
import { aggregate } from './aggregate'
import { getCuratedShortcuts } from './curated'

/** Simple cooperative cancellation token flipped by the cancel IPC. */
export interface Cancellation {
  cancelled: boolean
}

export type ProgressReporter = (progress: ScanProgress) => void

/** Delay between activating an app and reading its menus, to let them populate. */
const ACTIVATION_SETTLE_MS = 160

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Reads the frontmost app's menus only (quick, non-disruptive). Returns the raw
 * shortcuts collected and the number of apps scanned.
 */
async function scanFrontmostOnly(
  provider: PlatformProvider,
  onProgress: ProgressReporter,
  notes: string[],
  cancel: Cancellation
): Promise<{ raws: RawShortcut[]; appsScanned: number }> {
  if (cancel.cancelled) return { raws: [], appsScanned: 0 }
  const frontmost = await provider.getFrontmostApp()
  if (!frontmost) return { raws: [], appsScanned: 0 }

  onProgress({ phase: 'apps', current: 1, total: 1, appName: frontmost.name })
  try {
    const raws = await provider.readAppMenuShortcuts(frontmost)
    return { raws, appsScanned: 1 }
  } catch {
    notes.push(`Could not read menus for ${frontmost.name}.`)
    return { raws: [], appsScanned: 0 }
  }
}

/**
 * Activates each running app in turn, reads its menus, then restores the app
 * that was frontmost before the sweep. Disruptive: every scanned app briefly
 * flashes to the foreground. Honors cancellation between apps.
 */
async function scanAllApps(
  provider: PlatformProvider,
  apps: RunningApp[],
  onProgress: ProgressReporter,
  notes: string[],
  cancel: Cancellation
): Promise<{ raws: RawShortcut[]; appsScanned: number }> {
  const raws: RawShortcut[] = []
  let appsScanned = 0

  const originalFront = await provider.getFrontmostApp()
  const targets = apps.filter((app) => app.pid !== process.pid && app.hasMenu !== false)
  const total = targets.length

  try {
    for (let i = 0; i < targets.length; i++) {
      if (cancel.cancelled) {
        notes.push('Scan cancelled; results are partial.')
        break
      }
      const app = targets[i]
      onProgress({ phase: 'apps', current: i + 1, total, appName: app.name })

      try {
        await provider.activateApp(app)
        await delay(ACTIVATION_SETTLE_MS)
        raws.push(...(await provider.readAppMenuShortcuts(app)))
        appsScanned++
      } catch {
        notes.push(`Could not read menus for ${app.name}.`)
      }
    }
  } finally {
    if (originalFront) {
      try {
        await provider.activateApp(originalFront)
      } catch {
        notes.push('Could not restore the previously focused app.')
      }
    }
  }

  return { raws, appsScanned }
}

/**
 * Runs a full scan: OS shortcuts + app menu accelerators + curated global
 * hotkeys, then aggregates into segmented, display-ready shortcuts.
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
    const result =
      options.scanAllApps && apps.length > 0
        ? await scanAllApps(provider, apps, onProgress, notes, cancel)
        : await scanFrontmostOnly(provider, onProgress, notes, cancel)
    raws.push(...result.raws)
    appsScanned = result.appsScanned

    if (!options.scanAllApps) {
      notes.push('Only the frontmost app was scanned. Run a full scan to include every app.')
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
