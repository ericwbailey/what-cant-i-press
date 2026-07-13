import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { join } from 'node:path'
import { app } from 'electron'
import type { Platform, RawShortcut } from '@shared/shortcuts'
import type { PermissionStatus } from '@shared/scan'
import type { PlatformProvider, RunningApp } from '../types'
import { parseAcceleratorString } from './accelerators'
import { windowsOsShortcuts } from './os-shortcuts'

const execFileAsync = promisify(execFile)

interface HelperApp {
  id: string
  name: string
  pid: number
}

interface HelperMenuItem {
  title: string
  accelerator: string
}

const HELPER_BINARY = 'shortcut-helper-win.exe'

function helperPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'bin', HELPER_BINARY)
    : join(app.getAppPath(), 'resources', 'bin', HELPER_BINARY)
}

/** Invokes the .NET UI Automation helper and parses its JSON output. */
async function runHelper<T>(args: string[]): Promise<T | null> {
  try {
    const { stdout } = await execFileAsync(helperPath(), args, {
      timeout: 12000,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true
    })
    return JSON.parse(stdout) as T
  } catch {
    return null
  }
}

function toRunningApp(info: HelperApp): RunningApp {
  return { id: info.id || info.name, name: info.name, pid: info.pid, hasMenu: true }
}

/**
 * Windows provider backed by a .NET UI Automation helper for live menu
 * accelerators, plus a curated system-shortcut list (Windows exposes no
 * enumerable OS-shortcut store).
 */
export class WindowsProvider implements PlatformProvider {
  readonly platform: Platform = 'win32'

  async listRunningApps(): Promise<RunningApp[]> {
    const apps = await runHelper<HelperApp[]>(['apps'])
    if (!apps) return []
    return apps.filter((a) => a.name).map(toRunningApp)
  }

  async readOsShortcuts(): Promise<RawShortcut[]> {
    return windowsOsShortcuts()
  }

  async readAppMenuShortcuts(appRef: RunningApp): Promise<RawShortcut[]> {
    const items = await runHelper<HelperMenuItem[]>(['menu', String(appRef.pid)])
    if (!Array.isArray(items)) return []

    const raws: RawShortcut[] = []
    for (const item of items) {
      const decoded = parseAcceleratorString(item.accelerator)
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
    return {
      accessibility: 'not-required',
      details:
        'UI Automation needs no permission for standard apps. Apps running as administrator are unreadable unless this app is also elevated.'
    }
  }

  async requestPermission(): Promise<PermissionStatus> {
    return this.permissionStatus()
  }
}
