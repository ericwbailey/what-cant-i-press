import { app, Tray, ipcMain, type BrowserWindow } from 'electron'
import { createTrayIcon } from './icon'
import { createPopoverWindow, positionPopover } from './window'

let tray: Tray | null = null
let popover: BrowserWindow | null = null

function togglePopover(): void {
  if (!popover || !tray) return
  if (popover.isVisible()) {
    popover.hide()
    return
  }
  positionPopover(popover, tray)
  popover.show()
  popover.focus()
}

function registerIpc(): void {
  ipcMain.handle('app:ping', () => 'pong')
}

app.whenReady().then(() => {
  // Menu-bar-only app: no Dock icon on macOS.
  if (process.platform === 'darwin') app.dock?.hide()

  registerIpc()

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
