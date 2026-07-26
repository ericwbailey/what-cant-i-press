import { execFile } from 'node:child_process'

// The taskbar (and therefore the tray/notification area) follows Windows' "system"
// theme, stored as SystemUsesLightTheme. This is separate from the "app" theme
// (AppsUseLightTheme) that Electron's nativeTheme.shouldUseDarkColors reports, so
// the registry value is read directly. 0 = dark taskbar, 1 (or absent) = light.
const PERSONALIZE_KEY =
  'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize'

/**
 * Resolves whether the Windows taskbar is in dark mode by reading the
 * SystemUsesLightTheme registry value. Resolves `false` (treat the taskbar as
 * light) on any error, if the value is missing, or off Windows — matching the
 * Windows default when the key is absent.
 */
export function isTaskbarDark(): Promise<boolean> {
  if (process.platform !== 'win32') return Promise.resolve(false)
  return new Promise((resolve) => {
    execFile(
      'reg',
      ['query', PERSONALIZE_KEY, '/v', 'SystemUsesLightTheme'],
      { timeout: 2000, windowsHide: true },
      (err, stdout) => {
        if (err) {
          resolve(false)
          return
        }
        const match = /SystemUsesLightTheme\s+REG_DWORD\s+0x([0-9a-fA-F]+)/.exec(stdout)
        resolve(match ? parseInt(match[1], 16) === 0 : false)
      }
    )
  })
}
