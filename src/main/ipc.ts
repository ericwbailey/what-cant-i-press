import { dialog, ipcMain, shell, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc'
import type { ScanOptions } from '@shared/scan'
import { getProvider } from './providers'
import { runScan, type Cancellation } from './core/scan-runner'
import { setScanning } from './window'

const ALLOWED_EXTERNAL = /^(https?:|x-apple\.systempreferences:|ms-settings:)/i

/**
 * Asks the user to confirm the disruptive full scan. Returns true to proceed
 * with the activate-each-app sweep, false to fall back to a frontmost-only scan.
 */
async function confirmFullScan(win: BrowserWindow | null): Promise<boolean> {
  const options = {
    type: 'warning' as const,
    buttons: ['Scan all apps', 'Frontmost only'],
    defaultId: 0,
    cancelId: 1,
    title: 'Scan all apps?',
    message: 'Scanning all apps briefly activates each open app.',
    detail:
      'Each running app is brought to the foreground for a moment to read its menu shortcuts, then the app you were using is restored. This can be disruptive.'
  }
  const { response } = win
    ? await dialog.showMessageBox(win, options)
    : await dialog.showMessageBox(options)
  return response === 0
}

/** Registers all renderer-facing IPC handlers. */
export function registerIpc(getWindow: () => BrowserWindow | null): void {
  let activeCancel: Cancellation | null = null

  ipcMain.handle(IPC.scan, async (_event, options: ScanOptions) => {
    const provider = getProvider()
    const cancel: Cancellation = { cancelled: false }
    activeCancel = cancel

    let effectiveOptions = options
    if (options.scanAllApps) {
      const proceed = await confirmFullScan(getWindow())
      effectiveOptions = { ...options, scanAllApps: proceed }
    }

    const win = getWindow()
    const sweeping = effectiveOptions.scanAllApps
    if (sweeping && win) setScanning(win, true)

    try {
      return await runScan(
        provider,
        effectiveOptions,
        (progress) => getWindow()?.webContents.send(IPC.scanProgress, progress),
        cancel
      )
    } finally {
      if (sweeping && win) setScanning(win, false)
      activeCancel = null
    }
  })

  ipcMain.handle(IPC.cancelScan, () => {
    if (activeCancel) activeCancel.cancelled = true
  })

  ipcMain.handle(IPC.permissionStatus, () => getProvider().permissionStatus())

  ipcMain.handle(IPC.requestPermission, () => getProvider().requestPermission())

  ipcMain.handle(IPC.openExternal, (_event, url: string) => {
    if (typeof url === 'string' && ALLOWED_EXTERNAL.test(url)) {
      return shell.openExternal(url)
    }
    return undefined
  })
}
