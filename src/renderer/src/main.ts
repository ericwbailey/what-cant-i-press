import './styles.css'
import type { ScanResult } from '@shared/scan'

const root = document.getElementById('app')
if (!root) throw new Error('missing #app root')

root.innerHTML = `
  <header>
    <div>
      <h1>What Can't I Press</h1>
      <div class="subtitle">Reserved keyboard shortcuts</div>
    </div>
    <button class="primary" id="scan">Scan</button>
  </header>
  <main id="content">
    <div class="empty-state">
      <div class="glyph">\u2328</div>
      <div>No scan yet. Press <strong>Scan</strong> to audit reserved shortcuts.</div>
    </div>
  </main>
`

const scanButton = document.getElementById('scan') as HTMLButtonElement
const content = document.getElementById('content') as HTMLElement

function renderResult(result: ScanResult): void {
  const notes = result.notes.length
    ? `<ul>${result.notes.map((n) => `<li>${n}</li>`).join('')}</ul>`
    : ''
  content.innerHTML = `
    <p>${result.shortcuts.length} reserved shortcut(s) across ${result.appsScanned} app(s).</p>
    <p>Accessibility: ${result.permission.accessibility}</p>
    ${notes}
  `
}

window.shortcutApi.onScanProgress((progress) => {
  scanButton.textContent = progress.phase === 'done' ? 'Scan' : 'Scanning\u2026'
})

scanButton.addEventListener('click', async () => {
  scanButton.disabled = true
  scanButton.textContent = 'Scanning\u2026'
  try {
    const result = await window.shortcutApi.scan({ scanAllApps: false })
    renderResult(result)
  } finally {
    scanButton.disabled = false
    scanButton.textContent = 'Scan'
  }
})
