import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC, type ShortcutApi } from '@shared/ipc'
import type { ScanProgress } from '@shared/scan'

const api: ShortcutApi = {
  scan: (options) => ipcRenderer.invoke(IPC.scan, options),
  cancelScan: () => ipcRenderer.invoke(IPC.cancelScan),
  onScanProgress: (callback) => {
    const listener = (_event: IpcRendererEvent, progress: ScanProgress): void =>
      callback(progress)
    ipcRenderer.on(IPC.scanProgress, listener)
    return () => ipcRenderer.removeListener(IPC.scanProgress, listener)
  },
  getPermissionStatus: () => ipcRenderer.invoke(IPC.permissionStatus),
  requestPermission: () => ipcRenderer.invoke(IPC.requestPermission),
  openExternal: (url) => ipcRenderer.invoke(IPC.openExternal, url)
}

contextBridge.exposeInMainWorld('shortcutApi', api)
