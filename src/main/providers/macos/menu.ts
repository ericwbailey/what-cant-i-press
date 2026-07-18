import type { Modifier } from '@shared/shortcuts'
import { GLYPH_TO_TOKEN, SPECIAL_VK, decodeAxModifiers } from './keycodes'

/** Raw menu item emitted by the Swift Accessibility helper. */
export interface RawMenuItem {
  title: string
  cmdChar: string
  cmdVirtualKey: number
  cmdModifiers: number
}

/**
 * Converts a raw AX menu item into a canonical key + modifiers. Special keys are
 * preferred via their virtual keycode; otherwise the command character (or its
 * glyph) is used. Returns null when the item carries no usable shortcut.
 */
export function decodeMenuItem(item: RawMenuItem): { key: string; modifiers: Modifier[] } | null {
  const modifiers = decodeAxModifiers(item.cmdModifiers)

  let key = ''
  if (item.cmdVirtualKey > 0 && SPECIAL_VK[item.cmdVirtualKey]) {
    key = SPECIAL_VK[item.cmdVirtualKey]
  } else if (item.cmdChar) {
    key = GLYPH_TO_TOKEN[item.cmdChar] ?? item.cmdChar
  }

  if (!key) return null
  return { key, modifiers }
}
