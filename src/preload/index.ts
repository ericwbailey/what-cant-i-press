import { contextBridge, ipcRenderer } from 'electron'

const api = {
  ping: (): Promise<string> => ipcRenderer.invoke('app:ping')
}

contextBridge.exposeInMainWorld('shortcutApi', api)
