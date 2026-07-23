import type { ScanOptions, ScanProgress, ScanResult, CoverageGap } from '@shared/scan'
import type { RawShortcut } from '@shared/shortcuts'
import type { PlatformProvider, RunningApp } from '../providers/types'
import { aggregate } from './aggregate'
import { getCuratedShortcuts } from './curated'
import { getScreenReaderShortcuts, isScreenReaderApp } from './screen-readers'

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
 * Resolves the app a frontmost-only scan should target. Prefers the app captured
 * before our popover stole focus (`currentApp`); otherwise queries the live
 * frontmost app. Never returns our own process: right after the launch reveal the
 * popover is frontmost, and reading its (empty accessory) menu would make a scan
 * look like it found only OS shortcuts. Returns null when the only candidate is
 * ourselves or nothing is frontmost.
 */
async function resolveFrontmostTarget(
  provider: PlatformProvider,
  currentApp?: RunningApp | null
): Promise<RunningApp | null> {
  if (currentApp && currentApp.pid !== process.pid) return currentApp
  const live = await provider.getFrontmostApp()
  if (live && live.pid !== process.pid) return live
  return null
}

/**
 * Reads the target app's menus only (quick, non-disruptive). The target is the
 * app that was frontmost when the popover opened (`currentApp`); falls back to
 * the live frontmost app when no capture is available. Reading is by pid via
 * Accessibility and does not require the app to be frontmost, so nothing flashes.
 *
 * `targetName` is the resolved app's name (even for a screen reader, whose
 * shortcuts come from the curated set rather than its menu bar), or null when no
 * valid non-self app was frontmost — the signal the renderer uses to prompt the
 * user to focus an app and rescan.
 */
async function scanFrontmostOnly(
  provider: PlatformProvider,
  onProgress: ProgressReporter,
  cancel: Cancellation,
  currentApp?: RunningApp | null
): Promise<{
  raws: RawShortcut[]
  appsScanned: number
  gaps: CoverageGap[]
  targetName: string | null
}> {
  if (cancel.cancelled) return { raws: [], appsScanned: 0, gaps: [], targetName: null }
  const frontmost = await resolveFrontmostTarget(provider, currentApp)
  if (!frontmost) return { raws: [], appsScanned: 0, gaps: [], targetName: null }
  // A screen reader is surfaced from the curated set, not its menu bar; it is
  // still a valid focused app, so report its name so no "focus an app" hint shows.
  if (isScreenReaderApp(frontmost)) {
    return { raws: [], appsScanned: 0, gaps: [], targetName: frontmost.name }
  }

  onProgress({ phase: 'apps', current: 1, total: 1, appName: frontmost.name })
  try {
    const raws = await provider.readAppMenuShortcuts(frontmost)
    const gaps = await provider.readCoverageGaps(frontmost)
    return { raws, appsScanned: 1, gaps, targetName: frontmost.name }
  } catch {
    return { raws: [], appsScanned: 0, gaps: [], targetName: frontmost.name }
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
  cancel: Cancellation,
  restoreTo?: RunningApp | null
): Promise<{ raws: RawShortcut[]; appsScanned: number; gaps: CoverageGap[] }> {
  const raws: RawShortcut[] = []
  const gaps: CoverageGap[] = []
  let appsScanned = 0

  const originalFront = restoreTo ?? (await provider.getFrontmostApp())
  const targets = apps.filter(
    (app) => app.pid !== process.pid && app.hasMenu !== false && !isScreenReaderApp(app)
  )
  const total = targets.length

  try {
    for (let i = 0; i < targets.length; i++) {
      if (cancel.cancelled) break
      const app = targets[i]
      onProgress({ phase: 'apps', current: i + 1, total, appName: app.name })

      try {
        await provider.activateApp(app)
        await delay(ACTIVATION_SETTLE_MS)
        raws.push(...(await provider.readAppMenuShortcuts(app)))
        gaps.push(...(await provider.readCoverageGaps(app)))
        appsScanned++
      } catch {
        // Skip apps whose menus cannot be read.
      }
    }
  } finally {
    if (originalFront) {
      try {
        await provider.activateApp(originalFront)
      } catch {
        // Best-effort restore of the previously focused app.
      }
    }
  }

  return { raws, appsScanned, gaps }
}

/** Removes duplicate coverage-gap markers (same source for the same app). */
function dedupeGaps(gaps: CoverageGap[]): CoverageGap[] {
  const byKey = new Map<string, CoverageGap>()
  for (const gap of gaps) {
    byKey.set(`${gap.source}|${gap.appId ?? gap.appName}`, gap)
  }
  return [...byKey.values()]
}

/**
 * Runs a full scan: OS shortcuts + app menu accelerators + curated global
 * hotkeys, then aggregates into segmented, display-ready shortcuts.
 */
export async function runScan(
  provider: PlatformProvider,
  options: ScanOptions,
  onProgress: ProgressReporter,
  cancel: Cancellation,
  currentApp?: RunningApp | null
): Promise<ScanResult> {
  const raws: RawShortcut[] = []
  onProgress({ phase: 'starting' })

  const permission = await provider.permissionStatus()

  onProgress({ phase: 'os' })
  try {
    raws.push(...(await provider.readOsShortcuts()))
  } catch {
    // OS shortcut source unavailable; continue with app + curated data.
  }

  const apps = await provider.listRunningApps()

  // Reading an app's menus and activating it require Accessibility. Without it
  // every menu read fails and activation only spams per-app Automation prompts, so
  // skip the app sweep and let the banner (driven by `permission`) prompt the user.
  // Curated + screen-reader shortcuts below need no permission and are still shown.
  const accessibilityBlocked = permission.accessibility === 'denied'

  let appsScanned = 0
  let frontmostAppName: string | null = null
  const coverageGaps: CoverageGap[] = []
  if (!cancel.cancelled && !accessibilityBlocked) {
    if (options.scanAllApps && apps.length > 0) {
      const result = await scanAllApps(provider, apps, onProgress, cancel, currentApp)
      raws.push(...result.raws)
      appsScanned = result.appsScanned
      coverageGaps.push(...result.gaps)
    } else {
      const result = await scanFrontmostOnly(provider, onProgress, cancel, currentApp)
      raws.push(...result.raws)
      appsScanned = result.appsScanned
      coverageGaps.push(...result.gaps)
      frontmostAppName = result.targetName
    }
  }

  onProgress({ phase: 'curated' })
  raws.push(...getCuratedShortcuts(apps, provider.platform))
  // JAWS, NVDA, Narrator, and VoiceOver are always surfaced, on every platform
  // and regardless of whether a copy is running; aggregate dedupes by id so they
  // appear once.
  raws.push(...getScreenReaderShortcuts())

  onProgress({ phase: 'aggregating' })
  const shortcuts = aggregate(raws, provider.platform)

  onProgress({ phase: 'done' })
  return {
    generatedAt: Date.now(),
    platform: provider.platform,
    permission,
    shortcuts,
    appsScanned,
    frontmostAppName,
    coverageGaps: dedupeGaps(coverageGaps)
  }
}
