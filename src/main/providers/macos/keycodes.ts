import type { Modifier } from '@shared/shortcuts'

/** macOS virtual keycodes for non-character keys. */
export const SPECIAL_VK: Record<number, string> = {
  36: 'Return',
  48: 'Tab',
  49: 'Space',
  51: 'Delete',
  53: 'Escape',
  71: 'Clear',
  76: 'Enter',
  114: 'Help',
  115: 'Home',
  116: 'PageUp',
  117: 'ForwardDelete',
  119: 'End',
  121: 'PageDown',
  123: 'Left',
  124: 'Right',
  125: 'Down',
  126: 'Up',
  122: 'F1',
  120: 'F2',
  99: 'F3',
  118: 'F4',
  96: 'F5',
  97: 'F6',
  98: 'F7',
  100: 'F8',
  101: 'F9',
  109: 'F10',
  103: 'F11',
  111: 'F12',
  105: 'F13',
  107: 'F14',
  113: 'F15',
  106: 'F16',
  64: 'F17',
  79: 'F18',
  80: 'F19',
  90: 'F20'
}

/** Digit keycodes, needed when symbolic hotkeys omit the ASCII value. */
export const DIGIT_VK: Record<number, string> = {
  18: '1',
  19: '2',
  20: '3',
  21: '4',
  23: '5',
  22: '6',
  26: '7',
  28: '8',
  25: '9',
  29: '0'
}

/** macOS menu-glyph characters mapped to canonical key tokens. */
export const GLYPH_TO_TOKEN: Record<string, string> = {
  '\u238B': 'Escape', // ⎋
  '\u21E5': 'Tab', // ⇥
  '\u21A9': 'Return', // ↩
  '\u2324': 'Enter', // ⌤
  '\u232B': 'Delete', // ⌫
  '\u2326': 'ForwardDelete', // ⌦
  '\u2190': 'Left', // ←
  '\u2192': 'Right', // →
  '\u2191': 'Up', // ↑
  '\u2193': 'Down', // ↓
  '\u21DE': 'PageUp', // ⇞
  '\u21DF': 'PageDown', // ⇟
  '\u2196': 'Home', // ↖
  '\u2198': 'End', // ↘
  '\u2423': 'Space', // ␣
  // Raw control characters as emitted by AXMenuItemCmdChar.
  '\u001B': 'Escape',
  '\r': 'Return', // \u000D
  '\u0003': 'Enter',
  '\t': 'Tab', // \u0009
  '\b': 'Delete', // \u0008 (delete-left)
  '\u007F': 'Delete',
  // NSFunctionKey private-use range, when navigation keys arrive as cmdChar.
  '\uF700': 'Up',
  '\uF701': 'Down',
  '\uF702': 'Left',
  '\uF703': 'Right',
  '\uF728': 'ForwardDelete',
  '\uF729': 'Home',
  '\uF72B': 'End',
  '\uF72C': 'PageUp',
  '\uF72D': 'PageDown'
}

/**
 * AX / Carbon menu modifier flags. Command is implied for menu shortcuts unless
 * bit 3 (kMenuNoCommandModifier) is set.
 */
export function decodeAxModifiers(mask: number): Modifier[] {
  const mods: Modifier[] = []
  if ((mask & 8) === 0) mods.push('command')
  if (mask & 1) mods.push('shift')
  if (mask & 2) mods.push('option')
  if (mask & 4) mods.push('control')
  return mods
}

const NS_SHIFT = 1 << 17
const NS_CONTROL = 1 << 18
const NS_OPTION = 1 << 19
const NS_COMMAND = 1 << 20
const NS_FUNCTION = 1 << 23

/**
 * Returns true when the function-key flag is merely an artifact of the key being
 * a function/navigation key (macOS sets it automatically) rather than a real
 * Globe/fn modifier the user must press.
 */
function functionFlagIsArtifact(key: string): boolean {
  if (/^F\d+$/.test(key)) return true
  return ['Left', 'Right', 'Up', 'Down', 'Home', 'End', 'PageUp', 'PageDown'].includes(key)
}

/** NSEvent device-independent modifier flags used by symbolic hotkeys. */
export function decodeNsModifiers(mask: number, key: string): Modifier[] {
  const mods: Modifier[] = []
  if (mask & NS_CONTROL) mods.push('control')
  if (mask & NS_OPTION) mods.push('option')
  if (mask & NS_SHIFT) mods.push('shift')
  if (mask & NS_COMMAND) mods.push('command')
  if (mask & NS_FUNCTION && !functionFlagIsArtifact(key)) mods.push('function')
  return mods
}
