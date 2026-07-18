import { app, BrowserWindow, shell, type Tray, screen } from 'electron'
import { join } from 'node:path'
import { ABOUT_ICON_DATA_URL } from './about-icon'

const POPOVER_WIDTH = 552
const POPOVER_HEIGHT = 682
const ABOUT_WIDTH = 340
const ABOUT_HEIGHT = 332
// Opaque light window background used off-macOS and by the About window; matches
// the light --bg token so there is no flash before the renderer paints.
const WINDOW_BG_LIGHT = '#f5f5f7'
// Gap between the tray icon and the popover when anchoring on macOS.
const TRAY_GAP = 4
// Minimum margin kept between the popover and the screen work-area edges.
const SCREEN_MARGIN = 8

/**
 * Shared popover state. The window floats above other apps and ignores
 * blur-hide while `pinned` (user toggle) or `scanning` (full-scan sweep) is
 * active; `suppressHide` is the derived flag read by the blur handler.
 */
export const popoverState = { suppressHide: false, pinned: false, scanning: false }

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
    // macOS keeps the 'menu' vibrancy only so the window mask rounds the popover
    // corners; the renderer paints an opaque --bg over the material, so none of
    // its translucency actually shows through.
    vibrancy: process.platform === 'darwin' ? 'menu' : undefined,
    backgroundColor: process.platform === 'darwin' ? undefined : WINDOW_BG_LIGHT,
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
    // Dev instance only (electron-vite sets ELECTRON_RENDERER_URL; preview and
    // packaged builds do not): auto-open detached DevTools whenever the popover
    // is shown so the frameless renderer can be inspected. Detached keeps it off
    // the small popover; the blur handler above leaves the popover visible while
    // DevTools are open.
    win.on('show', () => {
      if (!win.webContents.isDevToolsOpened()) win.webContents.openDevTools({ mode: 'detach' })
    })
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

/** Repository URL shown as the "Source" link in the About window. */
const ABOUT_URL = 'https://github.com/ericwbailey/what-cant-i-press'

/** Builds the About window's self-contained HTML document. */
function aboutHtml(version: string): string {
  const currentYear = new Date().getFullYear()
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'" />
<style>
  :root { color-scheme: light dark; }
  html, body { height: 100%; margin: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: Canvas;
    color: CanvasText;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
    box-sizing: border-box;
    line-height: 1.5;
    font-size: 13px;
    -webkit-user-select: none;
    user-select: none;
    cursor: default;
  }
  h1 { margin: 0 0 6px; font-size: 15px; font-weight: 700; }
  p { margin: 0; }
  .app-icon { width: 80px; height: 80px; margin: 0 0 12px; -webkit-user-drag: none; }
  .author { margin-top: 16px; }
  /* Plain-text link: inherits the body color, underlined. */
  a.website { color: inherit; text-decoration: underline; cursor: pointer; }
</style>
</head>
<body>
  <img class="app-icon" src="${ABOUT_ICON_DATA_URL}" alt="" aria-hidden="true" width="80" height="80" />
  <h1>What Can't I Press?</h1>
  <p>Version ${version}</p>
  <p><a class="website" href="${ABOUT_URL}">Source</a></p>
  <p class="author">Eric Bailey © ${currentYear}</p>
</body>
</html>`
}

/**
 * Creates the small About window. Its "Source" link is styled as underlined
 * plain text and opens in the user's default browser; the window itself never
 * navigates. Self-contained HTML is loaded from a data URL (no renderer entry).
 */
export function createAboutWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: ABOUT_WIDTH,
    height: ABOUT_HEIGHT,
    show: false,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    skipTaskbar: true,
    title: "About What Can't I Press?",
    backgroundColor: process.platform === 'darwin' ? undefined : WINDOW_BG_LIGHT,
    webPreferences: { sandbox: true, contextIsolation: true }
  })

  win.setMenuBarVisibility(false)

  // Route link activation to the external browser; deny in-window navigation.
  const openExternal = (url: string): void => {
    if (url.startsWith('https://')) void shell.openExternal(url)
  }
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    openExternal(url)
  })

  win.once('ready-to-show', () => win.show())
  void win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(aboutHtml(app.getVersion())))

  return win
}

/**
 * Reapplies the floating/always-on-top state from `pinned` and `scanning`. While
 * either is active the popover floats above other apps and does not hide on blur.
 */
function syncFloat(win: BrowserWindow): void {
  const floating = popoverState.pinned || popoverState.scanning
  popoverState.suppressHide = floating
  win.setAlwaysOnTop(floating, 'floating')
}

/**
 * Toggles "scanning" mode on the popover: while active, the window floats above
 * other apps and does not hide on blur, so the user can watch progress as each
 * app is briefly activated.
 */
export function setScanning(win: BrowserWindow, scanning: boolean): void {
  popoverState.scanning = scanning
  syncFloat(win)
  if (scanning && !win.isVisible()) win.show()
}

/**
 * Pins or unpins the popover so it stays above all other application windows and
 * does not hide on blur. Persists across scans. Returns the resulting state.
 */
export function setPinned(win: BrowserWindow, pinned: boolean): boolean {
  popoverState.pinned = pinned
  syncFloat(win)
  return win.isAlwaysOnTop()
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
    const y = Math.round(trayBounds.y + trayBounds.height + TRAY_GAP)
    win.setPosition(clampX(x, winBounds.width), y, false)
    return
  }

  // Windows / Linux: anchor to the display containing the tray.
  const display = screen.getDisplayMatching(trayBounds)
  const workArea = display.workArea
  const x = Math.round(workArea.x + workArea.width - winBounds.width - SCREEN_MARGIN)
  const y = Math.round(workArea.y + workArea.height - winBounds.height - SCREEN_MARGIN)
  win.setPosition(x, y, false)
}

function clampX(x: number, width: number): number {
  const primary = screen.getPrimaryDisplay().workArea
  const min = primary.x + SCREEN_MARGIN
  const max = primary.x + primary.width - width - SCREEN_MARGIN
  return Math.max(min, Math.min(x, max))
}
