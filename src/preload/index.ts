import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC, type MenuCommand, type ShortcutApi } from '@shared/ipc'
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
  getReaderShortcuts: () => ipcRenderer.invoke(IPC.readerShortcuts),
  getPermissionStatus: () => ipcRenderer.invoke(IPC.permissionStatus),
  requestPermission: () => ipcRenderer.invoke(IPC.requestPermission),
  openExternal: (url) => ipcRenderer.invoke(IPC.openExternal, url),
  quit: () => ipcRenderer.invoke(IPC.quit),
  exportJson: (json, fileName) => ipcRenderer.invoke(IPC.exportJson, json, fileName),
  setAlwaysOnTop: (pinned) => ipcRenderer.invoke(IPC.setAlwaysOnTop, pinned),
  onMenuCommand: (callback) => {
    const listener = (_event: IpcRendererEvent, command: MenuCommand): void =>
      callback(command)
    ipcRenderer.on(IPC.menuCommand, listener)
    return () => ipcRenderer.removeListener(IPC.menuCommand, listener)
  }
}

contextBridge.exposeInMainWorld('shortcutApi', api)
