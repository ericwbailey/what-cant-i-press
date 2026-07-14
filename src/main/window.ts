import { BrowserWindow, type Tray, screen } from 'electron'
import { join } from 'node:path'

const POPOVER_WIDTH = 460
const POPOVER_HEIGHT = 620

/**
 * Shared popover state. `suppressHide` keeps the window visible during a full
 * scan, when activating other apps would otherwise blur and hide it.
 */
export const popoverState = { suppressHide: false }

/**
 * Creates the frameless popover window that hangs off the tray icon. The window
 * starts hidden and is shown/positioned on demand.
 */
export function createPopoverWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: POPOVER_WIDTH,
    height: POPOVER_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    skipTaskbar: true,
    // A subtle vibrancy on macOS; ignored elsewhere.
    vibrancy: process.platform === 'darwin' ? 'menu' : undefined,
    backgroundColor: process.platform === 'darwin' ? undefined : '#f5f5f7',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  win.on('blur', () => {
    if (popoverState.suppressHide) return
    if (!win.webContents.isDevToolsOpened()) win.hide()
  })

  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (rendererUrl) {
    void win.loadURL(rendererUrl)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

/**
 * Toggles "scanning" mode on the popover: while active, the window floats above
 * other apps and does not hide on blur, so the user can watch progress as each
 * app is briefly activated.
 */
export function setScanning(win: BrowserWindow, scanning: boolean): void {
  popoverState.suppressHide = scanning
  win.setAlwaysOnTop(scanning, 'floating')
  if (scanning && !win.isVisible()) win.show()
}

/**
 * Positions the popover relative to the tray icon. On macOS the menu bar is at
 * the top, so the popover drops down from the icon; on Windows the tray sits in
 * the bottom-right, so it rises from the work-area corner.
 */
export function positionPopover(win: BrowserWindow, tray: Tray): void {
  const trayBounds = tray.getBounds()
  const winBounds = win.getBounds()

  if (process.platform === 'darwin') {
    const x = Math.round(trayBounds.x + trayBounds.width / 2 - winBounds.width / 2)
    const y = Math.round(trayBounds.y + trayBounds.height + 4)
    win.setPosition(clampX(x, winBounds.width), y, false)
    return
  }

  // Windows / Linux: anchor to the display containing the tray.
  const display = screen.getDisplayMatching(trayBounds)
  const workArea = display.workArea
  const x = Math.round(workArea.x + workArea.width - winBounds.width - 8)
  const y = Math.round(workArea.y + workArea.height - winBounds.height - 8)
  win.setPosition(x, y, false)
}

function clampX(x: number, width: number): number {
  const primary = screen.getPrimaryDisplay().workArea
  const min = primary.x + 8
  const max = primary.x + primary.width - width - 8
  return Math.max(min, Math.min(x, max))
}
