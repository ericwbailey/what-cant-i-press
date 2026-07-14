import type { RawShortcut, Platform } from '@shared/shortcuts'
import type { PermissionStatus } from '@shared/scan'

/** A running application that may own keyboard shortcuts. */
export interface RunningApp {
  /** Stable identifier: bundle id (macOS) or executable base name (Windows). */
  id: string
  name: string
  pid: number
  /** Whether the app is known to expose a menu bar worth scanning. */
  hasMenu?: boolean
}

/**
 * Platform-specific capability provider. Implementations wrap native helpers
 * (macOS Accessibility, Windows UI Automation) and OS shortcut stores. All
 * methods degrade gracefully: on failure they resolve empty rather than throw,
 * so a partial scan still succeeds.
 */
export interface PlatformProvider {
  readonly platform: Platform

  /** Lists apps that currently have a menu/UI worth inspecting. */
  listRunningApps(): Promise<RunningApp[]>

  /** Reads OS-reserved shortcuts (macOS symbolic hotkeys / curated Windows list). */
  readOsShortcuts(): Promise<RawShortcut[]>

  /**
   * Reads menu-bar accelerators for a specific app by pid via Accessibility. The
   * app does not need to be frontmost — its menus are already populated — so this
   * reads the last-focused app without activating it.
   */
  readAppMenuShortcuts(app: RunningApp): Promise<RawShortcut[]>

  /** Returns the currently frontmost app, or null if it can't be determined. */
  getFrontmostApp(): Promise<RunningApp | null>

  /** Brings an app to the foreground. */
  activateApp(app: RunningApp): Promise<void>

  /** Reports whether the scan has the OS permissions it needs. */
  permissionStatus(): Promise<PermissionStatus>

  /** Triggers the OS permission prompt / opens the relevant settings pane. */
  requestPermission(): Promise<PermissionStatus>
}
