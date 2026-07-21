import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { join } from 'node:path'
import { app, systemPreferences } from 'electron'
import type { Platform, RawShortcut } from '@shared/shortcuts'
import type { CoverageGap, PermissionStatus } from '@shared/scan'
import type { PlatformProvider, RunningApp } from '../types'
import { readSymbolicHotkeys } from './symbolic-hotkeys'
import { type RawMenuItem } from './menu'
import { mergeMenuOverrides, readKeyEquivalents } from './key-equivalents'
import { readRuntimeHotkeyFlag } from './runtime-flags'

const execFileAsync = promisify(execFile)

interface HelperApp {
  id: string
  name: string
  pid: number
}

const HELPER_BINARY = 'shortcut-helper-macos'

// Shown when Accessibility is not granted. Names the remove/re-add remedy because
// an unsigned build's grant is keyed to a per-build code signature: after an
// update the app can still appear enabled in the list while the OS no longer
// trusts it, and only removing and re-adding it re-keys the grant.
const ACCESSIBILITY_DENIED_DETAILS =
  'Grant Accessibility in System Settings \u2192 Privacy & Security \u2192 Accessibility. ' +
  'If \u201cWhat Can\u2019t I Press\u201d is already listed, remove it with the \u201c\u2013\u201d button and add it again, then rescan.'

function helperPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'bin', HELPER_BINARY)
    : join(app.getAppPath(), 'resources', 'bin', HELPER_BINARY)
}

/** Invokes the Swift helper with a subcommand and parses its JSON output. */
async function runHelper<T>(args: string[]): Promise<T | null> {
  try {
    const { stdout } = await execFileAsync(helperPath(), args, {
      timeout: 8000,
      maxBuffer: 16 * 1024 * 1024
    })
    return JSON.parse(stdout) as T
  } catch {
    return null
  }
}

function toRunningApp(info: HelperApp): RunningApp {
  return { id: info.id || info.name, name: info.name, pid: info.pid, hasMenu: true }
}

/** macOS provider backed by the Swift Accessibility helper and symbolic hotkeys. */
export class MacProvider implements PlatformProvider {
  readonly platform: Platform = 'darwin'

  async listRunningApps(): Promise<RunningApp[]> {
    const apps = await runHelper<HelperApp[]>(['apps'])
    if (!apps) return []
    return apps.filter((a) => a.name).map(toRunningApp)
  }

  async readOsShortcuts(): Promise<RawShortcut[]> {
    return readSymbolicHotkeys()
  }

  async readAppMenuShortcuts(appRef: RunningApp): Promise<RawShortcut[]> {
    const items = await runHelper<RawMenuItem[]>(['menu', String(appRef.pid)])
    const menuItems = Array.isArray(items) ? items : []
    // App Shortcuts overrides (System Settings) supersede the app's own defaults.
    const overrides = await readKeyEquivalents(appRef.id)
    return mergeMenuOverrides(menuItems, overrides, appRef)
  }

  async getFrontmostApp(): Promise<RunningApp | null> {
    const info = await runHelper<HelperApp | null>(['frontmost'])
    if (!info || !info.pid) return null
    return toRunningApp(info)
  }

  async activateApp(appRef: RunningApp): Promise<void> {
    await runHelper(['activate', String(appRef.pid)])
  }

  async readCoverageGaps(appRef: RunningApp): Promise<CoverageGap[]> {
    const gap = await readRuntimeHotkeyFlag(appRef)
    return gap ? [gap] : []
  }

  async permissionStatus(): Promise<PermissionStatus> {
    const trusted = await accessibilityTrusted()
    return {
      accessibility: trusted ? 'granted' : 'denied',
      details: trusted ? undefined : ACCESSIBILITY_DENIED_DETAILS
    }
  }

  async requestPermission(): Promise<PermissionStatus> {
    // Prompts and opens the Accessibility settings pane when not yet trusted.
    const trusted = systemPreferences.isTrustedAccessibilityClient(true)
    return {
      accessibility: trusted ? 'granted' : 'denied',
      details: trusted ? undefined : ACCESSIBILITY_DENIED_DETAILS
    }
  }
}

/**
 * Whether the app currently holds Accessibility permission. Probed through the
 * Swift helper, which runs in a freshly spawned process, so the result reflects
 * the CURRENT grant. `systemPreferences.isTrustedAccessibilityClient` is avoided
 * as the primary source because the long-lived main process caches its trust
 * value for the process lifetime and does not refresh after the user grants
 * access; the helper is used as the fallback only when it cannot run.
 */
export async function accessibilityTrusted(): Promise<boolean> {
  const result = await runHelper<{ trusted: boolean }>(['axtrust'])
  return result?.trusted ?? systemPreferences.isTrustedAccessibilityClient(false)
}
