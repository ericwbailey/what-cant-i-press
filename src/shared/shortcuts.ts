/**
 * Cross-platform keyboard-shortcut domain model shared between the Electron
 * main process (which produces shortcuts) and the renderer (which displays
 * them). This module is intentionally free of Node/Electron dependencies so it
 * can be imported from either side and unit-tested in isolation.
 */

/** Canonical modifier tokens covering both macOS and Windows. */
export const MODIFIERS = [
  'function',
  'control',
  'option',
  'shift',
  'command',
  'super'
] as const

export type Modifier = (typeof MODIFIERS)[number]

/**
 * Host platform identifier. Structurally identical to Node's `NodeJS.Platform`
 * union, but declared here so shared/renderer code needs no Node type deps.
 */
export type Platform =
  | 'aix'
  | 'android'
  | 'darwin'
  | 'freebsd'
  | 'haiku'
  | 'linux'
  | 'openbsd'
  | 'sunos'
  | 'win32'
  | 'cygwin'
  | 'netbsd'

/** Scope in which a shortcut is reserved. */
export type ShortcutSegment =
  | 'global-os' // reserved system-wide by the OS, always
  | 'global-app' // reserved system-wide by a running app (works when unfocused)
  | 'focused-menu' // reserved by an app only while that app is frontmost
  | 'screen-reader' // reserved by a screen reader while it is running

/** How the shortcut was obtained. */
export type ShortcutSource = 'detected' | 'curated'

/** Whether the shortcut belongs to the OS or a specific application. */
export type ShortcutOrigin = 'os' | 'app'

/**
 * Reliability of the shortcut record. `declared` values are recovered with high
 * reliability from a menu/accelerator/resource/manual (every enumerated shortcut
 * this app emits). `inferred` marks a coverage-gap marker whose exact key values
 * are not statically resolvable (e.g. runtime `RegisterEventHotKey` registrations).
 */
export type ShortcutConfidence = 'declared' | 'inferred'

/**
 * Where a shortcut is reserved: `app` while its app is frontmost, `global`
 * system-wide regardless of focus, `unknown` when it cannot be determined.
 */
export type ShortcutScope = 'app' | 'global' | 'unknown'

/**
 * Raw shortcut emitted by a platform provider or the curated database, before
 * normalization (id + display label) by the aggregation service.
 */
export interface RawShortcut {
  key: string
  modifiers: Modifier[]
  origin: ShortcutOrigin
  segment: ShortcutSegment
  source: ShortcutSource
  appId?: string
  appName?: string
  description?: string
  enabled?: boolean
  /**
   * Reliability of this record. Defaults to `declared` during aggregation when a
   * provider does not set it.
   */
  confidence?: ShortcutConfidence
  /**
   * Reservation scope. Defaults to the segment's scope (see {@link SEGMENT_SCOPE})
   * during aggregation when a provider does not set it.
   */
  scope?: ShortcutScope
  /**
   * Explicit, verbatim combo label. When set, it is used directly as the display
   * combo and dedupe key instead of deriving one from `key` + `modifiers`. Used
   * by screen-reader commands whose keystrokes (reader key, numpad keys,
   * multi-step sequences) do not fit the key/modifier model and must render with
   * fixed notation regardless of host platform.
   */
  keystroke?: string
}

/** A normalized, display-ready shortcut. */
export interface Shortcut {
  /** Stable dedupe key (segment + app + canonical combo). */
  id: string
  /** Canonical key token, e.g. 'A', 'F5', 'Space', 'Left', '/'. */
  key: string
  /** Canonical, de-duplicated, ordered modifiers. */
  modifiers: Modifier[]
  /** Platform-specific display string, e.g. '⇧⌘A' or 'Ctrl+Shift+A'. */
  comboLabel: string
  segment: ShortcutSegment
  source: ShortcutSource
  origin: ShortcutOrigin
  /** Reliability of this record: `declared` for every enumerated shortcut. */
  confidence: ShortcutConfidence
  /** Reservation scope, derived from {@link SEGMENT_SCOPE}. */
  scope: ShortcutScope
  appId?: string
  appName?: string
  description?: string
  enabled: boolean
}

/** Canonical ordering index for stable ids and consistent display. */
const MODIFIER_ORDER = new Map<Modifier, number>(MODIFIERS.map((m, i) => [m, i]))

/** Removes duplicates and sorts modifiers into canonical order. */
export function canonicalizeModifiers(modifiers: Modifier[]): Modifier[] {
  const seen = new Set<Modifier>()
  for (const m of modifiers) {
    if (MODIFIER_ORDER.has(m)) seen.add(m)
  }
  return [...seen].sort(
    (a, b) => (MODIFIER_ORDER.get(a) ?? 0) - (MODIFIER_ORDER.get(b) ?? 0)
  )
}

/**
 * Normalizes a raw key string (a character from a menu accelerator, or an
 * already-canonical token) into a canonical token. Single letters are
 * upper-cased; a literal space becomes 'Space'.
 */
export function normalizeKeyToken(raw: string): string {
  if (!raw) return ''
  if (raw === ' ') return 'Space'
  if (raw.length === 1) return raw.toUpperCase()
  return raw
}

const MAC_MODIFIER_SYMBOL: Record<Modifier, string> = {
  function: 'fn',
  control: '⌃',
  option: '⌥',
  shift: '⇧',
  command: '⌘',
  super: '⌘'
}

const WIN_MODIFIER_LABEL: Record<Modifier, string> = {
  super: 'Win',
  control: 'Ctrl',
  option: 'Alt',
  shift: 'Shift',
  function: 'Fn',
  command: 'Cmd'
}

const MAC_DISPLAY_ORDER: Modifier[] = [
  'function',
  'control',
  'option',
  'shift',
  'command',
  'super'
]

const WIN_DISPLAY_ORDER: Modifier[] = [
  'super',
  'control',
  'option',
  'shift',
  'function',
  'command'
]

const MAC_KEY_SYMBOL: Record<string, string> = {
  Space: 'Space',
  Tab: '⇥',
  Return: '↩',
  Enter: '⌅',
  Escape: '⎋',
  Delete: '⌫',
  ForwardDelete: '⌦',
  Left: '←',
  Right: '→',
  Up: '↑',
  Down: '↓',
  Home: '↖',
  End: '↘',
  PageUp: '⇞',
  PageDown: '⇟',
  Clear: '⌧'
}

const WIN_KEY_LABEL: Record<string, string> = {
  Space: 'Space',
  Tab: 'Tab',
  Return: 'Enter',
  Enter: 'Enter',
  Escape: 'Esc',
  Delete: 'Backspace',
  ForwardDelete: 'Delete',
  Left: 'Left',
  Right: 'Right',
  Up: 'Up',
  Down: 'Down',
  Home: 'Home',
  End: 'End',
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  Clear: 'Clear'
}

function formatKey(key: string, platform: Platform): string {
  if (platform === 'darwin') return MAC_KEY_SYMBOL[key] ?? key
  return WIN_KEY_LABEL[key] ?? key
}

/** Ordered display tokens for a combo: modifier symbols/labels, then the key. */
export function comboTokens(key: string, modifiers: Modifier[], platform: Platform): string[] {
  const ordered = canonicalizeModifiers(modifiers)
  const keyLabel = formatKey(key, platform)

  if (platform === 'darwin') {
    const parts = MAC_DISPLAY_ORDER.filter((m) => ordered.includes(m)).map(
      (m) => MAC_MODIFIER_SYMBOL[m]
    )
    return [...parts, keyLabel]
  }

  const parts = WIN_DISPLAY_ORDER.filter((m) => ordered.includes(m)).map(
    (m) => WIN_MODIFIER_LABEL[m]
  )
  return [...parts, keyLabel]
}

/** Builds the platform-specific human-readable combo label. */
export function formatCombo(
  key: string,
  modifiers: Modifier[],
  platform: Platform
): string {
  const tokens = comboTokens(key, modifiers, platform)
  return platform === 'darwin' ? tokens.join('') : tokens.join('+')
}

/** Builds a stable, case-insensitive dedupe id for a shortcut. */
export function buildShortcutId(
  segment: ShortcutSegment,
  appId: string | undefined,
  key: string,
  modifiers: Modifier[]
): string {
  const mods = canonicalizeModifiers(modifiers).join('+')
  const combo = mods ? `${mods}+${key}` : key
  return `${segment}|${appId ?? 'os'}|${combo}`.toLowerCase()
}

/** Human-friendly section titles per segment. */
export const SEGMENT_LABELS: Record<ShortcutSegment, string> = {
  'global-os': 'Global Operating System',
  'global-app': 'Global - works when app is not focused',
  'focused-menu': 'App menu',
  'screen-reader': 'Screen reader'
}

/**
 * Reservation scope per segment. `global-app`/`screen-reader` are `global` because
 * they intercept keys regardless of which app is focused; `focused-menu` is `app`
 * because it only applies while that app is frontmost.
 */
export const SEGMENT_SCOPE: Record<ShortcutSegment, ShortcutScope> = {
  'global-os': 'global',
  'global-app': 'global',
  'focused-menu': 'app',
  'screen-reader': 'global'
}
