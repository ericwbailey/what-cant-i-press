export interface ShortcutApi {
  ping: () => Promise<string>
}

declare global {
  interface Window {
    shortcutApi: ShortcutApi
  }
}
