import type { RawShortcut, Platform } from '@shared/shortcuts'
import type { RunningApp } from '../providers/types'

/**
 * Returns curated third-party global hotkeys for the apps that are currently
 * running. These fill the "works when the app is not focused" segment that no
 * OS API can enumerate live. The dataset and matcher are implemented in Phase 4;
 * this stub keeps the pipeline complete.
 */
export function getCuratedShortcuts(
  _apps: RunningApp[],
  _platform: Platform
): RawShortcut[] {
  return []
}
