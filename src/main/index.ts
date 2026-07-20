import { app, Menu, Tray, type BrowserWindow, type MenuItemConstructorOptions } from 'electron'
import { IPC, type MenuCommand } from '@shared/ipc'
import { createTrayIcon } from './icon'
import { createAboutWindow, createPopoverWindow, positionPopover, popoverState } from './window'
import { registerIpc } from './ipc'
import { getProvider } from './providers'
import { foreground } from './core/foreground'
import { log, describeError, logFilePath } from './core/logger'
import { isFirstLaunch } from './core/settings'
import { initAutoUpdater, checkForUpdatesManually } from './updater'

let tray: Tray | null = null
let popover: BrowserWindow | null = null
let aboutWindow: BrowserWindow | null = null

/**
 * Captures the app that is frontmost right now — before our popover shows and
 * steals focus — so "Scan current app" can target the app the user was actually
 * using. A status-item click does not activate our app, so at this point the
 * previously-focused app is still frontmost. Ignores our own process.
 */
async function captureForegroundApp(): Promise<void> {
  try {
    const front = await getProvider().getFrontmostApp()
    if (front && front.pid !== process.pid) foreground.app = front
  } catch {
    // Leave the previously captured app in place if the query fails.
  }
}

/** Positions and reveals the popover. Does not capture the frontmost app. */
function showPopover(): void {
  if (!popover) return
  positionPopover(popover, tray)
  popover.show()
  popover.focus()
}

async function togglePopover(): Promise<void> {
  if (!popover) return
  if (popover.isVisible()) {
    popover.hide()
    return
  }
  await captureForegroundApp()
  showPopover()
}

/**
 * Forwards a tray-menu action to the renderer, which owns the scan/export/pin
 * logic and state. Reveals the popover first so results, progress, and dialogs
 * are visible.
 */
function runMenuCommand(command: MenuCommand): void {
  if (!popover) return
  showPopover()
  popover.webContents.send(IPC.menuCommand, command)
}

/**
 * Opens the About window, or focuses it if already open. The window renders the
 * app name, version, a "Website" link (underlined plain text) that opens the
 * repo in the browser, and the author. A single instance is reused.
 */
function showAbout(): void {
  if (aboutWindow && !aboutWindow.isDestroyed()) {
    aboutWindow.focus()
    return
  }
  aboutWindow = createAboutWindow()
  aboutWindow.on('closed', () => {
    aboutWindow = null
  })
}

/**
 * Builds and shows the tray context menu. Must run synchronously: on macOS the
 * status-item right-click is serviced inside a native mouse-tracking loop, and
 * popping the menu after an `await` misses that window, so the menu never
 * appears. Frontmost-app capture is therefore kicked off without blocking — it
 * resolves well before any menu item triggers a scan (the scan reads
 * `foreground.app` only after a renderer round-trip). The menu is rebuilt on
 * each open so the Pin/Unpin label reflects the current pinned state.
 */
function showTrayMenu(): void {
  if (!tray) return
  void captureForegroundApp()
  const template: MenuItemConstructorOptions[] = [
    { label: 'Scan last focused app', click: () => runMenuCommand('scan-frontmost') },
    { label: 'Scan all open apps', click: () => runMenuCommand('scan-all') },
    { type: 'separator' },
    { label: 'Export JSON', click: () => runMenuCommand('export') },
    { label: popoverState.pinned ? 'Unpin' : 'Pin', click: () => runMenuCommand('toggle-pin') },
    { type: 'separator' },
    { label: 'Check for updates', click: () => checkForUpdatesManually() },
    { label: 'About', click: () => showAbout() },
    { label: 'Quit', click: () => app.quit() }
  ]
  tray.popUpContextMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  log(`App ready (log file: ${logFilePath()})`)

  // Menu-bar-only app: no Dock icon on macOS.
  if (process.platform === 'darwin') app.dock?.hide()

  registerIpc(() => popover)

  popover = createPopoverWindow()
  log('Popover window created')

  // The status item is the primary entry point; guard its creation so a failure
  // can't leave the app running but invisible. Bounds are logged so a status
  // item that was created yet not shown (zero width / menu-bar overflow) can be
  // told apart from one that threw.
  try {
    tray = new Tray(createTrayIcon())
    tray.setToolTip("What Can't I Press")
    tray.on('click', (event) => {
      // Control-click on macOS is a secondary click: show the context menu, the
      // same as a right-click, instead of toggling the popover.
      if (process.platform === 'darwin' && event.ctrlKey) {
        showTrayMenu()
        return
      }
      void togglePopover()
    })
    tray.on('right-click', showTrayMenu)
    const b = tray.getBounds()
    log(`Tray created (bounds x=${b.x} y=${b.y} w=${b.width} h=${b.height})`)
  } catch (err) {
    tray = null
    log(`Tray creation failed: ${describeError(err)}`)
  }

  // First launch of a menu-bar-only app is otherwise silent and invisible:
  // reveal the popover once so the user gets confirmation the app is running and
  // learns where it lives.
  if (isFirstLaunch()) {
    log('First launch: revealing popover')
    showPopover()
  }

  // Background update checks (Windows packaged builds only; see updater.ts).
  initAutoUpdater()
}).catch((err) => {
  // A throw here previously left the app running with no tray, no window, and no
  // trace; record it instead.
  log(`Startup failed: ${describeError(err)}`)
})

// Keep running as a background menu-bar app even with no visible windows.
app.on('window-all-closed', () => {
  // Intentionally empty: do not quit when the popover is hidden/closed.
})
