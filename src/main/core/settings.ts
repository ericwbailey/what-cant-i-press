import { app } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

interface Settings {
  hasLaunched?: boolean
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function read(): Settings {
  try {
    return JSON.parse(readFileSync(settingsPath(), 'utf8')) as Settings
  } catch {
    // Missing or unreadable file is treated as a fresh install.
    return {}
  }
}

function write(settings: Settings): void {
  try {
    writeFileSync(settingsPath(), JSON.stringify(settings, null, 2))
  } catch {
    // Best-effort: a failed write just means the first-run UI shows again later.
  }
}

/**
 * Returns true exactly once — on the first launch (or after the settings file is
 * cleared) — and records the launch so later runs return false. Used to reveal
 * the popover once, so a first launch of this menu-bar-only app always produces
 * visible UI even if the status item never appears.
 */
export function isFirstLaunch(): boolean {
  const settings = read()
  if (settings.hasLaunched) return false
  write({ ...settings, hasLaunched: true })
  return true
}
