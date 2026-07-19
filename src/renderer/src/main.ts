import './styles.css'
import {
  createIcons,
  Download,
  CircleHelp,
  ChevronsUpDown,
  X,
  Search,
  TriangleAlert,
  ShieldCheck,
  Pin,
  Info
} from 'lucide'
import type { CoverageGap, PermissionStatus, ScanResult } from '@shared/scan'
import {
  comboTokens,
  formatCombo,
  canonicalizeModifiers,
  normalizeKeyToken,
  MODIFIERS,
  SEGMENT_LABELS,
  type Modifier,
  type Platform,
  type Shortcut,
  type ShortcutSegment
} from '@shared/shortcuts'
import { initEasterEgg } from './easter-egg'
import { announce } from './aria-live.js'

const SEGMENT_ORDER: ShortcutSegment[] = [
  'global-app',
  'focused-menu',
  'screen-reader',
  'global-os'
]

/** Screen-reader sections always rendered, even before a scan. */
const READER_APP_NAMES = ['JAWS', 'NVDA', 'Narrator', 'VoiceOver']

const ICONS = { Download, CircleHelp, ChevronsUpDown, X, Search, TriangleAlert, ShieldCheck, Pin, Info }

/** Replaces `<i data-lucide>` placeholders under `scope` with Lucide SVGs. */
function renderIcons(scope: Element | Document = document): void {
  createIcons({ icons: ICONS, root: scope })
}

const MOD_FULL_MAC: Record<Modifier, string> = {
  function: 'Function',
  control: 'Control',
  option: 'Option',
  shift: 'Shift',
  command: 'Command',
  super: 'Command'
}

const MOD_FULL_WIN: Record<Modifier, string> = {
  super: 'Windows',
  control: 'Control',
  option: 'Alt',
  shift: 'Shift',
  function: 'Fn',
  command: 'Command'
}

const KEY_FULL: Record<string, string> = {
  Space: 'Space',
  Tab: 'Tab',
  Return: 'Return',
  Enter: 'Enter',
  Escape: 'Escape',
  Delete: 'Delete',
  ForwardDelete: 'Forward Delete',
  Left: 'Left Arrow',
  Right: 'Right Arrow',
  Up: 'Up Arrow',
  Down: 'Down Arrow',
  Home: 'Home',
  End: 'End',
  PageUp: 'Page Up',
  PageDown: 'Page Down',
  Clear: 'Clear'
}

// Spelled-out combo tokens, one per key: e.g. ['Command', 'S'] or ['Shift',
// 'Command', 'A']. Used for the hover tooltip and the Control-modified copy.
function fullComboTokens(shortcut: Shortcut, platform: Platform): string[] {
  const map = platform === 'darwin' ? MOD_FULL_MAC : MOD_FULL_WIN
  const mods = shortcut.modifiers.map((m) => map[m])
  const key = KEY_FULL[shortcut.key] ?? shortcut.key
  return [...mods, key]
}

function fullComboName(shortcut: Shortcut, platform: Platform): string {
  return fullComboTokens(shortcut, platform).join(' + ')
}

const wrapKbd = (token: string): string => `<kbd>${token}</kbd>`

// Split a keystroke-only `comboLabel` into its display steps and keys, wrapping
// each key via `wrapKey` and keeping ", then" / "twice quickly" as plain text.
function tokenizeKeystrokeLabel(label: string, wrapKey: (token: string) => string): string {
  return label
    .split(', then ')
    .map((step) => {
      let core = step
      let twice = ''
      if (/(?: \+ | )twice quickly$/.test(core)) {
        core = core.replace(/(?: \+ | )twice quickly$/, '')
        twice = ', twice quickly'
      }
      const keys = core
        .split(' + ')
        .filter((token) => token.length > 0)
        .map(wrapKey)
        .join(' + ')
      return keys + twice
    })
    .join(', then ')
}

// Control-modified copy payload: the combo as literal HTML text with each key
// wrapped in a `<kbd>` element (e.g. "<kbd>Command</kbd> + <kbd>S</kbd>"). Keyed
// shortcuts use the spelled-out names; keystroke-only rows (screen-reader
// commands and verbatim OS labels) wrap each key token in `comboLabel`, keeping
// the " + ", ", then", and "twice quickly" connectives as plain text.
function comboKbdHtml(shortcut: Shortcut, platform: Platform): string {
  if (shortcut.key) return fullComboTokens(shortcut, platform).map(wrapKbd).join(' + ')
  return tokenizeKeystrokeLabel(shortcut.comboLabel, wrapKbd)
}

// Shift-modified copy payload: the combo exactly as shown on screen (platform
// symbols / symbolized reader tokens) wrapped in `<kbd>`, e.g.
// "<kbd>⌘</kbd> + <kbd>S</kbd>". Mirrors the row's chips. Non-screen-reader
// keystroke-only rows render their whole label as one chip, so it is wrapped once.
function comboVisualKbdHtml(shortcut: Shortcut, platform: Platform): string {
  if (shortcut.key) {
    return comboTokens(shortcut.key, shortcut.modifiers, platform).map(wrapKbd).join(' + ')
  }
  if (shortcut.segment === 'screen-reader') {
    return tokenizeKeystrokeLabel(shortcut.comboLabel, (token) =>
      wrapKbd(symbolizeReaderToken(token, shortcut.appName))
    )
  }
  return wrapKbd(shortcut.comboLabel)
}

const root = document.getElementById('app')
if (!root) throw new Error('missing #app root')

root.innerHTML = `
  <header id="header" data-f6 tabindex="-1">
    <div class="titles">
      <h1>What can't I press?</h1>
      <div class="subtitle">Reserved keyboard shortcuts</div>
    </div>
    <div class="header-actions">
      <button class="icon-btn" id="pin" aria-pressed="false" aria-label="Pin">
        <i data-lucide="pin" class="pin-glyph-unpinned" aria-hidden="true"></i>
        <svg class="pin-glyph-pinned" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 17V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9 10.76C8.9998 11.1321 8.89581 11.4967 8.69972 11.813C8.50363 12.1292 8.22321 12.3844 7.89 12.55L6.11 13.45C5.77679 13.6156 5.49637 13.8708 5.30028 14.187C5.10419 14.5033 5.0002 14.8679 5 15.24V16C5 16.2652 5.10536 16.5196 5.29289 16.7071C5.48043 16.8946 5.73478 17 6 17H18C18.2652 17 18.5196 16.8946 18.7071 16.7071C18.8946 16.5196 19 16.2652 19 16V15.24C18.9998 14.8679 18.8958 14.5033 18.6997 14.187C18.5036 13.8708 18.2232 13.6156 17.89 13.45L16.11 12.55C15.7768 12.3844 15.4964 12.1292 15.3003 11.813C15.1042 11.4967 15.0002 11.1321 15 10.76V7C15 6.73478 15.1054 6.48043 15.2929 6.29289C15.4804 6.10536 15.7348 6 16 6C16.5304 6 17.0391 5.78929 17.4142 5.41421C17.7893 5.03914 18 4.53043 18 4C18 3.46957 17.7893 2.96086 17.4142 2.58579C17.0391 2.21071 16.5304 2 16 2H8C7.46957 2 6.96086 2.21071 6.58579 2.58579C6.21071 2.96086 6 3.46957 6 4C6 4.53043 6.21071 5.03914 6.58579 5.41421C6.96086 5.78929 7.46957 6 8 6C8.26522 6 8.51957 6.10536 8.70711 6.29289C8.89464 6.48043 9 6.73478 9 7V10.76Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="icon-btn" id="quit" aria-label="Quit">
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    </div>
  </header>
  <div class="toolbar" id="toolbar" data-f6 tabindex="-1">
    <h2 class="hide-visually">Search and filter</h2>
    <div class="search-wrap">
      <i data-lucide="search" class="search-icon" aria-hidden="true"></i>
      <input id="search" type="search" placeholder="Filter by combo, app, or action" aria-label="Filter by combo, app, or action" autocomplete="off" spellcheck="false" />
      <span class="search-count" id="search-count" hidden></span>
      <button class="search-clear" id="clear-search" type="button" hidden aria-label="Clear filter">
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    </div>
  </div>
  <div class="result-bar">
    <h2 class="hide-visually">Keyboard shortcuts discovered</h2>
    <div class="status" id="status"></div>
    <button class="result-toggle" id="expand" type="button"><i data-lucide="chevrons-up-down" aria-hidden="true"></i>Expand/Collapse All</button>
  </div>
  <div id="banner"></div>
  <main id="content" data-f6 tabindex="-1"></main>
  <div class="chord-bar" id="chord-bar" data-f6 tabindex="-1" hidden>
    <h2 class="hide-visually">Filter by keypress</h2>
    <div class="chord-wrap">
      <input id="chord" class="chord-input" type="text" readonly placeholder="Press a shortcut to filter" aria-label="Filter by pressing a keyboard shortcut" aria-describedby="chord-hint" autocomplete="off" spellcheck="false" />
      <div id="chord-hint" class="hide-visually" aria-hidden="true">Press escape twice to move focus out of this input.</div>
      <span class="chord-caret" aria-hidden="true"></span>
      <button class="search-clear" id="chord-clear" type="button" hidden aria-label="Clear shortcut filter">
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    </div>
  </div>
  <footer id="footer" data-f6 tabindex="-1">
    <h2 class="hide-visually">Scan and export</h2>
    <button class="icon-btn" id="export" aria-disabled="true" data-tip="Export JSON" aria-label="Export JSON">
      <i data-lucide="download" aria-hidden="true"></i>
    </button>
    <div class="actions">
      <button class="secondary" id="scan-all">Scan all open apps</button>
      <button class="secondary" id="scan">Scan last focused app</button>
    </div>
  </footer>
  <div class="tip" id="tip" role="tooltip" hidden></div>
`

renderIcons()

const scanButton = document.getElementById('scan') as HTMLButtonElement
const scanAllButton = document.getElementById('scan-all') as HTMLButtonElement
const quitButton = document.getElementById('quit') as HTMLButtonElement
const pinButton = document.getElementById('pin') as HTMLButtonElement
const exportButton = document.getElementById('export') as HTMLButtonElement
const searchInput = document.getElementById('search') as HTMLInputElement
const clearButton = document.getElementById('clear-search') as HTMLButtonElement
const searchCount = document.getElementById('search-count') as HTMLElement
const statusEl = document.getElementById('status') as HTMLElement
const bannerEl = document.getElementById('banner') as HTMLElement
const content = document.getElementById('content') as HTMLElement
// Visually hidden landmark heading for the <main> region. render() overwrites
// content.innerHTML on every pass, so it is prepended each time to stay the
// first child of <main>.
const CONTENT_HEADING = '<h2 class="hide-visually">Keyboard shortcuts</h2>'
const tip = document.getElementById('tip') as HTMLElement
const chordInput = document.getElementById('chord') as HTMLInputElement
const chordClear = document.getElementById('chord-clear') as HTMLButtonElement
const chordBar = document.getElementById('chord-bar') as HTMLElement
const expandButton = document.getElementById('expand') as HTMLButtonElement

let lastResult: ScanResult | null = null
let scanning = false
const collapsedSegments = new Set<string>()
let tipTarget: HTMLElement | null = null
let activeChord: { key: string; modifiers: Modifier[] } | null = null

// Consecutive Escape presses while the chord field is focused. The field
// captures Tab to build chords, so it traps focus; a second Escape releases
// focus to the next control. Reset on blur and on any non-Escape key.
let chordEscapePresses = 0

// Whether the macOS Fn (Globe) key is currently held. Tracked separately because
// Chromium exposes no `event.fnKey` flag and only inconsistently reports Fn via
// `getModifierState('Fn')`, so its own keydown/keyup is the reliable signal.
let fnHeld = false
/** Curated screen-reader shortcuts, shown before any scan runs. */
let readerShortcuts: Shortcut[] = []
let readerPlatform: Platform = 'darwin'
/** True until the first scan clears the launch-time collapsed seeding. */
let seededReaderCollapse = false

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function updateExportState(): void {
  // `aria-disabled` (not the native `disabled` attribute) so the button stays
  // focusable and announces its state; activation is gated in `doExport`.
  const disabled = scanning || visibleShortcuts().length === 0
  exportButton.setAttribute('aria-disabled', String(disabled))
}

function setScanning(active: boolean): void {
  scanning = active
  scanButton.disabled = active
  scanAllButton.disabled = active
  updateExportState()
}

/**
 * Symmetric text-alias groups. Typing any term in a group filters for shortcuts
 * whose text contains ANY term in the group. Modifier groups include the on-screen
 * macOS symbol (⌘ ⌥ ⌃; `fn` is already the displayed function label) so
 * "cmd"/"command" surface ⌘ shortcuts — regular Mac shortcuts display the glyph,
 * never the word. Key groups pair a key name with its symbol and abbreviations.
 */
const TEXT_ALIAS_GROUPS: readonly (readonly string[])[] = [
  ['fn', 'function'],
  ['ctrl', 'control', '⌃'],
  ['opt', 'option', '⌥'],
  ['cmd', 'command', '⌘'],
  ['caps', 'caps lock'],
  ['return', '⏎'],
  ['enter', '⌤'],
  ['page up', 'pg up', 'pgup'],
  ['page down', 'pg dn', 'pg down', 'pgdn']
]

/**
 * Physical-key aliases for screen-reader modifier keys. Typing a physical key
 * also surfaces commands whose keystroke uses each reader's key token, matched
 * against the combo label only — this means "the reader's key" (mirroring how
 * "insert" already surfaces Insert-using JAWS rows) and avoids matching every
 * command of that reader via the app-name column.
 *
 * - Insert is the JAWS (already the literal `Insert` token), NVDA, and Narrator key.
 * - Caps Lock is the VoiceOver (`VO`) and Narrator key; "caps" resolves here too,
 *   since it aliases "caps lock".
 */
const READER_KEY_ALIASES: readonly { triggers: readonly string[]; comboTerms: readonly string[] }[] =
  [
    { triggers: ['insert'], comboTerms: ['nvda', 'narrator'] },
    { triggers: ['caps lock', 'caps'], comboTerms: ['vo', 'narrator'] }
  ]

type QueryClause = { term: string; comboOnly: boolean }

/**
 * Expands a normalized filter query into substring clauses: the query itself,
 * plus modifier-group synonyms (matched against the full text) and reader-key
 * terms (matched against the combo label only). Interior whitespace is collapsed
 * for alias lookup so e.g. "caps  lock" still triggers.
 */
function queryClauses(query: string): QueryClause[] {
  const clauses: QueryClause[] = [{ term: query, comboOnly: false }]
  const key = query.replace(/\s+/g, ' ')
  for (const group of TEXT_ALIAS_GROUPS) {
    if (group.includes(key)) {
      for (const term of group) if (term !== key) clauses.push({ term, comboOnly: false })
    }
  }
  for (const alias of READER_KEY_ALIASES) {
    if (alias.triggers.includes(key)) {
      for (const term of alias.comboTerms) clauses.push({ term, comboOnly: true })
    }
  }
  return clauses
}

function matchesQuery(shortcut: Shortcut, clauses: QueryClause[]): boolean {
  const combo = shortcut.comboLabel.toLowerCase()
  const haystack = `${combo} ${(shortcut.appName ?? '').toLowerCase()} ${(
    shortcut.description ?? ''
  ).toLowerCase()}`
  for (const clause of clauses) {
    if (clause.comboOnly ? combo.includes(clause.term) : haystack.includes(clause.term)) {
      return true
    }
  }
  return false
}

/**
 * Maps a physical `KeyboardEvent.code` to the canonical key token used by the
 * scan data. Using `code` (not `key`) captures the base key regardless of
 * Shift/Option, so e.g. ⇧⌘4 resolves to `4` + `shift` — matching how providers
 * store it. Codes absent here fall back to `normalizeKeyToken(event.key)`.
 */
const CODE_TO_TOKEN: Record<string, string> = {
  Enter: 'Return',
  NumpadEnter: 'Enter',
  Tab: 'Tab',
  Space: 'Space',
  Escape: 'Escape',
  Backspace: 'Delete',
  Delete: 'ForwardDelete',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backquote: '`',
  NumpadDivide: '/',
  NumpadMultiply: '*',
  NumpadSubtract: '-',
  NumpadAdd: '+',
  NumpadDecimal: '.'
}

/** `event.code` values that represent a modifier key pressed on its own. */
const MODIFIER_CODES = new Set([
  'MetaLeft',
  'MetaRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'ShiftLeft',
  'ShiftRight',
  'CapsLock',
  'Fn',
  'FnLock'
])

/** Resolves a physical key event to a canonical key token, or '' if unusable. */
function tokenFromCode(event: KeyboardEvent): string {
  const code = event.code
  if (MODIFIER_CODES.has(code)) return ''
  const mapped = CODE_TO_TOKEN[code]
  if (mapped) return mapped
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)
  if (/^Numpad[0-9]$/.test(code)) return code.slice(6)
  if (/^F[0-9]{1,2}$/.test(code)) return code
  return normalizeKeyToken(event.key)
}

/**
 * Folds a screen-reader combo-label fragment to its canonical modifier token.
 * Words and on-screen symbols both resolve, so 'Command', 'cmd', and '⌘' all
 * fold to 'command'.
 */
const LABEL_MODIFIERS: Record<string, Modifier> = {
  command: 'command',
  cmd: 'command',
  '⌘': 'command',
  windows: 'super',
  win: 'super',
  super: 'super',
  control: 'control',
  ctrl: 'control',
  '⌃': 'control',
  option: 'option',
  opt: 'option',
  alt: 'option',
  '⌥': 'option',
  shift: 'shift',
  '⇧': 'shift',
  function: 'function',
  fn: 'function'
}

/**
 * Folds spelled-out key names used in reader labels to the same symbol tokens
 * the chord capture emits, so pressing `/` matches a command written as 'Slash'.
 */
const LABEL_KEY_ALIASES: Record<string, string> = {
  spacebar: 'Space',
  space: 'Space',
  apostrophe: "'",
  quote: "'",
  dash: '-',
  minus: '-',
  hyphen: '-',
  equals: '=',
  equal: '=',
  plus: '+',
  slash: '/',
  backslash: '\\',
  semicolon: ';',
  comma: ',',
  period: '.',
  grave: '`',
  backtick: '`'
}

/** Canonical chord token for one whitespace-trimmed label fragment. */
function labelToken(piece: string): string {
  const lower = piece.toLowerCase()
  return LABEL_MODIFIERS[lower] ?? LABEL_KEY_ALIASES[lower] ?? normalizeKeyToken(piece)
}

/**
 * The set of canonical tokens (modifiers + base key) a shortcut's combo
 * comprises. Structured shortcuts use their key/modifier fields directly;
 * screen-reader commands — whose combo lives only in the verbatim `comboLabel`
 * with empty key/modifiers — are tokenized from that label, splitting multi-step
 * (`,`) and multi-key (`+`) separators.
 */
function comboTokenSet(shortcut: Shortcut): Set<string> {
  if (shortcut.key !== '') return new Set<string>([...shortcut.modifiers, shortcut.key])
  const tokens = new Set<string>()
  for (const step of shortcut.comboLabel.split(',')) {
    for (const piece of step.split('+')) {
      const trimmed = piece.trim()
      if (trimmed) tokens.add(labelToken(trimmed))
    }
  }
  return tokens
}

/**
 * Containment match: a shortcut matches when its combo contains every token in
 * the chord — each held modifier and, when present, the base key. So `⌘` alone
 * surfaces every command that uses Command, and `A` surfaces every command that
 * uses the A key (including the curated screen-reader entries whose combo is
 * only carried by `comboLabel`).
 */
function matchesChord(
  shortcut: Shortcut,
  chord: { key: string; modifiers: Modifier[] }
): boolean {
  const tokens = comboTokenSet(shortcut)
  for (const modifier of chord.modifiers) if (!tokens.has(modifier)) return false
  return chord.key === '' || tokens.has(chord.key)
}

function badge(source: Shortcut['source']): string {
  if (source !== 'curated') return ''
  return `<span class="help-badge" data-tip="Built-in guess" role="img" aria-label="Built-in guess"><i data-lucide="circle-help" aria-hidden="true"></i></span>`
}

/**
 * Compact display symbols for verbatim screen-reader (JAWS/NVDA) key tokens.
 * Applied to the visible button face only; `comboLabel` (which drives filtering
 * and the tooltip) keeps the full text name. `Alt` is intentionally left as-is.
 */
const READER_SYMBOLS: Record<string, string> = {
  Ctrl: '⌃',
  Shift: '⇧',
  'Caps Lock': '⇪',
  Escape: '⎋',
  Tab: '⇥',
  Delete: '⌦',
  Backspace: '⌫',
  Spacebar: '␣',
  Insert: 'Ins',
  Windows: 'Win',
  'Page Up': 'PgUp',
  'Page Down': 'PgDn',
  'Left Arrow': '←',
  'Right Arrow': '→',
  'Up Arrow': '↑',
  'Down Arrow': '↓',
  'Left Bracket': '[',
  'Right Bracket': ']',
  Apostrophe: "'",
  Comma: ',',
  Period: '.',
  Semicolon: ';',
  Dash: '-',
  Enter: '⌤',
  Slash: '/',
  Equals: '=',
  Plus: '+',
  Minus: '-',
  Backslash: '\\',
  'Num Pad Minus': 'Num Pad -',
  'Num Pad Plus': 'Num Pad +',
  'Num Pad Slash': 'Num Pad /',
  'Num Pad Star': 'Num Pad *',
  'Num Pad Delete': 'Num Pad ⌫',
  'Num Pad Enter': 'Num Pad ⌤'
}

/**
 * Matches a mapped token only as a whole token — bounded by start / ` + ` /
 * `, then ` / ` through ` on the left and end / ` + ` / `,` / ` twice` on the
 * right — so unmapped compound tokens (e.g. `Num Pad Home`) are left intact.
 * Phrases are ordered longest-first so `Num Pad Delete` wins over `Delete`.
 */
const READER_SYMBOL_RE = new RegExp(
  `(?<=^| \\+ |, then | through )(?:${Object.keys(READER_SYMBOLS)
    .sort((a, b) => b.length - a.length)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})(?=$| \\+ |,| twice)`,
  'g'
)

function symbolizeReaderLabel(label: string): string {
  return label.replace(READER_SYMBOL_RE, (m) => READER_SYMBOLS[m] ?? m).replace(/ through /g, '–')
}

/**
 * VoiceOver-scoped display symbols. VoiceOver keystrokes are stored as readable
 * text (Command, Space, "Left Arrow", …); its chip faces use the macOS glyphs
 * (⌘, ␣, ←, …) to match Apple's published shortcut notation. Kept separate from
 * READER_SYMBOLS because the Windows readers symbolize differently (e.g. Page Up
 * → "PgUp" there, but the ⇞ glyph here). Reader tokens are pre-split on " + ", so
 * an exact per-token lookup suffices.
 */
const VOICEOVER_SYMBOLS: Record<string, string> = {
  Command: '⌘',
  Space: '␣',
  Shift: '⇧',
  'Caps Lock': '⇪',
  Function: 'fn',
  Escape: '⎋',
  Return: '⏎',
  Home: '↖',
  End: '↘',
  'Page Up': '⇞',
  'Page Down': '⇟',
  Tab: '⇥',
  'Vertical Bar': '|',
  Clear: 'clear',
  'Left Arrow': '←',
  'Right Arrow': '→',
  'Up Arrow': '↑',
  'Down Arrow': '↓'
}

/** Symbolizes one already-split screen-reader key token, per reader app. */
function symbolizeReaderToken(token: string, appName: string | undefined): string {
  if (appName === 'VoiceOver') return VOICEOVER_SYMBOLS[token] ?? token
  return symbolizeReaderLabel(token)
}

/**
 * Per-app note shown at the top of a screen-reader disclosure (before the
 * shortcut list). Keyed by `appName`; apps absent from the map show no note.
 */
const READER_NOTES: Record<string, string> = {
  JAWS: 'JAWS key is Insert by default - assumes Desktop keyboard layout',
  NVDA: 'NVDA key is Insert by default - assumes Desktop keyboard layout',
  Narrator: 'Narrator key is Insert or Caps Lock by default',
  VoiceOver: 'VoiceOver key is Control + Option or Caps Lock by default'
}

const READER_MANUAL_URLS: Record<string, string> = {
  JAWS: 'https://support.freedomscientific.com/Content/Documents/Manuals/JAWS/Keystrokes.txt',
  NVDA: 'https://download.nvaccess.org/documentation/userGuide.html',
  Narrator:
    'https://support.microsoft.com/en-us/accessibility/windows/narrator/appendix-b-narrator-keyboard-commands-and-touch-gestures',
  VoiceOver: 'https://support.apple.com/en-gb/guide/voiceover/vo14111/mac'
}

// Screen-reader label for a row's button: "{combo}. {description}. {badge}."
// Mirrors the visible face — the spelled-out combo (the combo's `data-tip`), the
// description, and, when present, the help badge's "Built-in guess" text.
function rowButtonLabel(
  comboText: string,
  description: string | undefined,
  enabled: boolean,
  hasBadge: boolean
): string {
  const desc = description && description.length > 0 ? description : '\u2014'
  const parts = [comboText, enabled === false ? `${desc} (disabled)` : desc]
  if (hasBadge) parts.push('Built-in guess')
  return `${parts.join('. ')}.`
}

// Wraps a row's face in one button so a screen reader exposes a single named,
// activatable control per row. The wrapper re-exposes the row's subgrid columns
// (see `.row-button` in styles.css), so it stays keyboard-focusable while the
// combo, desc, and badge keep their columns and the visual design is unchanged.
function rowButton(inner: string, ariaLabel: string): string {
  return `<div class="row-button" role="button" tabindex="0" aria-label="${escapeHtml(
    ariaLabel
  )}">${inner}</div>`
}

function renderRow(shortcut: Shortcut, platform: Platform): string {
  const disabled = shortcut.enabled === false ? ' <span class="off">(disabled)</span>' : ''
  const desc = shortcut.description ? escapeHtml(shortcut.description) : '<span class="dim">—</span>'
  // Payload copied when the row is activated with Control held: the combo with
  // each key wrapped in a `<kbd>` element. Escaped for the attribute; reading it
  // back via `dataset.comboKbd` yields the literal "<kbd>…</kbd>" markup.
  const kbdCombo = escapeHtml(comboKbdHtml(shortcut, platform))
  // Payload for Shift-activation: the on-screen combo wrapped in `<kbd>`.
  const visualCombo = escapeHtml(comboVisualKbdHtml(shortcut, platform))

  // Keystroke-only entries (screen-reader commands) carry a verbatim label in
  // `comboLabel` and have no key/modifier tokens to format per platform.
  if (!shortcut.key) {
    const label = escapeHtml(shortcut.comboLabel)
    if (shortcut.segment === 'screen-reader') {
      // Each key token becomes its own chip: split the label into ", then" steps
      // and each step into " + " tokens, rendering "+", ", then", and
      // ", twice quickly" as plain connective text between/after chips. The whole
      // chip group is wrapped in one `.kbd-seq` that carries the full-text tooltip,
      // so hovering anywhere over the combo (chips or connective text) shows it;
      // the row's data-combo retains the whole label so filtering still matches.
      const steps = shortcut.comboLabel.split(', then ')
      const body = steps
        .map((step) => {
          // "twice quickly" (press the chord twice) is connective text, never a
          // chip: pull it out and give it the same styling as ", then".
          let core = step
          let twice = ''
          if (/(?: \+ | )twice quickly$/.test(core)) {
            core = core.replace(/(?: \+ | )twice quickly$/, '')
            twice = '<span class="seq-sep">, twice quickly</span>'
          }
          return (
            core
              .split(' + ')
              .filter((token) => token.length > 0)
              .map(
                (token) =>
                  `<kbd class="kbd-text">${escapeHtml(
                    symbolizeReaderToken(token, shortcut.appName)
                  )}</kbd>`
              )
              .join('<span class="kbd-plus">&emsp14;+&emsp14;</span>') + twice
          )
        })
        .join('<span class="seq-sep">, then</span>')
      const wrapped = `<div class="kbd-seq" data-tip="${label}">${body}</div>`
      const inner = `${wrapped}
      <span class="desc">${desc}${disabled}</span>`
      return `
    <li class="row" data-combo="${label}" data-combo-kbd="${kbdCombo}" data-combo-visual="${visualCombo}">
      ${rowButton(
        inner,
        rowButtonLabel(shortcut.comboLabel, shortcut.description, shortcut.enabled, false)
      )}
    </li>
  `
    }
    const badgeHtml = badge(shortcut.source)
    const inner = `<kbd class="kbd-text" data-tip="${label}">${label}</kbd>
      <span class="desc">${desc}${disabled}</span>
      ${badgeHtml}`
    return `
    <li class="row" data-combo="${label}" data-combo-kbd="${kbdCombo}" data-combo-visual="${visualCombo}">
      ${rowButton(
        inner,
        rowButtonLabel(shortcut.comboLabel, shortcut.description, shortcut.enabled, badgeHtml !== '')
      )}
    </li>
  `
  }

  const fullRaw = fullComboName(shortcut, platform)
  const fullName = escapeHtml(fullRaw)
  const tokens = comboTokens(shortcut.key, shortcut.modifiers, platform)
  // Break the combo into one chip per key, matching the screen-reader treatment:
  // each token its own `<kbd>`, joined by a four-per-em-spaced "+", all under one
  // `.kbd-seq` wrapper that carries the human-readable tooltip.
  const chips = tokens
    .map((t) => `<kbd class="kbd-text">${escapeHtml(t)}</kbd>`)
    .join('<span class="kbd-plus">&emsp14;+&emsp14;</span>')
  const combo = `<div class="kbd-seq" data-tip="${fullName}">${chips}</div>`
  const badgeHtml = shortcut.segment === 'screen-reader' ? '' : badge(shortcut.source)
  const inner = `${combo}
      <span class="desc">${desc}${disabled}</span>
      ${badgeHtml}`
  return `
    <li class="row" data-combo="${escapeHtml(shortcut.comboLabel)}" data-combo-kbd="${kbdCombo}" data-combo-visual="${visualCombo}">
      ${rowButton(
        inner,
        rowButtonLabel(fullRaw, shortcut.description, shortcut.enabled, badgeHtml !== '')
      )}
    </li>
  `
}

function renderAppGroup(appName: string, rows: Shortcut[], platform: Platform): string {
  const items = rows.map((row) => renderRow(row, platform)).join('')
  return `
    <div class="app-group">
      <div class="app-name">${escapeHtml(appName)}</div>
      <ul class="rows">${items}</ul>
    </div>
  `
}

/**
 * Whether a filter (search text or a captured chord) is narrowing the results.
 * While filtering, sections are force-expanded so their matching rows are visible
 * even when the user had collapsed them; clearing the filter restores each
 * section's prior collapsed/expanded state.
 */
function isFiltering(): boolean {
  return searchInput.value.trim().length > 0 || activeChord !== null
}

/**
 * Groups shortcuts by their owning app name (missing names fall back to
 * "Unknown") and returns the entries sorted by app name. Shared by the
 * single-section and per-app segment renderers.
 */
function groupByApp(shortcuts: Shortcut[]): [string, Shortcut[]][] {
  const byApp = new Map<string, Shortcut[]>()
  for (const sc of shortcuts) {
    const key = sc.appName ?? 'Unknown'
    const list = byApp.get(key)
    if (list) list.push(sc)
    else byApp.set(key, [sc])
  }
  return [...byApp.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

/**
 * Renders the sticky disclosure header shared by every segment/app section: the
 * caret, the title, a visually hidden result count, and the visible count badge.
 */
function segmentHead(title: string, count: number): string {
  return `
      <summary class="segment-head">
        <span class="caret" aria-hidden="true"></span>
        <h3>${escapeHtml(title)}</h3>
        <span class="hide-visually">${count} results</span>
        <span class="count" aria-hidden="true">${count}</span>
      </summary>`
}

function renderSegment(
  segment: ShortcutSegment,
  shortcuts: Shortcut[],
  platform: Platform
): string {
  if (shortcuts.length === 0) return ''

  const groups = groupByApp(shortcuts)
    .map(([appName, rows]) => renderAppGroup(appName, rows, platform))
    .join('')

  const open = collapsedSegments.has(segment) && !isFiltering() ? '' : ' open'

  return `
    <details class="segment" data-segment="${segment}"${open}>
      ${segmentHead(SEGMENT_LABELS[segment], shortcuts.length)}
      ${groups}
    </details>
  `
}

/**
 * Renders each app's shortcuts as its own top-level disclosure (app name as the
 * heading) instead of grouping every app under a single section. Used by the
 * focused-menu and screen-reader segments. The rounded, inset `ul.rows` body is
 * preserved. `segment` scopes the per-app collapse keys.
 */
function renderAppSections(
  shortcuts: Shortcut[],
  platform: Platform,
  segment: ShortcutSegment
): string {
  if (shortcuts.length === 0) return ''

  return groupByApp(shortcuts)
    .map(([appName, rows]) => renderAppSection(appName, rows, platform, segment))
    .join('')
}

function renderAppSection(
  appName: string,
  rows: Shortcut[],
  platform: Platform,
  segment: ShortcutSegment
): string {
  const key = `${segment}:${appName}`
  const open = collapsedSegments.has(key) && !isFiltering() ? '' : ' open'
  const items = rows.map((row) => renderRow(row, platform)).join('')
  const manualUrl =
    segment === 'screen-reader' ? READER_MANUAL_URLS[appName] : undefined
  const manualLabel = manualUrl
    ? `<a class="manual-link" href="${escapeHtml(manualUrl)}">the manual</a>`
    : 'the manual'
  const guessNote =
    segment === 'screen-reader'
      ? `<p class="guess-note">Keyboard shortcuts sourced from ${manualLabel}</p>`
      : ''
  const readerNoteText =
    segment === 'screen-reader' ? READER_NOTES[appName] : undefined
  const readerNote = readerNoteText
    ? `<p class="reader-note">${escapeHtml(readerNoteText)}</p>`
    : ''

  return `
    <details class="segment" data-segment="${escapeHtml(key)}"${open}>
      ${segmentHead(appName, rows.length)}
      <div class="app-group">
        ${readerNote}
        <ul class="rows">${items}</ul>
        ${guessNote}
      </div>
    </details>
  `
}

function renderBanner(permission: PermissionStatus): void {
  if (permission.accessibility === 'denied') {
    bannerEl.innerHTML = `
      <div class="banner banner-warn">
        <div class="banner-body">
          <i data-lucide="triangle-alert" class="banner-icon" aria-hidden="true"></i>
          <div>
            <strong>Accessibility access needed</strong>
            <div class="banner-detail">${escapeHtml(permission.details ?? 'Grant access to read app menu shortcuts.')}</div>
          </div>
        </div>
        <button class="secondary" id="grant"><i data-lucide="shield-check" aria-hidden="true"></i>Grant access</button>
      </div>
    `
    renderIcons(bannerEl)
    const grant = document.getElementById('grant') as HTMLButtonElement
    grant.addEventListener('click', async () => {
      await window.shortcutApi.requestPermission()
    })
    return
  }
  bannerEl.innerHTML = ''
}

function emptyFilterMessage(query: string): string {
  const chordLabel = activeChord ? escapeHtml(committedChordDisplay()) : ''
  const queryLabel = query ? `\u201c${escapeHtml(query)}\u201d` : ''
  if (queryLabel && chordLabel) {
    return `No shortcuts match ${queryLabel} and ${chordLabel}`
  }
  if (chordLabel) return `No shortcuts match ${chordLabel}`
  return `No shortcuts match ${queryLabel}`
}

function visibleShortcuts(): Shortcut[] {
  const base = lastResult ? lastResult.shortcuts : readerShortcuts
  const query = searchInput.value.trim().toLowerCase()
  const clauses = queryClauses(query)
  return base.filter(
    (sc) => matchesQuery(sc, clauses) && (!activeChord || matchesChord(sc, activeChord))
  )
}

/** Shared label for a result count, used for both the visible badge and the
 *  live-region announcement so the spoken text can never diverge from the UI. */
function resultsLabel(count: number): string {
  return `${count} results`
}

// Debounced polite announcement of the current result count while the user is
// filtering. One shared timer across both filter inputs (#search and #chord);
// each schedule resets it, so rapid typing / chord-building coalesce into a
// single announcement. The count is (re)read when the timer fires, and the
// announcement is suppressed unless a filter is still active, so clearing or
// emptying either field stays silent.
let filterAnnounceTimer: ReturnType<typeof setTimeout> | undefined
const FILTER_ANNOUNCE_DEBOUNCE_MS = 300

function scheduleFilterAnnouncement(): void {
  if (filterAnnounceTimer !== undefined) clearTimeout(filterAnnounceTimer)
  filterAnnounceTimer = setTimeout(() => {
    filterAnnounceTimer = undefined
    if (!isFiltering()) return
    announce(resultsLabel(visibleShortcuts().length))
  }, FILTER_ANNOUNCE_DEBOUNCE_MS)
}

// Paced queue that mirrors the visual `#status` text as polite announcements
// during a scan. The status line is rewritten many times per scan; setting the
// live region that fast collapses every message but the last into a single
// announcement. Flushing one queued message at a time — the head immediately,
// each subsequent one after a fixed gap — makes each a distinct live-region
// mutation, so a screen reader reads them in sequence (trailing the visuals).
const STATUS_ANNOUNCE_INTERVAL_MS = 1000
const statusAnnounceQueue: string[] = []
let statusAnnounceTimer: ReturnType<typeof setTimeout> | undefined
// Guards the single per-scan progress announcement: only the first progress
// event is spoken; later ones (further apps, system, curated, aggregating)
// update the visual only.
let statusProgressAnnounced = false

function flushStatusAnnouncements(): void {
  const next = statusAnnounceQueue.shift()
  if (next === undefined) {
    statusAnnounceTimer = undefined
    return
  }
  announce(next)
  statusAnnounceTimer = setTimeout(flushStatusAnnouncements, STATUS_ANNOUNCE_INTERVAL_MS)
}

function enqueueStatusAnnouncement(message: string): void {
  if (!message) return
  statusAnnounceQueue.push(message)
  if (statusAnnounceTimer === undefined) flushStatusAnnouncements()
}

function resetStatusAnnouncements(): void {
  if (statusAnnounceTimer !== undefined) clearTimeout(statusAnnounceTimer)
  statusAnnounceTimer = undefined
  statusAnnounceQueue.length = 0
}

// Polite "still working" heartbeat during a scan. Fires the literal `Scanning`
// at +5s and every 5s after, until results return. Additive to the status
// announcements above; the live region appends a trailing space on repeats, so
// re-announcing the identical string still re-reads each tick.
const SCANNING_HEARTBEAT_MS = 5000
let scanningHeartbeatTimer: ReturnType<typeof setInterval> | undefined

function startScanningHeartbeat(): void {
  if (scanningHeartbeatTimer !== undefined) clearInterval(scanningHeartbeatTimer)
  scanningHeartbeatTimer = setInterval(() => announce('Scanning'), SCANNING_HEARTBEAT_MS)
}

function stopScanningHeartbeat(): void {
  if (scanningHeartbeatTimer !== undefined) clearInterval(scanningHeartbeatTimer)
  scanningHeartbeatTimer = undefined
}

function renderResult(): void {
  chordBar.hidden = false
  hideTip()
  const query = searchInput.value.trim().toLowerCase()
  const platform = lastResult?.platform ?? readerPlatform
  const base = lastResult ? lastResult.shortcuts : readerShortcuts
  const visible = visibleShortcuts()
  updateExportState()
  content.classList.remove('is-empty')
  searchCount.textContent = resultsLabel(visible.length)
  searchCount.hidden = query.length === 0 || visible.length === 0

  if (lastResult) renderBanner(lastResult.permission)

  if (base.length === 0) {
    content.innerHTML = `${CONTENT_HEADING}<div class="empty-state"><div>No reserved shortcuts found.</div></div>`
    return
  }
  if (visible.length === 0) {
    content.innerHTML = `${CONTENT_HEADING}<div class="empty-state"><div>${emptyFilterMessage(query)}</div></div>`
    return
  }

  const sections = SEGMENT_ORDER.map((segment) => {
    const scoped = visible.filter((sc) => sc.segment === segment)
    return segment === 'focused-menu' || segment === 'screen-reader'
      ? renderAppSections(scoped, platform, segment)
      : renderSegment(segment, scoped, platform)
  }).join('')

  const gapsHtml = lastResult ? renderCoverageGaps(lastResult.coverageGaps) : ''

  const preScan = !lastResult
  content.classList.toggle('is-empty', preScan)
  content.innerHTML = preScan
    ? `${CONTENT_HEADING}${sections}<div class="scan-note"><i data-lucide="info" aria-hidden="true"></i><p class="scan-note-text">What Can't I Press cannot detect all possible keyboard shortcuts. Be sure to also check manually.</p></div>`
    : `${CONTENT_HEADING}${sections}${gapsHtml}`
  renderIcons(content)
  wireSectionJumps(content)
}

/**
 * Renders the coverage-gap section: a distinct disclosure listing markers for
 * apps whose shortcuts cannot be fully enumerated (e.g. runtime hotkeys), so the
 * list never implies it is exhaustive. Not a shortcut section — excluded from
 * counts, filters, and the jump links. Honors the shared collapse state.
 */
function renderCoverageGaps(gaps: CoverageGap[]): string {
  if (!gaps || gaps.length === 0) return ''
  const open = collapsedSegments.has('coverage-gap') && !isFiltering() ? '' : ' open'
  const rows = gaps
    .map(
      (gap) => `
      <li class="gap-row">
        <span class="gap-app">${escapeHtml(gap.appName)}</span>
        <span class="gap-detail">${escapeHtml(gap.detail)}</span>
      </li>`
    )
    .join('')

  return `
    <details class="segment coverage-gap" data-segment="coverage-gap"${open}>
      <summary class="segment-head">
        <span class="caret" aria-hidden="true"></span>
        <h3>Coverage gaps</h3>
        <span class="hide-visually">${gaps.length} results</span>
        <span class="count" aria-hidden="true">${gaps.length}</span>
      </summary>
      <div class="app-group">
        <p class="gap-note"><i data-lucide="info" aria-hidden="true"></i>These apps reserve shortcuts that no menu or accessibility API can enumerate, so this list is not exhaustive.</p>
        <ul class="gap-rows">${rows}</ul>
      </div>
    </details>
  `
}

/**
 * Adds section-divider jump links. Every rendered `<details.segment>` except the
 * last gets a "Jump to next section" link (to the next divider in document order);
 * the last divider gets a "Jump to first section" link back to the first divider
 * (skipped when there is only one section). Each `<details>` is moved into a
 * `.segment-wrap` (used by the launch/empty state to flex the disclosures); the anchor
 * lives in an overlay placed as the `<summary>`'s next sibling *inside* the `<details>`
 * — never inside the interactive `<summary>` itself (avoids nesting interactive
 * controls). This makes the focus order summary -> jump link -> section content (e.g.
 * the manual link), matching the visual top-to-bottom order. The overlay is sticky and
 * pulled up to overlay the sticky header, so it stays pinned with the separator while
 * the section scrolls; it is hidden by CSS while its section is collapsed. Built
 * post-render so links always target the currently-visible sections. A hidden clone of
 * the badge reserves its width so the link sits immediately before the count.
 */
function wireSectionJumps(root: HTMLElement): void {
  const sections = Array.from(
    root.querySelectorAll<HTMLDetailsElement>(':scope > details.segment:not(.coverage-gap)')
  )

  sections.forEach((section) => {
    const wrap = document.createElement('div')
    wrap.className = 'segment-wrap'
    section.replaceWith(wrap)
    wrap.append(section)
  })

  sections.forEach((section, i) => {
    section.id = `section-${i}`
  })

  // Builds the overlay jump row for `current`: a link to `target` sitting just
  // before current's count badge (a hidden badge clone reserves the width).
  const buildJumpRow = (
    current: HTMLDetailsElement,
    target: HTMLDetailsElement,
    label: string
  ): HTMLDivElement => {
    const countText = current.querySelector('.segment-head > .count')?.textContent ?? ''
    const targetTitle = target.querySelector('.segment-head h3')?.textContent ?? ''

    const row = document.createElement('div')
    row.className = 'jump-row'

    const link = document.createElement('a')
    link.className = 'jump-next'
    link.href = `#${target.id}`
    link.append(label)
    if (targetTitle) {
      const suffix = document.createElement('span')
      suffix.className = 'hide-visually'
      suffix.textContent = `: ${targetTitle}`
      link.append(suffix)
    }
    link.addEventListener('click', (event) => {
      event.preventDefault()
      // Instant jump (no smooth animation), top-aligned. preventScroll keeps the
      // follow-up focus() from nudging the freshly-aligned target.
      target.scrollIntoView({ block: 'start' })
      target.querySelector<HTMLElement>('summary')?.focus({ preventScroll: true })
    })

    const spacer = document.createElement('span')
    spacer.className = 'count count-spacer'
    spacer.setAttribute('aria-hidden', 'true')
    spacer.textContent = countText

    row.append(link, spacer)
    return row
  }

  // Place each overlay as the summary's next sibling *inside* the <details> so the
  // focus order is summary -> jump link -> section content (e.g. the manual link).
  // The overlay is a sticky row pulled up over the sticky header, so it stays pinned
  // with the separator while the section scrolls; CSS hides it while collapsed.
  const placeRow = (section: HTMLDetailsElement, jumpRow: HTMLDivElement): void => {
    const summary = section.querySelector(':scope > summary')
    if (summary) summary.after(jumpRow)
    else section.prepend(jumpRow)
  }

  for (let i = 0; i < sections.length - 1; i++) {
    placeRow(sections[i], buildJumpRow(sections[i], sections[i + 1], 'Jump to next section'))
  }

  // The last divider links back up to the first currently-visible section. Skipped
  // when there is only one section (it would link to itself).
  if (sections.length > 1) {
    const last = sections.length - 1
    placeRow(sections[last], buildJumpRow(sections[last], sections[0], 'Jump to first section'))
  }
}

function showTip(target: HTMLElement): void {
  const text = target.dataset.tip
  if (!text) return
  tipTarget = target
  tip.textContent = text
  tip.hidden = false
  const anchor = target.getBoundingClientRect()
  const box = tip.getBoundingClientRect()
  let left = anchor.left + anchor.width / 2 - box.width / 2
  left = Math.max(6, Math.min(left, window.innerWidth - box.width - 6))
  let top = anchor.top - box.height - 4
  if (top < 6) top = anchor.bottom + 4
  tip.style.left = `${left}px`
  tip.style.top = `${top}px`
  tip.classList.add('show')
}

function hideTip(): void {
  if (!tipTarget) return
  tipTarget = null
  tip.classList.remove('show')
  tip.hidden = true
}

async function runScan(scanAllApps: boolean): Promise<void> {
  if (scanning) return
  setScanning(true)
  statusEl.textContent = 'Starting\u2026'
  resetStatusAnnouncements()
  statusProgressAnnounced = false
  enqueueStatusAnnouncement(statusEl.textContent ?? '')
  startScanningHeartbeat()
  try {
    lastResult = await window.shortcutApi.scan({ scanAllApps })
    if (seededReaderCollapse) {
      for (const name of READER_APP_NAMES) collapsedSegments.delete(`screen-reader:${name}`)
      seededReaderCollapse = false
    }
    renderResult()
  } finally {
    stopScanningHeartbeat()
    setScanning(false)
    if (lastResult) {
      const count = lastResult.appsScanned
      const appLabel = count === 1 ? 'app' : 'apps'
      statusEl.textContent = `${lastResult.shortcuts.length} shortcuts \u00b7 ${count} ${appLabel}`
      enqueueStatusAnnouncement(statusEl.textContent ?? '')
    } else {
      statusEl.textContent = ''
    }
  }
}

window.shortcutApi.onScanProgress((progress) => {
  if (progress.phase === 'apps' && progress.total) {
    statusEl.textContent = `Reading ${progress.appName ?? 'app'} (${progress.current}/${progress.total})\u2026`
  } else if (progress.phase === 'os') {
    statusEl.textContent = 'Reading system shortcuts\u2026'
  } else if (progress.phase === 'curated') {
    statusEl.textContent = 'Matching known apps\u2026'
  } else if (progress.phase === 'aggregating') {
    statusEl.textContent = 'Aggregating\u2026'
  }
  if (scanning && !statusProgressAnnounced) {
    statusProgressAnnounced = true
    enqueueStatusAnnouncement(statusEl.textContent ?? '')
  }
})

scanButton.addEventListener('click', () => void runScan(false))
scanAllButton.addEventListener('click', () => void runScan(true))
quitButton.addEventListener('click', () => void window.shortcutApi.quit())

let pinned = false
async function togglePin(): Promise<void> {
  pinned = await window.shortcutApi.setAlwaysOnTop(!pinned)
  pinButton.setAttribute('aria-pressed', String(pinned))
}
pinButton.addEventListener('click', () => void togglePin())

// Exports the currently visible shortcuts. After a scan that is the scan result;
// in the empty state (no scan yet) it is the curated screen-reader content (JAWS,
// NVDA, Narrator, VoiceOver), wrapped in a matching envelope so the file shape is
// consistent either way.
function doExport(): void {
  if (exportButton.getAttribute('aria-disabled') === 'true') return
  const shortcuts = visibleShortcuts()
  if (shortcuts.length === 0) return
  const payload = lastResult
    ? { ...lastResult, shortcuts }
    : {
        generatedAt: Date.now(),
        platform: readerPlatform,
        permission: { accessibility: 'not-required' },
        shortcuts,
        appsScanned: 0,
        coverageGaps: []
      }
  void window.shortcutApi.exportJson(
    JSON.stringify(payload, null, 2),
    `${payload.generatedAt}.json`
  )
}
exportButton.addEventListener('click', doExport)

// Tray context-menu commands run the same actions as the in-window controls, so
// all scan/export/pin logic and state stay owned by the renderer.
window.shortcutApi.onMenuCommand((command) => {
  if (command === 'scan-frontmost') void runScan(false)
  else if (command === 'scan-all') void runScan(true)
  else if (command === 'export') doExport()
  else if (command === 'toggle-pin') void togglePin()
})

// Bulk-toggle every rendered disclosure section, driven by their saved collapse
// intent (`collapsedSegments`), not the filter-forced `open` state. Blunt two-way:
//   all expanded -> collapse all
//   otherwise    -> expand all
expandButton.addEventListener('click', () => {
  const keys = [...content.querySelectorAll<HTMLElement>('details.segment')]
    .map((el) => el.dataset.segment)
    .filter((key): key is string => Boolean(key))
  if (keys.length === 0) return

  const allExpanded = keys.every((key) => !collapsedSegments.has(key))

  if (allExpanded) {
    for (const key of keys) collapsedSegments.add(key)
  } else {
    collapsedSegments.clear()
  }
  renderResult()
})
function syncClearButton(): void {
  clearButton.hidden = searchInput.value.length === 0
}

searchInput.addEventListener('input', () => {
  syncClearButton()
  renderResult()
  scheduleFilterAnnouncement()
})

clearButton.addEventListener('click', () => {
  searchInput.value = ''
  syncClearButton()
  renderResult()
  searchInput.focus()
})

function syncChordClear(): void {
  chordClear.hidden = activeChord === null
}

/** Canonical modifiers currently active on a keyboard event. */
function eventModifiers(event: KeyboardEvent): Modifier[] {
  const mods: Modifier[] = []
  if (event.metaKey) mods.push('command')
  if (event.ctrlKey) mods.push('control')
  if (event.altKey) mods.push('option')
  if (event.shiftKey) mods.push('shift')
  if (fnHeld || event.getModifierState('Fn')) mods.push('function')
  return canonicalizeModifiers(mods)
}

// Canonical tokens of the non-modifier keys currently held down (code -> token),
// so the field can list characters live as they are pressed and held.
const heldKeys = new Map<string, string>()

function chordPlatform(): Platform {
  return lastResult?.platform ?? 'darwin'
}

/** Display string for the live set of held modifiers + non-modifier keys. */
function heldDisplay(mods: Modifier[]): string {
  const platform = chordPlatform()
  const modParts = comboTokens('', mods, platform).slice(0, -1)
  const keyParts = [...heldKeys.values()].map((k) => comboTokens(k, [], platform)[0])
  const parts = [...modParts, ...keyParts]
  return platform === 'darwin' ? parts.join('') : parts.join('+')
}

/**
 * Label for the committed chord. A modifier-only chord drops the empty base-key
 * token so it renders as just the modifier symbols (no trailing separator).
 */
function committedChordDisplay(): string {
  if (!activeChord) return ''
  const platform = chordPlatform()
  if (activeChord.key === '') {
    const parts = comboTokens('', activeChord.modifiers, platform).slice(0, -1)
    return platform === 'darwin' ? parts.join('') : parts.join('+')
  }
  return formatCombo(activeChord.key, activeChord.modifiers, platform)
}

/**
 * Shows the live held keys while anything is pressed; once everything is
 * released, reverts to the committed chord label (or empty).
 */
function refreshChordField(mods: Modifier[]): void {
  if (mods.length > 0 || heldKeys.size > 0) {
    chordInput.value = heldDisplay(mods)
  } else {
    chordInput.value = committedChordDisplay()
  }
}

/**
 * Commits the chord from the current held state (most-recent non-modifier key +
 * the modifiers held right now). Only grows/updates on keydown, never on
 * release, so the committed chord persists after all keys are let go.
 */
function commitFromHeld(mods: Modifier[]): void {
  if (heldKeys.size > 0) {
    const keys = [...heldKeys.values()]
    activeChord = { key: keys[keys.length - 1], modifiers: mods }
  } else if (mods.length > 0) {
    // Modifier-only gesture (e.g. ⌘, ⇧⌘): filter by the held modifier set alone.
    activeChord = { key: '', modifiers: mods }
  } else {
    return
  }
  syncChordClear()
  renderResult()
  scheduleFilterAnnouncement()
}

/**
 * Visible, enabled focusable elements in document order. Backs the double-Escape
 * exit from the chord field, which captures Tab and would otherwise trap focus.
 */
function focusableElements(): HTMLElement[] {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return [...document.querySelectorAll<HTMLElement>(selector)].filter(
    (el) => el.tabIndex !== -1 && el.getClientRects().length > 0
  )
}

/** Moves focus to the next focusable element after `current`, wrapping to first. */
function focusNextFrom(current: HTMLElement): void {
  const items = focusableElements()
  const index = items.indexOf(current)
  if (index === -1) return
  ;(items[index + 1] ?? items[0])?.focus()
}

chordInput.addEventListener(
  'keydown',
  (event) => {
    event.preventDefault()

    // The field captures Tab to build chords, trapping focus. A second
    // consecutive Escape releases focus to the next control; the first still
    // commits an Escape (⎋) chord. Any other key resets the count.
    const isEscape = event.key === 'Escape' || event.code === 'Escape'
    if (!event.repeat) {
      if (isEscape) {
        chordEscapePresses += 1
        if (chordEscapePresses >= 2) {
          chordEscapePresses = 0
          focusNextFrom(chordInput)
          return
        }
      } else {
        chordEscapePresses = 0
      }
    }

    const isFn = event.code === 'Fn' || event.key === 'Fn'
    if (isFn) fnHeld = true
    const mods = eventModifiers(event)
    // Ignore auto-repeat: a held key repeats without its modifiers once they are
    // released, which would otherwise clobber the committed chord.
    if (event.repeat) {
      refreshChordField(mods)
      return
    }
    // Fn is a modifier, not a base key; keep it out of heldKeys so it never
    // becomes the committed chord's key (its own code is unmapped anyway).
    const token = isFn ? '' : tokenFromCode(event)
    if (token && !MODIFIERS.includes(token as Modifier)) {
      heldKeys.set(event.code, token)
    }
    commitFromHeld(mods)
    refreshChordField(mods)
  },
  true
)

chordInput.addEventListener(
  'keyup',
  (event) => {
    if (event.code === 'Fn' || event.key === 'Fn') fnHeld = false
    heldKeys.delete(event.code)
    const mods = eventModifiers(event)
    // macOS suppresses non-modifier keyups while Command is held, so the key's
    // own keyup can be lost entirely. Once no modifiers remain held, treat the
    // gesture as finished and drop any stuck held keys so the field falls back
    // to the committed chord (e.g. keeps "⌘A" instead of a leftover "A").
    if (mods.length === 0) heldKeys.clear()
    refreshChordField(mods)
  },
  true
)

chordInput.addEventListener('blur', () => {
  fnHeld = false
  heldKeys.clear()
  chordEscapePresses = 0
  refreshChordField([])
})

chordClear.addEventListener('click', () => {
  activeChord = null
  fnHeld = false
  heldKeys.clear()
  chordInput.value = ''
  syncChordClear()
  renderResult()
  chordInput.focus()
})

// Persist only user-initiated disclosure toggles. Listening for summary clicks
// (keyboard Enter/Space activation dispatches one too) avoids the `toggle` event,
// which Chromium also fires when a re-render inserts a `<details open>` — that
// would otherwise let filter-driven auto-expansion overwrite the user's saved
// collapse state. The microtask reads `open` after the default toggle applies.
content.addEventListener('click', (event) => {
  const summary = (event.target as HTMLElement).closest('summary')
  const details = summary?.parentElement
  if (!(details instanceof HTMLDetailsElement)) return
  const segment = details.dataset.segment
  if (!segment) return
  queueMicrotask(() => {
    if (details.open) collapsedSegments.delete(segment)
    else collapsedSegments.add(segment)
  })
})

content.addEventListener('scroll', hideTip)

document.addEventListener('mouseover', (event) => {
  const target = (event.target as HTMLElement).closest('[data-tip]') as HTMLElement | null
  if (target && target !== tipTarget) showTip(target)
})

document.addEventListener('mouseout', (event) => {
  const target = (event.target as HTMLElement).closest('[data-tip]') as HTMLElement | null
  if (!target) return
  const related = event.relatedTarget as Node | null
  if (!related || !target.contains(related)) hideTip()
})

let pressedRow: HTMLElement | null = null
let pressTimer: number | undefined
const PRESS_EFFECT_MS = 120

// Copy the row's combo to the clipboard, announce it, and play the momentary
// press effect. Shared by pointer clicks and keyboard activation of the row's
// button (a role="button" div does not emit a click on Enter/Space by itself).
// The modifier held during activation selects the payload: Control copies the
// spelled-out combo wrapped in `<kbd>`, Shift copies the on-screen combo wrapped
// in `<kbd>`, and no modifier copies the plain-text combo.
type CopyMode = 'plain' | 'kbd' | 'visual'

function copyModeFor(event: { ctrlKey: boolean; shiftKey: boolean }): CopyMode {
  if (event.ctrlKey) return 'kbd'
  if (event.shiftKey) return 'visual'
  return 'plain'
}

function activateRow(row: HTMLElement, mode: CopyMode = 'plain'): void {
  const combo =
    mode === 'kbd'
      ? row.dataset.comboKbd
      : mode === 'visual'
        ? row.dataset.comboVisual
        : row.dataset.combo
  if (!combo) return
  hideTip()
  void navigator.clipboard.writeText(combo)
  announce(mode === 'plain' ? 'Shortcut copied to clipboard.' : 'Shortcut copied to clipboard as kbd HTML.')

  // Momentary keypress effect: nudge the chips + connectives down 1px.
  if (pressTimer) window.clearTimeout(pressTimer)
  if (pressedRow && pressedRow !== row) pressedRow.classList.remove('pressed')
  pressedRow = row
  row.classList.add('pressed')
  pressTimer = window.setTimeout(() => {
    row.classList.remove('pressed')
    pressedRow = null
    pressTimer = undefined
  }, PRESS_EFFECT_MS)
}

content.addEventListener('click', (event) => {
  const row = (event.target as HTMLElement).closest('.row') as HTMLElement | null
  if (row) activateRow(row, copyModeFor(event))
})

// macOS delivers a Control-click as a secondary click (a `contextmenu` event, no
// `click`), so copy the kbd variant from here too. Gated on `ctrlKey` so a plain
// right-click is left to its default behavior. Shift-click is an ordinary click
// on every platform, so it is handled by the `click` listener above.
content.addEventListener('contextmenu', (event) => {
  if (!event.ctrlKey) return
  const row = (event.target as HTMLElement).closest('.row') as HTMLElement | null
  if (!row) return
  event.preventDefault()
  activateRow(row, 'kbd')
})

content.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return
  const button = (event.target as HTMLElement).closest('.row-button')
  const row = button?.closest('.row') as HTMLElement | null
  if (!row) return
  event.preventDefault()
  activateRow(row, copyModeFor(event))
})

// Open the manual link in the OS browser instead of navigating the popover.
content.addEventListener('click', (event) => {
  const link = (event.target as HTMLElement).closest('a.manual-link')
  if (!link) return
  event.preventDefault()
  const url = link.getAttribute('href')
  if (url) void window.shortcutApi.openExternal(url)
})

// Focus the primary action on load and each time the popover regains focus,
// so opening the menu-bar window always lands on "Scan last focused app".
window.addEventListener('focus', () => scanButton.focus())
scanButton.focus()

// Always show the screen-reader sections, even before a scan. Seed them
// collapsed so the launch (empty) state renders them closed; the first scan
// clears the seed, restoring the default-open behavior for scan results.
async function initReaderSections(): Promise<void> {
  for (const name of READER_APP_NAMES) collapsedSegments.add(`screen-reader:${name}`)
  seededReaderCollapse = true
  try {
    const reader = await window.shortcutApi.getReaderShortcuts()
    readerPlatform = reader.platform
    readerShortcuts = reader.shortcuts
  } catch {
    readerShortcuts = []
  }
  if (!lastResult) renderResult()
}
void initReaderSections()
initEasterEgg()

// Track input modality so focus rings appear only during keyboard navigation.
// Character/Space/Enter typing is excluded so clicking then typing never rings.
const NAV_KEYS = new Set([
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown'
])

function setInputModality(mode: 'keyboard' | 'pointer'): void {
  document.documentElement.setAttribute('data-input', mode)
}

window.addEventListener(
  'keydown',
  (event) => {
    if (!NAV_KEYS.has(event.key)) return
    // The chord filter input consumes arrow/Home/End/Page keys as filter chords,
    // not as navigation, so treat them as typing there. Only Tab — which moves
    // focus into or out of the field — should reveal its focus ring.
    if (event.target === chordInput && event.key !== 'Tab') return
    setInputModality('keyboard')
  },
  true
)
window.addEventListener('pointerdown', () => setInputModality('pointer'), true)
window.addEventListener('mousedown', () => setInputModality('pointer'), true)

// F6 / Shift+F6 landmark navigation. Moves focus cyclically across the visible
// `[data-f6]` regions (header, toolbar, main, chord bar, footer). The chord bar is
// skipped while hidden. Disabled while the chord filter input holds focus so F6
// there is captured as a filter chord instead of navigating.
function f6Targets(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-f6]')].filter(
    (el) => el.getClientRects().length > 0
  )
}

/**
 * Next landmark index when cycling. `current === -1` (focus outside every
 * landmark) resolves to the first when going forward, the last when backward.
 */
function stepF6Index(length: number, current: number, backwards: boolean): number {
  if (length === 0) return -1
  if (current === -1) return backwards ? length - 1 : 0
  return backwards ? (current - 1 + length) % length : (current + 1) % length
}

function cycleF6(backwards: boolean): void {
  const targets = f6Targets()
  if (targets.length === 0) return
  const active = document.activeElement
  const current = targets.findIndex((el) => el === active || el.contains(active))
  targets[stepF6Index(targets.length, current, backwards)]?.focus()
}

window.addEventListener(
  'keydown',
  (event) => {
    if (event.key !== 'F6' || event.ctrlKey || event.altKey || event.metaKey) return
    if (event.repeat) return
    // Let the chord field capture F6 as a filter chord when it holds focus.
    if (document.activeElement === chordInput) return
    event.preventDefault()
    setInputModality('keyboard')
    cycleF6(event.shiftKey)
  },
  true
)
