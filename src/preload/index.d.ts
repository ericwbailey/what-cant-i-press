import type { ShortcutApi } from '@shared/ipc'

declare global {
  interface Window {
    shortcutApi: ShortcutApi
  }
}

export {}
