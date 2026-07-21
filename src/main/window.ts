import { app, BrowserWindow, shell, type Tray, type Rectangle, screen } from 'electron'
import { join } from 'node:path'
import { ABOUT_ICON_DATA_URL } from './about-icon'

const POPOVER_WIDTH = 552
const POPOVER_HEIGHT = 682
const ABOUT_WIDTH = 340
const ABOUT_HEIGHT = 332
const PERMISSIONS_WIDTH = 635
const PERMISSIONS_HEIGHT = 120
// Opaque light window background used off-macOS and by the About window; matches
// the light --bg token so there is no flash before the renderer paints.
const WINDOW_BG_LIGHT = '#f5f5f7'
// Gap between the tray icon and the popover when anchoring on macOS.
const TRAY_GAP = 4
// Minimum margin kept between the popover and the screen work-area edges.
const SCREEN_MARGIN = 8
// Largest plausible macOS menu-bar height. A real status item's top sits within
// this of the display top, so bounds below it are treated as unsettled/invalid.
const MENU_BAR_MAX_HEIGHT = 48

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
  void win.loadURL(
    'data:text/html;charset=utf-8,' + encodeURIComponent(aboutHtml(app.getVersion()))
  )

  return win
}

/** Current grant state of the macOS permission the scan depends on. */
export interface PermissionSnapshot {
  accessibility: boolean
}

const PERMISSION_ROWS = [
  {
    id: 'accessibility',
    label: 'Accessibility',
    description: 'Reads menu-bar commands and custom keyboard shortcuts.',
    settingsUrl: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility'
  }
] as const

/** Escapes text interpolated into the Permissions HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Builds the Permissions window's self-contained HTML document. */
function permissionsHtml(): string {
  const rows = PERMISSION_ROWS.map(
    (row) => `
    <li class="perm-row">
      <div class="perm-text">
        <h2>${escapeHtml(row.label)}</h2>
        <span>${escapeHtml(row.description)}</span>
      </div>
      <div class="perm-controls">
        <a class="perm-settings" href="${escapeHtml(row.settingsUrl)}" aria-label="Settings: ${escapeHtml(row.label)}">Settings</a>
        <span class="perm-status">
          <span id="state-${row.id}" class="perm-state" aria-label="${escapeHtml(row.label)} disabled">Disabled</span>
          <span id="light-${row.id}" class="perm-light" aria-hidden="true"></span>
        </span>
      </div>
    </li>`
  ).join('')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'" />
<style>
  :root { color-scheme: light dark; }
  html, body { height: 100%; margin: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: Canvas;
    color: CanvasText;
    padding: 20px 22px;
    box-sizing: border-box;
    line-height: 1.4;
    font-size: 13px;
    -webkit-user-select: none;
    user-select: none;
    cursor: default;
  }
  .visually-hidden {
    position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
    border: 0; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap;
  }
  ul.perm-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  li.perm-row { display: flex; align-items: flex-end; gap: 14px; padding: 14px 0; }
  li.perm-row:first-child { padding-top: 0; }
  li.perm-row:last-child { padding-bottom: 0; }
  li.perm-row + li.perm-row { border-top: 1px solid rgba(128, 128, 128, 0.22); }
  .perm-text { flex: 1 1 auto; min-width: 0; }
  .perm-text h2 { margin: 0 0 2px; font-size: 14px; font-weight: 600; }
  .perm-text span { display: block; opacity: 0.65; font-size: 12px; }
  .perm-controls { flex: 0 0 auto; display: flex; align-items: flex-end; gap: 16px; }
  a.perm-settings {
    display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box;
    height: 24px; padding: 0 12px; border: 1px solid rgba(128, 128, 128, 0.5); border-radius: 6px;
    color: inherit; text-decoration: none; font-size: 12px; cursor: pointer; background: transparent;
  }
  a.perm-settings:hover { background: rgba(128, 128, 128, 0.14); }
  .perm-status {
    display: inline-flex; align-items: center; gap: 6px; box-sizing: border-box;
    padding: 3px 6px 3px 9px; border: 1px solid rgba(128, 128, 128, 0.3); border-radius: 999px;
  }
  .perm-state {
    font-size: 10px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
    opacity: 0.6; white-space: nowrap; min-width: 56px; text-align: left;
  }
  .perm-light { width: 12px; height: 12px; border-radius: 50%; flex: 0 0 auto; background: #6b6b6b; }
  @media (prefers-color-scheme: dark) { .perm-light { background: #000; } }
  .perm-light.granted { background: #30d158; }
</style>
</head>
<body>
  <h1 class="visually-hidden">Permissions</h1>
  <ul class="perm-list">${rows}
  </ul>
</body>
</html>`
}

/**
 * Creates the small, macOS-only Permissions window. It mirrors the About window:
 * self-contained HTML loaded from a data URL, no renderer entry, and link
 * activation routed to the external handler — here the "Settings" control
 * deep-links into the relevant System Settings pane. Each row's status light is
 * driven from the main process via `executeJavaScript` (privileged, so it needs
 * no inline script or preload) and re-read on load, on focus, and on a short
 * interval, so a light turns green shortly after the user grants access and
 * returns from System Settings.
 */
export function createPermissionsWindow(
  getSnapshot: () => Promise<PermissionSnapshot>
): BrowserWindow {
  const win = new BrowserWindow({
    width: PERMISSIONS_WIDTH,
    height: PERMISSIONS_HEIGHT,
    show: false,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    skipTaskbar: true,
    title: 'Permissions',
    backgroundColor: process.platform === 'darwin' ? undefined : WINDOW_BG_LIGHT,
    webPreferences: { sandbox: true, contextIsolation: true }
  })

  win.setMenuBarVisibility(false)

  // Route control activation to System Settings / the browser; deny in-window
  // navigation. The Settings controls use the x-apple.systempreferences scheme.
  const openExternal = (url: string): void => {
    if (url.startsWith('https://') || url.startsWith('x-apple.systempreferences:')) {
      void shell.openExternal(url)
    }
  }
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    openExternal(url)
  })

  // Pushes the latest grant state into the status light.
  const refresh = async (): Promise<void> => {
    if (win.isDestroyed()) return
    let snapshot: PermissionSnapshot
    try {
      snapshot = await getSnapshot()
    } catch {
      return
    }
    if (win.isDestroyed()) return
    const js = `(() => {
      const set = (id, label, granted) => {
        const light = document.getElementById('light-' + id);
        if (light) light.classList.toggle('granted', granted);
        const state = document.getElementById('state-' + id);
        if (state) {
          state.textContent = granted ? 'Enabled' : 'Disabled';
          state.setAttribute('aria-label', label + (granted ? ' enabled' : ' disabled'));
        }
      };
      set('accessibility', 'Accessibility', ${snapshot.accessibility});
    })()`
    try {
      await win.webContents.executeJavaScript(js)
    } catch {
      // Window torn down mid-refresh.
    }
  }

  // Shrinks the window to fit its content, then reveals it. The content height
  // depends on how the descriptions wrap (window width, font size, localized
  // strings), so it is measured after load rather than hard-coded — a fixed
  // height previously left slack once the descriptions stopped wrapping.
  const fitAndShow = async (): Promise<void> => {
    if (win.isDestroyed()) return
    try {
      const height = await win.webContents.executeJavaScript(
        `Math.ceil(document.querySelector('ul.perm-list').getBoundingClientRect().bottom` +
          ` + parseFloat(getComputedStyle(document.body).paddingBottom))`
      )
      if (!win.isDestroyed() && typeof height === 'number' && height > 0) {
        win.setContentSize(win.getContentBounds().width, height)
      }
    } catch {
      // Fall back to the default height if measurement fails.
    }
    if (!win.isDestroyed()) win.show()
  }

  win.webContents.on('did-finish-load', () => {
    void refresh()
    void fitAndShow()
  })
  win.on('focus', () => void refresh())
  const timer = setInterval(() => void refresh(), 2000)
  win.on('closed', () => clearInterval(timer))

  void win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(permissionsHtml()))

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
 * Whether tray bounds are usable as a popover anchor. Rejects a null tray and
 * the unsettled/implausible geometry seen right after `new Tray()` or when the
 * status item never renders (observed as `x=0 y=1117 w=32 h=0`). A real macOS
 * status item has non-zero height and sits at the top of its display, so
 * zero-height or bottom-edge bounds mean "no usable anchor".
 */
function isUsableTrayBounds(bounds: Rectangle | undefined): bounds is Rectangle {
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return false
  if (process.platform !== 'darwin') return true
  const display = screen.getDisplayMatching(bounds)
  return bounds.y <= display.bounds.y + MENU_BAR_MAX_HEIGHT
}

/**
 * Positions the popover relative to the tray icon. On macOS the menu bar is at
 * the top, so the popover drops down from the icon; on Windows the tray sits in
 * the bottom-right, so it rises from the work-area corner.
 *
 * When the tray is null or its bounds are not usable (missing/overflowed status
 * item, or geometry not yet settled), the popover is instead hung from the
 * top-right of the primary display just below the menu bar on macOS — where the
 * status item lives and where the user looks for it — or the primary work-area
 * corner elsewhere, so the launch reveal is always visible.
 */
export function positionPopover(win: BrowserWindow, tray: Tray | null): void {
  const winBounds = win.getBounds()
  const trayBounds = tray?.getBounds()
  const anchor = isUsableTrayBounds(trayBounds) ? trayBounds : null

  if (process.platform === 'darwin') {
    if (anchor) {
      const x = Math.round(anchor.x + anchor.width / 2 - winBounds.width / 2)
      const y = Math.round(anchor.y + anchor.height + TRAY_GAP)
      win.setPosition(clampX(x, winBounds.width), y, false)
      return
    }
    // No usable status item: hang from the top-right of the primary display,
    // just below the menu bar (workArea.y already excludes it).
    const primary = screen.getPrimaryDisplay().workArea
    const x = Math.round(primary.x + primary.width - winBounds.width - SCREEN_MARGIN)
    win.setPosition(clampX(x, winBounds.width), primary.y + SCREEN_MARGIN, false)
    return
  }

  // Windows / Linux: anchor to the display containing the tray, or the primary
  // display when the tray is unavailable.
  const display = anchor ? screen.getDisplayMatching(anchor) : screen.getPrimaryDisplay()
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
