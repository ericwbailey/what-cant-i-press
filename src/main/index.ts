import { app, Tray, type BrowserWindow } from 'electron'
import { createTrayIcon } from './icon'
import { createPopoverWindow, positionPopover } from './window'
import { registerIpc } from './ipc'
import { getProvider } from './providers'
import { foreground } from './core/foreground'

let tray: Tray | null = null
let popover: BrowserWindow | null = null

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

async function togglePopover(): Promise<void> {
  if (!popover || !tray) return
  if (popover.isVisible()) {
    popover.hide()
    return
  }
  await captureForegroundApp()
  positionPopover(popover, tray)
  popover.show()
  popover.focus()
}

app.whenReady().then(() => {
  // Menu-bar-only app: no Dock icon on macOS.
  if (process.platform === 'darwin') app.dock?.hide()

  registerIpc(() => popover)

  popover = createPopoverWindow()

  tray = new Tray(createTrayIcon())
  tray.setToolTip("What Can't I Press")
  tray.on('click', togglePopover)
  tray.on('right-click', togglePopover)
})

// Keep running as a background menu-bar app even with no visible windows.
app.on('window-all-closed', () => {
  // Intentionally empty: do not quit when the popover is hidden/closed.
})
