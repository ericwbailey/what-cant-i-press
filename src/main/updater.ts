import { app, dialog, shell } from 'electron'
import { autoUpdater } from 'electron-updater'

/** Where macOS users (and any unpackaged build) are sent to fetch updates manually. */
const RELEASES_URL = 'https://github.com/ericwbailey/what-cant-i-press/releases/latest'

/** Background re-check cadence for platforms that support in-app updates. */
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

let wired = false
let manualCheckInFlight = false

/**
 * In-app auto-update is only viable where the updater can verify and swap the
 * app without a code signature. Squirrel.Mac rejects unsigned updates, so the
 * macOS build cannot auto-update until it is signed and notarized; NSIS on
 * Windows updates unsigned. Until macOS signing lands, macOS falls back to
 * opening the Releases page for a manual download.
 */
function usesInAppUpdater(): boolean {
  return app.isPackaged && process.platform === 'win32'
}

/** Attaches the shared updater event listeners exactly once. */
function wireListeners(): void {
  if (wired) return
  wired = true

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-not-available', () => {
    if (!manualCheckInFlight) return
    manualCheckInFlight = false
    void dialog.showMessageBox({
      type: 'info',
      message: "What Can't I Press is up to date.",
      detail: `Version ${app.getVersion()} is the latest release.`,
      buttons: ['OK']
    })
  })

  autoUpdater.on('update-available', () => {
    if (!manualCheckInFlight) return
    manualCheckInFlight = false
    void dialog.showMessageBox({
      type: 'info',
      message: 'An update is available.',
      detail: 'It is downloading in the background. You will be prompted to restart when it is ready.',
      buttons: ['OK']
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    void dialog
      .showMessageBox({
        type: 'info',
        message: 'Update ready to install.',
        detail: `Version ${info.version} has been downloaded. Restart to finish installing.`,
        buttons: ['Restart now', 'Later'],
        defaultId: 0,
        cancelId: 1
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      })
  })

  autoUpdater.on('error', (err) => {
    // Background failures stay silent; a manual check surfaces the error.
    if (!manualCheckInFlight) {
      console.error('[updater]', err)
      return
    }
    manualCheckInFlight = false
    void dialog.showMessageBox({
      type: 'error',
      message: 'Update check failed.',
      detail: String(err instanceof Error ? err.message : err),
      buttons: ['OK']
    })
  })
}

/**
 * Starts background update checks on platforms that support in-app updates.
 * No-op in development and on macOS (see {@link usesInAppUpdater}).
 */
export function initAutoUpdater(): void {
  if (!usesInAppUpdater()) return
  wireListeners()
  void autoUpdater.checkForUpdates().catch((err) => console.error('[updater]', err))
  setInterval(() => {
    void autoUpdater.checkForUpdates().catch((err) => console.error('[updater]', err))
  }, CHECK_INTERVAL_MS)
}

/**
 * Runs a user-initiated update check. On platforms with in-app updates this
 * reports the result via a dialog; otherwise (macOS, or any unpackaged build)
 * it opens the Releases page for a manual download.
 */
export function checkForUpdatesManually(): void {
  if (!usesInAppUpdater()) {
    void shell.openExternal(RELEASES_URL)
    return
  }
  wireListeners()
  manualCheckInFlight = true
  void autoUpdater.checkForUpdates().catch((err) => {
    manualCheckInFlight = false
    void dialog.showMessageBox({
      type: 'error',
      message: 'Update check failed.',
      detail: String(err instanceof Error ? err.message : err),
      buttons: ['OK']
    })
  })
}
