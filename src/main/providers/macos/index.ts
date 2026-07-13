import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { join } from 'node:path'
import { app, systemPreferences } from 'electron'
import type { Platform, RawShortcut } from '@shared/shortcuts'
import type { PermissionStatus } from '@shared/scan'
import type { PlatformProvider, RunningApp } from '../types'
import { readSymbolicHotkeys } from './symbolic-hotkeys'
import { decodeMenuItem, type RawMenuItem } from './menu'

const execFileAsync = promisify(execFile)

interface HelperApp {
  id: string
  name: string
  pid: number
}

const HELPER_BINARY = 'shortcut-helper-macos'

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
    if (!Array.isArray(items)) return []

    const raws: RawShortcut[] = []
    for (const item of items) {
      const decoded = decodeMenuItem(item)
      if (!decoded) continue
      raws.push({
        key: decoded.key,
        modifiers: decoded.modifiers,
        origin: 'app',
        segment: 'focused-menu',
        source: 'detected',
        appId: appRef.id,
        appName: appRef.name,
        description: item.title || undefined,
        enabled: true
      })
    }
    return raws
  }

  async getFrontmostApp(): Promise<RunningApp | null> {
    const info = await runHelper<HelperApp | null>(['frontmost'])
    if (!info || !info.pid) return null
    return toRunningApp(info)
  }

  async activateApp(appRef: RunningApp): Promise<void> {
    await runHelper(['activate', String(appRef.pid)])
  }

  async permissionStatus(): Promise<PermissionStatus> {
    const result = await runHelper<{ trusted: boolean }>(['axtrust'])
    const trusted = result?.trusted ?? systemPreferences.isTrustedAccessibilityClient(false)
    return {
      accessibility: trusted ? 'granted' : 'denied',
      details: trusted
        ? undefined
        : 'Grant Accessibility access in System Settings → Privacy & Security → Accessibility, then rescan.'
    }
  }

  async requestPermission(): Promise<PermissionStatus> {
    // Prompts and opens the Accessibility settings pane when not yet trusted.
    const trusted = systemPreferences.isTrustedAccessibilityClient(true)
    return {
      accessibility: trusted ? 'granted' : 'denied',
      details: trusted
        ? undefined
        : 'Approve the app in System Settings → Privacy & Security → Accessibility, then rescan.'
    }
  }
}
