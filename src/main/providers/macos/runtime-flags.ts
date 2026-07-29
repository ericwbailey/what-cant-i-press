import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { CoverageGap } from '@shared/scan'
import type { RunningApp } from '../types'
import { binaryImportsSymbol } from './macho'

const execFileAsync = promisify(execFile)

/** Undefined (imported) symbol that indicates Carbon runtime hotkey use. */
const HOTKEY_SYMBOL = '_RegisterEventHotKey'

/** Resolves the full executable path for a pid via `ps` (macOS prints the full path). */
async function executablePath(pid: number): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('ps', ['-o', 'comm=', '-p', String(pid)], {
      timeout: 3000
    })
    const path = stdout.trim()
    return path.startsWith('/') ? path : null
  } catch {
    return null
  }
}

/**
 * Flags whether an app's main executable imports `RegisterEventHotKey`, i.e. it
 * may register global hotkeys at runtime that no menu/accelerator API can
 * enumerate. Detects presence of the imported symbol only — not a call count.
 *
 * Best-effort: reads the executable's Mach-O symbol table in-process (no
 * external tools), and only inspects the main executable (not linked
 * frameworks). Any failure — no path, unreadable binary, malformed Mach-O —
 * resolves to null rather than throwing.
 */
export async function readRuntimeHotkeyFlag(app: RunningApp): Promise<CoverageGap | null> {
  const path = await executablePath(app.pid)
  if (!path) return null

  if (!(await binaryImportsSymbol(path, HOTKEY_SYMBOL))) return null

  return {
    appId: app.id,
    appName: app.name,
    source: 'binary-flag',
    confidence: 'inferred',
    scope: 'unknown',
    detail: `${app.name} references RegisterEventHotKey; any runtime-registered hotkeys cannot be enumerated and are not listed here.`
  }
}
