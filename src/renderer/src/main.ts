import './styles.css'
import type { PermissionStatus, ScanResult } from '@shared/scan'
import {
  SEGMENT_LABELS,
  type Shortcut,
  type ShortcutSegment
} from '@shared/shortcuts'

const SEGMENT_ORDER: ShortcutSegment[] = ['global-os', 'global-app', 'focused-menu']

const root = document.getElementById('app')
if (!root) throw new Error('missing #app root')

root.innerHTML = `
  <header>
    <div class="titles">
      <h1>What Can't I Press</h1>
      <div class="subtitle">Reserved keyboard shortcuts</div>
    </div>
    <div class="actions">
      <button class="secondary" id="scan-all">Scan all apps</button>
      <button class="primary" id="scan">Scan</button>
      <button class="ghost" id="cancel" hidden>Cancel</button>
    </div>
  </header>
  <div class="toolbar">
    <input id="search" type="search" placeholder="Filter by combo, app, or action" autocomplete="off" spellcheck="false" />
    <div class="status" id="status"></div>
  </div>
  <div id="banner"></div>
  <main id="content">
    <div class="empty-state">
      <div class="glyph">\u2328</div>
      <div>No scan yet. Press <strong>Scan</strong> to audit reserved shortcuts.</div>
    </div>
  </main>
  <div class="toast" id="toast" hidden>Copied</div>
`

const scanButton = document.getElementById('scan') as HTMLButtonElement
const scanAllButton = document.getElementById('scan-all') as HTMLButtonElement
const cancelButton = document.getElementById('cancel') as HTMLButtonElement
const searchInput = document.getElementById('search') as HTMLInputElement
const statusEl = document.getElementById('status') as HTMLElement
const bannerEl = document.getElementById('banner') as HTMLElement
const content = document.getElementById('content') as HTMLElement
const toast = document.getElementById('toast') as HTMLElement

let lastResult: ScanResult | null = null
let scanning = false

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function setScanning(active: boolean): void {
  scanning = active
  scanButton.disabled = active
  scanAllButton.disabled = active
  cancelButton.hidden = !active
}

function matchesQuery(shortcut: Shortcut, query: string): boolean {
  if (!query) return true
  const haystack = `${shortcut.comboLabel} ${shortcut.appName ?? ''} ${shortcut.description ?? ''}`
  return haystack.toLowerCase().includes(query)
}

function badge(source: Shortcut['source']): string {
  const title =
    source === 'curated'
      ? 'Curated default — the app may have remapped this'
      : 'Detected live from this app or the OS'
  return `<span class="badge badge-${source}" title="${title}">${source}</span>`
}

function renderRow(shortcut: Shortcut): string {
  const disabled = shortcut.enabled === false ? ' <span class="off">(disabled)</span>' : ''
  const desc = shortcut.description ? escapeHtml(shortcut.description) : '<span class="dim">—</span>'
  return `
    <li class="row" data-combo="${escapeHtml(shortcut.comboLabel)}" title="Click to copy">
      <kbd>${escapeHtml(shortcut.comboLabel)}</kbd>
      <span class="desc">${desc}${disabled}</span>
      ${badge(shortcut.source)}
    </li>
  `
}

function renderAppGroup(appName: string, rows: Shortcut[]): string {
  const items = rows.map(renderRow).join('')
  return `
    <div class="app-group">
      <div class="app-name">${escapeHtml(appName)}</div>
      <ul class="rows">${items}</ul>
    </div>
  `
}

function renderSegment(segment: ShortcutSegment, shortcuts: Shortcut[]): string {
  if (shortcuts.length === 0) return ''

  const byApp = new Map<string, Shortcut[]>()
  for (const sc of shortcuts) {
    const key = sc.appName ?? 'Unknown'
    const list = byApp.get(key)
    if (list) list.push(sc)
    else byApp.set(key, [sc])
  }

  const groups = [...byApp.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([appName, rows]) => renderAppGroup(appName, rows))
    .join('')

  return `
    <section class="segment">
      <div class="segment-head">
        <h2>${escapeHtml(SEGMENT_LABELS[segment])}</h2>
        <span class="count">${shortcuts.length}</span>
      </div>
      ${groups}
    </section>
  `
}

function renderBanner(permission: PermissionStatus): void {
  if (permission.accessibility === 'denied') {
    bannerEl.innerHTML = `
      <div class="banner banner-warn">
        <div>
          <strong>Accessibility access needed</strong>
          <div class="banner-detail">${escapeHtml(permission.details ?? 'Grant access to read app menu shortcuts.')}</div>
        </div>
        <button class="secondary" id="grant">Grant access</button>
      </div>
    `
    const grant = document.getElementById('grant') as HTMLButtonElement
    grant.addEventListener('click', async () => {
      await window.shortcutApi.requestPermission()
    })
    return
  }
  bannerEl.innerHTML = ''
}

function renderResult(): void {
  if (!lastResult) return
  const query = searchInput.value.trim().toLowerCase()
  const visible = lastResult.shortcuts.filter((sc) => matchesQuery(sc, query))

  renderBanner(lastResult.permission)

  if (lastResult.shortcuts.length === 0) {
    content.innerHTML = `<div class="empty-state"><div>No reserved shortcuts found.</div></div>`
    return
  }
  if (visible.length === 0) {
    content.innerHTML = `<div class="empty-state"><div>No shortcuts match \u201c${escapeHtml(query)}\u201d.</div></div>`
    return
  }

  const sections = SEGMENT_ORDER.map((segment) =>
    renderSegment(
      segment,
      visible.filter((sc) => sc.segment === segment)
    )
  ).join('')

  const notes = lastResult.notes.length
    ? `<details class="notes"><summary>${lastResult.notes.length} note(s)</summary><ul>${lastResult.notes
        .map((n) => `<li>${escapeHtml(n)}</li>`)
        .join('')}</ul></details>`
    : ''

  content.innerHTML = sections + notes
}

function showToast(): void {
  toast.hidden = false
  toast.classList.add('show')
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => (toast.hidden = true), 200)
  }, 900)
}

async function runScan(scanAllApps: boolean): Promise<void> {
  if (scanning) return
  setScanning(true)
  statusEl.textContent = 'Starting\u2026'
  try {
    lastResult = await window.shortcutApi.scan({ scanAllApps })
    renderResult()
  } finally {
    setScanning(false)
    statusEl.textContent = lastResult
      ? `${lastResult.shortcuts.length} shortcuts \u00b7 ${lastResult.appsScanned} app(s)`
      : ''
  }
}

window.shortcutApi.onScanProgress((progress) => {
  if (progress.phase === 'apps' && progress.total) {
    statusEl.textContent = `Reading ${progress.appName ?? 'app'} (${progress.current}/${progress.total})\u2026`
  } else if (progress.phase === 'os') {
    statusEl.textContent = 'Reading system shortcuts\u2026'
  } else if (progress.phase === 'curated') {
    statusEl.textContent = 'Matching known apps\u2026'
  } else if (progress.phase === 'aggregating') {
    statusEl.textContent = 'Aggregating\u2026'
  }
})

scanButton.addEventListener('click', () => void runScan(false))
scanAllButton.addEventListener('click', () => void runScan(true))
cancelButton.addEventListener('click', () => void window.shortcutApi.cancelScan())
searchInput.addEventListener('input', renderResult)

content.addEventListener('click', (event) => {
  const row = (event.target as HTMLElement).closest('.row') as HTMLElement | null
  if (!row) return
  const combo = row.dataset.combo
  if (!combo) return
  void navigator.clipboard.writeText(combo).then(showToast)
})
