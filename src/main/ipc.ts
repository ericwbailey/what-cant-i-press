import { ipcMain, shell, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc'
import type { ScanOptions } from '@shared/scan'
import { getProvider } from './providers'
import { runScan, type Cancellation } from './core/scan-runner'

const ALLOWED_EXTERNAL = /^(https?:|x-apple\.systempreferences:|ms-settings:)/i

/** Registers all renderer-facing IPC handlers. */
export function registerIpc(getWindow: () => BrowserWindow | null): void {
  let activeCancel: Cancellation | null = null

  ipcMain.handle(IPC.scan, async (_event, options: ScanOptions) => {
    const provider = getProvider()
    const cancel: Cancellation = { cancelled: false }
    activeCancel = cancel
    try {
      return await runScan(
        provider,
        options,
        (progress) => getWindow()?.webContents.send(IPC.scanProgress, progress),
        cancel
      )
    } finally {
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
