import type { Modifier } from '@shared/shortcuts'

const MOD_TOKENS: Record<string, Modifier> = {
  ctrl: 'control',
  control: 'control',
  ctl: 'control',
  alt: 'option',
  menu: 'option',
  shift: 'shift',
  win: 'super',
  windows: 'super',
  meta: 'super',
  cmd: 'command'
}

/** Windows accelerator key-name aliases mapped to canonical key tokens. */
const KEY_ALIASES: Record<string, string> = {
  esc: 'Escape',
  escape: 'Escape',
  del: 'ForwardDelete',
  delete: 'ForwardDelete',
  ins: 'Insert',
  insert: 'Insert',
  bksp: 'Delete',
  backspace: 'Delete',
  enter: 'Return',
  return: 'Return',
  space: 'Space',
  spacebar: 'Space',
  tab: 'Tab',
  pgup: 'PageUp',
  pageup: 'PageUp',
  pgdn: 'PageDown',
  pagedown: 'PageDown',
  home: 'Home',
  end: 'End',
  left: 'Left',
  right: 'Right',
  up: 'Up',
  down: 'Down',
  plus: '+',
  add: '+',
  minus: '-',
  subtract: '-',
  multiply: '*',
  divide: '/',
  decimal: '.',
  oemplus: '+',
  oemminus: '-',
  oemcomma: ',',
  oemperiod: '.',
  oemquestion: '/',
  oem_2: '/',
  oemsemicolon: ';',
  oem_1: ';',
  oemtilde: '`',
  oem_3: '`',
  oemopenbrackets: '[',
  oem_4: '[',
  oempipe: '\\',
  oem_5: '\\',
  oem_102: '\\',
  oemclosebrackets: ']',
  oem_6: ']',
  oemquotes: "'",
  oem_7: "'"
}

function normalizeKeyName(raw: string): string {
  const low = raw.toLowerCase()
  if (KEY_ALIASES[low]) return KEY_ALIASES[low]
  if (/^f\d{1,2}$/.test(low)) return low.toUpperCase()
  return raw.length === 1 ? raw.toUpperCase() : raw
}

/**
 * Parses a UI Automation `AcceleratorKey` string such as `Ctrl+Shift+S`,
 * `Alt+F4`, or `Ctrl++` into a canonical key + modifier set. Leading tokens that
 * match modifier names are consumed as modifiers; the remainder forms the key,
 * which correctly recovers a literal `+` from inputs like `Ctrl++`.
 */
export function parseAcceleratorString(
  accel: string
): { key: string; modifiers: Modifier[] } | null {
  const s = (accel ?? '').trim()
  if (!s) return null

  const segments = s.split('+')
  const modifiers: Modifier[] = []
  let i = 0
  while (i < segments.length - 1) {
    const token = segments[i].trim().toLowerCase()
    const mod = MOD_TOKENS[token]
    if (!mod) break
    if (!modifiers.includes(mod)) modifiers.push(mod)
    i++
  }

  const rawKey = segments.slice(i).join('+').trim() || '+'
  const key = normalizeKeyName(rawKey)
  if (!key) return null
  return { key, modifiers }
}
