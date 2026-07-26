import type { Platform, RawShortcut } from '@shared/shortcuts'
import type { RunningApp } from '../providers/types'
import { CURATED_APPS, type CuratedApp } from './curated-data'

/** Tests whether a curated app entry matches one of the running apps. */
function findMatch(entry: CuratedApp, apps: RunningApp[]): RunningApp | null {
  const bundleIds = (entry.bundleIds ?? []).map((b) => b.toLowerCase())
  const processNames = (entry.processNames ?? []).map((p) => p.toLowerCase())
  const aliases = (entry.aliases ?? []).map((a) => a.toLowerCase())

  for (const app of apps) {
    const id = app.id.toLowerCase()
    const name = app.name.toLowerCase()

    if (bundleIds.includes(id) || processNames.includes(id)) return app
    if (aliases.some((alias) => id.includes(alias) || name.includes(alias))) return app
  }
  return null
}

/**
 * Returns curated third-party global hotkeys for the apps that are currently
 * running. These fill the "works when the app is not focused" segment that no OS
 * API can enumerate live.
 */
export function getCuratedShortcuts(apps: RunningApp[], platform: Platform): RawShortcut[] {
  const raws: RawShortcut[] = []

  for (const entry of CURATED_APPS) {
    if (entry.platform !== platform) continue
    if (!entry.shortcuts?.length) continue
    const match = findMatch(entry, apps)
    if (!match) continue

    for (const sc of entry.shortcuts) {
      raws.push({
        key: sc.key,
        modifiers: sc.modifiers,
        origin: 'app',
        segment: 'global-app',
        source: 'curated',
        appId: match.id,
        appName: entry.appName,
        description: sc.description,
        enabled: true
      })
    }
  }

  return raws
}

/**
 * Returns curated in-app (frontmost-only) shortcuts for a single running app, in
 * the `focused-menu` segment. This is the fallback for platforms whose menus
 * cannot be read live for a background app (Windows UI Automation exposes no
 * accelerator table without opening each menu). Scoped to one app so a
 * frontmost-only scan surfaces only the focused app's shortcuts. A live-detected
 * value for the same combo supersedes the curated one during aggregation.
 */
export function getCuratedMenuShortcuts(app: RunningApp, platform: Platform): RawShortcut[] {
  const raws: RawShortcut[] = []

  for (const entry of CURATED_APPS) {
    if (entry.platform !== platform) continue
    if (!entry.menuShortcuts?.length) continue
    if (!findMatch(entry, [app])) continue

    for (const sc of entry.menuShortcuts) {
      raws.push({
        key: sc.key,
        modifiers: sc.modifiers,
        origin: 'app',
        segment: 'focused-menu',
        source: 'curated',
        appId: app.id,
        appName: entry.appName,
        description: sc.description,
        enabled: true
      })
    }
  }

  return raws
}
