import { app } from 'electron'
import { appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

let cachedPath: string | null = null

/** Resolves (and creates) the log directory once. Returns null if it can't. */
function ensurePath(): string | null {
  if (cachedPath) return cachedPath
  try {
    const dir = join(app.getPath('userData'), 'logs')
    mkdirSync(dir, { recursive: true })
    cachedPath = join(dir, 'main.log')
    return cachedPath
  } catch {
    return null
  }
}

/**
 * Appends a timestamped line to `userData/logs/main.log` and mirrors it to
 * stderr. Best-effort: any failure is swallowed so logging never affects
 * startup. The file records the tray/status-item outcome on machines where the
 * app is launched from Finder with no attached terminal — the record needed to
 * pin down why a status item may not appear.
 */
export function log(message: string): void {
  const line = `${new Date().toISOString()} ${message}`
  // Mirror to stderr so a `.../Contents/MacOS/<binary>` terminal run shows it too.
  console.error(`[wcip] ${line}`)
  const path = ensurePath()
  if (!path) return
  try {
    appendFileSync(path, line + '\n')
  } catch {
    // Best-effort logging only.
  }
}

/** Serializes an unknown thrown value to a loggable string with a stack if present. */
export function describeError(err: unknown): string {
  return err instanceof Error ? (err.stack ?? err.message) : String(err)
}

/** Absolute path to the log file, for surfacing to the user. */
export function logFilePath(): string {
  return ensurePath() ?? join(app.getPath('userData'), 'logs', 'main.log')
}
