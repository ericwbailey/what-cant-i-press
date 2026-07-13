import './styles.css'

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
  <main>
    <div class="empty-state">
      <div class="glyph">\u2328</div>
      <div>No scan yet. Press <strong>Scan</strong> to audit reserved shortcuts.</div>
    </div>
  </main>
`

const scanButton = document.getElementById('scan') as HTMLButtonElement

scanButton.addEventListener('click', async () => {
  scanButton.disabled = true
  scanButton.textContent = 'Scanning\u2026'
  try {
    // Phase 0 smoke test of the preload bridge; replaced by real scan later.
    await window.shortcutApi.ping()
  } finally {
    scanButton.disabled = false
    scanButton.textContent = 'Scan'
  }
})
