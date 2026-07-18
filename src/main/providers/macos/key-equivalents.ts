import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { type Modifier, type RawShortcut, normalizeKeyToken } from '@shared/shortcuts'
import { GLYPH_TO_TOKEN } from './keycodes'
import { decodeMenuItem, type RawMenuItem } from './menu'

const execFileAsync = promisify(execFile)

/** A decoded App Shortcuts override: canonical key + modifiers. */
export interface KeyEquivalent {
  key: string
  modifiers: Modifier[]
}

/** Both dictionaries of App Shortcuts overrides, keyed by menu-item title. */
export interface KeyEquivalents {
  /** Overrides bound for this specific app; supersede and may add rows. */
  appSpecific: Map<string, KeyEquivalent>
  /** Overrides bound for "All Applications"; only replace existing menu titles. */
  global: Map<string, KeyEquivalent>
}

/** Leading modifier glyphs used by NSUserKeyEquivalents strings. */
const GLYPH_MODIFIERS: Record<string, Modifier | null> = {
  '@': 'command',
  $: 'shift',
  '~': 'option',
  '^': 'control',
  '#': null // numeric-keypad marker: not a modifier, ignored
}

/**
 * Decodes an NSUserKeyEquivalents value (e.g. `@$s` -> Command+Shift+S). Leading
 * characters are modifier glyphs; the remainder is the key. Returns null when no
 * usable key remains. Letter case is not treated as an implicit Shift, matching
 * how menu accelerators are decoded elsewhere.
 */
export function parseKeyEquivalentString(value: string): KeyEquivalent | null {
  if (!value) return null

  const modifiers: Modifier[] = []
  let i = 0
  while (i < value.length && value[i] in GLYPH_MODIFIERS) {
    const mod = GLYPH_MODIFIERS[value[i]]
    if (mod) modifiers.push(mod)
    i++
  }

  const rest = value.slice(i)
  if (!rest) return null

  const key = GLYPH_TO_TOKEN[rest] ?? normalizeKeyToken(rest)
  if (!key) return null
  return { key, modifiers }
}

/** Runs `plutil` converting an XML plist on stdin to a parsed JSON object. */
function plutilJson(xml: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const child = spawn('plutil', ['-convert', 'json', '-o', '-', '-'])
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (err += d))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(err || `plutil exited ${code}`))
      try {
        resolve(JSON.parse(out))
      } catch (e) {
        reject(e)
      }
    })
    child.stdin.on('error', () => {
      // Ignore EPIPE if plutil exits before the write finishes.
    })
    child.stdin.write(xml)
    child.stdin.end()
  })
}

/** Reads a preference domain's `NSUserKeyEquivalents` dictionary as title->glyph string. */
async function readDomainEquivalents(domain: string): Promise<Record<string, string>> {
  let xml: string
  try {
    const { stdout } = await execFileAsync('defaults', ['export', domain, '-'], {
      timeout: 4000,
      maxBuffer: 8 * 1024 * 1024
    })
    xml = stdout
  } catch {
    return {}
  }
  if (!xml.trim()) return {}

  try {
    const parsed = (await plutilJson(xml)) as { NSUserKeyEquivalents?: unknown }
    const dict = parsed?.NSUserKeyEquivalents
    if (!dict || typeof dict !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [title, value] of Object.entries(dict as Record<string, unknown>)) {
      if (typeof value === 'string') out[title] = value
    }
    return out
  } catch {
    return {}
  }
}

function decodeDomain(raw: Record<string, string>): Map<string, KeyEquivalent> {
  const map = new Map<string, KeyEquivalent>()
  for (const [title, value] of Object.entries(raw)) {
    const decoded = parseKeyEquivalentString(value)
    if (decoded) map.set(title, decoded)
  }
  return map
}

/**
 * Reads macOS App Shortcuts overrides (System Settings -> Keyboard -> Keyboard
 * Shortcuts -> App Shortcuts) for a bundle id and for "All Applications"
 * (`NSGlobalDomain`). Degrades to empty maps on any failure. This is the
 * canonical override store; `com.apple.universalaccess` holds accessibility
 * feature hotkeys, not menu-command overrides.
 */
export async function readKeyEquivalents(bundleId: string): Promise<KeyEquivalents> {
  const [appRaw, globalRaw] = await Promise.all([
    bundleId ? readDomainEquivalents(bundleId) : Promise.resolve({}),
    readDomainEquivalents('NSGlobalDomain')
  ])
  return { appSpecific: decodeDomain(appRaw), global: decodeDomain(globalRaw) }
}

/**
 * Merges detected menu accelerators with App Shortcuts overrides for one app.
 * An app-specific override supersedes the default for the same menu title, and
 * adds a reserved row when that command had no default accelerator (so the menu
 * read did not surface it). A global ("All Applications") override only replaces
 * an existing menu title — it never fabricates a row for an app that lacks the
 * command.
 */
export function mergeMenuOverrides(
  menuItems: RawMenuItem[],
  overrides: KeyEquivalents,
  appRef: { id: string; name: string }
): RawShortcut[] {
  const raws: RawShortcut[] = []
  const consumedAppTitles = new Set<string>()

  const toRaw = (combo: KeyEquivalent, title: string): RawShortcut => ({
    key: combo.key,
    modifiers: combo.modifiers,
    origin: 'app',
    segment: 'focused-menu',
    source: 'detected',
    appId: appRef.id,
    appName: appRef.name,
    description: title || undefined,
    enabled: true
  })

  for (const item of menuItems) {
    const title = item.title || ''
    const override = overrides.appSpecific.get(title) ?? overrides.global.get(title)
    const decoded = override ?? decodeMenuItem(item)
    if (!decoded) continue
    if (override && overrides.appSpecific.has(title)) consumedAppTitles.add(title)
    raws.push(toRaw(decoded, title))
  }

  for (const [title, combo] of overrides.appSpecific) {
    if (consumedAppTitles.has(title)) continue
    raws.push(toRaw(combo, title))
  }

  return raws
}
