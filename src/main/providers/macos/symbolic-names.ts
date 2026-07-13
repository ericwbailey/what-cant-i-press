/**
 * Human-readable descriptions for macOS `AppleSymbolicHotKeys` ids. Only ids
 * whose action was cross-verified against the decoded default key combination
 * are included; unknown ids fall back to a generic label. The decoded key combo
 * itself is always accurate regardless of whether a name is present here.
 */
export const SYMBOLIC_HOTKEY_NAMES: Record<number, string> = {
  7: 'Move focus to the menu bar',
  8: 'Move focus to the Dock',
  9: 'Move focus to the active or next window',
  10: 'Move focus to the window toolbar',
  11: 'Move focus to the floating window',
  12: 'Turn full keyboard access on or off',
  13: 'Change how Tab moves focus',
  15: 'Turn zoom on or off',
  17: 'Zoom in',
  19: 'Zoom out',
  21: 'Invert colors',
  23: 'Turn image smoothing on or off (zoom)',
  25: 'Increase contrast',
  26: 'Decrease contrast',
  27: 'Move focus to the next window',
  28: 'Save a picture of the screen as a file',
  29: 'Copy a picture of the screen to the clipboard',
  30: 'Save a picture of the selected area as a file',
  31: 'Copy a picture of the selected area to the clipboard',
  32: 'Mission Control',
  33: 'Show application windows',
  36: 'Show desktop',
  52: 'Turn Dock hiding on or off',
  57: 'Move focus to the status menus',
  59: 'Turn VoiceOver on or off',
  60: 'Select the previous input source',
  61: 'Select the next source in the Input menu',
  64: 'Show Spotlight search',
  65: 'Show Finder search window',
  79: 'Move left a space',
  81: 'Move right a space',
  98: 'Show Help menu',
  118: 'Switch to Desktop 1',
  162: 'Show accessibility controls',
  184: 'Screenshot and recording options',
  190: 'Quick Note'
}
