import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Modifier, RawShortcut } from '@shared/shortcuts'
import { DIGIT_VK, SPECIAL_VK, decodeNsModifiers } from './keycodes'
import { SYMBOLIC_HOTKEY_NAMES } from './symbolic-names'

const execFileAsync = promisify(execFile)

const NO_KEY = 65535

interface SymbolicEntry {
  enabled?: boolean
  value?: { parameters?: number[] }
}

function decodeKey(ascii: number, keycode: number): string | null {
  if (ascii !== NO_KEY && ascii > 0 && ascii < 0x110000) {
    const char = String.fromCharCode(ascii)
    return char === ' ' ? 'Space' : char
  }
  if (keycode === NO_KEY) return null
  return SPECIAL_VK[keycode] ?? DIGIT_VK[keycode] ?? null
}

/**
 * Reads and decodes macOS system shortcuts from the symbolic-hotkeys preference
 * domain. Uses `plutil` to convert the (possibly binary) plist to JSON.
 */
export async function readSymbolicHotkeys(): Promise<RawShortcut[]> {
  const plistPath = join(homedir(), 'Library/Preferences/com.apple.symbolichotkeys.plist')

  let parsed: { AppleSymbolicHotKeys?: Record<string, SymbolicEntry> }
  try {
    const { stdout } = await execFileAsync(
      'plutil',
      ['-convert', 'json', '-o', '-', plistPath],
      { maxBuffer: 8 * 1024 * 1024 }
    )
    parsed = JSON.parse(stdout)
  } catch {
    return []
  }

  const map = parsed.AppleSymbolicHotKeys
  if (!map || typeof map !== 'object') return []

  const out: RawShortcut[] = []
  for (const [idStr, entry] of Object.entries(map)) {
    const params = entry?.value?.parameters
    if (!Array.isArray(params) || params.length < 3) continue

    const key = decodeKey(Number(params[0]), Number(params[1]))
    if (!key) continue

    const modifiers: Modifier[] = decodeNsModifiers(Number(params[2]) || 0, key)
    const id = Number(idStr)

    out.push({
      key,
      modifiers,
      origin: 'os',
      segment: 'global-os',
      source: 'detected',
      appName: 'macOS',
      description: SYMBOLIC_HOTKEY_NAMES[id] ?? 'Reserved system shortcut',
      enabled: entry.enabled !== false
    })
  }
  return out
}
