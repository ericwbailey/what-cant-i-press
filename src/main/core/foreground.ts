import type { RunningApp } from '../providers/types'

/**
 * Holds the app that was frontmost when the popover last opened. Captured before
 * our own window activates, so "Scan current app" can target the app the user
 * was actually using (e.g. VS Code) rather than What Can't I Press itself.
 */
export const foreground: { app: RunningApp | null } = { app: null }
