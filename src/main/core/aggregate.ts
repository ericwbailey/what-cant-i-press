import {
  buildShortcutId,
  canonicalizeModifiers,
  formatCombo,
  normalizeKeyToken,
  SEGMENT_SCOPE,
  type Platform,
  type RawShortcut,
  type Shortcut,
  type ShortcutSegment
} from '@shared/shortcuts'

const SEGMENT_RANK: Record<ShortcutSegment, number> = {
  'global-os': 0,
  'global-app': 1,
  'focused-menu': 2,
  'screen-reader': 3
}

const SOURCE_RANK: Record<RawShortcut['source'], number> = {
  detected: 0,
  curated: 1
}

function toShortcut(raw: RawShortcut, platform: Platform): Shortcut | null {
  // Screen-reader commands supply an explicit, verbatim label that is used as
  // both the display combo and the dedupe id, since their keystrokes (reader
  // key, numpad keys, multi-step sequences) do not fit the key/modifier model
  // and must render with fixed notation regardless of host platform.
  if (raw.keystroke) {
    return {
      id: `${raw.segment}|${raw.appId ?? 'os'}|${raw.keystroke}`.toLowerCase(),
      key: '',
      modifiers: [],
      comboLabel: raw.keystroke,
      segment: raw.segment,
      source: raw.source,
      origin: raw.origin,
      confidence: raw.confidence ?? 'declared',
      scope: raw.scope ?? SEGMENT_SCOPE[raw.segment],
      appId: raw.appId,
      appName: raw.appName,
      description: raw.description,
      enabled: raw.enabled ?? true
    }
  }

  const key = normalizeKeyToken(raw.key)
  if (!key) return null
  const modifiers = canonicalizeModifiers(raw.modifiers)
  return {
    id: buildShortcutId(raw.segment, raw.appId, key, modifiers),
    key,
    modifiers,
    comboLabel: formatCombo(key, modifiers, platform),
    segment: raw.segment,
    source: raw.source,
    origin: raw.origin,
    confidence: raw.confidence ?? 'declared',
    scope: raw.scope ?? SEGMENT_SCOPE[raw.segment],
    appId: raw.appId,
    appName: raw.appName,
    description: raw.description,
    enabled: raw.enabled ?? true
  }
}

/** Prefers detected over curated, keeps a description if one side lacks it. */
function merge(existing: Shortcut, incoming: Shortcut): Shortcut {
  const preferred = SOURCE_RANK[incoming.source] < SOURCE_RANK[existing.source] ? incoming : existing
  const other = preferred === incoming ? existing : incoming
  return {
    ...preferred,
    description: preferred.description ?? other.description,
    appName: preferred.appName ?? other.appName,
    enabled: existing.enabled || incoming.enabled
  }
}

/**
 * Normalizes raw shortcuts into display-ready {@link Shortcut}s, deduplicates by
 * id (segment + app + combo), and sorts by segment, then app, then combo.
 */
export function aggregate(raws: RawShortcut[], platform: Platform): Shortcut[] {
  const byId = new Map<string, Shortcut>()

  for (const raw of raws) {
    const shortcut = toShortcut(raw, platform)
    if (!shortcut) continue
    const existing = byId.get(shortcut.id)
    byId.set(shortcut.id, existing ? merge(existing, shortcut) : shortcut)
  }

  return [...byId.values()].sort((a, b) => {
    if (a.segment !== b.segment) return SEGMENT_RANK[a.segment] - SEGMENT_RANK[b.segment]
    const appA = a.appName ?? ''
    const appB = b.appName ?? ''
    if (appA !== appB) return appA.localeCompare(appB)
    return a.comboLabel.localeCompare(b.comboLabel)
  })
}
