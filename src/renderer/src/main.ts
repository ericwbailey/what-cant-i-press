import './styles.css'
import type { PermissionStatus, ScanResult } from '@shared/scan'
import {
  SEGMENT_LABELS,
  type Modifier,
  type Platform,
  type Shortcut,
  type ShortcutSegment
} from '@shared/shortcuts'

const SEGMENT_ORDER: ShortcutSegment[] = ['global-os', 'global-app', 'focused-menu']

const MOD_FULL_MAC: Record<Modifier, string> = {
  function: 'Function',
  control: 'Control',
  option: 'Option',
  shift: 'Shift',
  command: 'Command',
  super: 'Command'
}

const MOD_FULL_WIN: Record<Modifier, string> = {
  super: 'Windows',
  control: 'Control',
  option: 'Alt',
  shift: 'Shift',
  function: 'Fn',
  command: 'Command'
}

const KEY_FULL: Record<string, string> = {
  Space: 'Space',
  Tab: 'Tab',
  Return: 'Return',
  Enter: 'Enter',
  Escape: 'Escape',
  Delete: 'Delete',
  ForwardDelete: 'Forward Delete',
  Left: 'Left Arrow',
  Right: 'Right Arrow',
  Up: 'Up Arrow',
  Down: 'Down Arrow',
  Home: 'Home',
  End: 'End',
  PageUp: 'Page Up',
  PageDown: 'Page Down',
  Clear: 'Clear'
}

function fullComboName(shortcut: Shortcut, platform: Platform): string {
  const map = platform === 'darwin' ? MOD_FULL_MAC : MOD_FULL_WIN
  const mods = shortcut.modifiers.map((m) => map[m])
  const key = KEY_FULL[shortcut.key] ?? shortcut.key
  return [...mods, key].join(' + ')
}

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
      <button class="primary" id="scan">Scan current app</button>
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
  <footer>
    <button class="secondary" id="export" hidden disabled>Export JSON</button>
    <button class="ghost" id="quit" data-tip="Quit What Can't I Press">Quit</button>
  </footer>
  <div class="toast" id="toast" hidden>Copied</div>
  <div class="tip" id="tip" role="tooltip" hidden></div>
`

const scanButton = document.getElementById('scan') as HTMLButtonElement
const scanAllButton = document.getElementById('scan-all') as HTMLButtonElement
const cancelButton = document.getElementById('cancel') as HTMLButtonElement
const quitButton = document.getElementById('quit') as HTMLButtonElement
const exportButton = document.getElementById('export') as HTMLButtonElement
const searchInput = document.getElementById('search') as HTMLInputElement
const statusEl = document.getElementById('status') as HTMLElement
const bannerEl = document.getElementById('banner') as HTMLElement
const content = document.getElementById('content') as HTMLElement
const toast = document.getElementById('toast') as HTMLElement
const tip = document.getElementById('tip') as HTMLElement

let lastResult: ScanResult | null = null
let scanning = false
const collapsedSegments = new Set<ShortcutSegment>()
let tipTarget: HTMLElement | null = null

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function hasExportable(): boolean {
  return !!lastResult && lastResult.shortcuts.length > 0
}

function setScanning(active: boolean): void {
  scanning = active
  scanButton.disabled = active
  scanAllButton.disabled = active
  cancelButton.hidden = !active
  exportButton.hidden = !lastResult
  exportButton.disabled = active || !hasExportable()
}

function matchesQuery(shortcut: Shortcut, query: string): boolean {
  if (!query) return true
  const haystack = `${shortcut.comboLabel} ${shortcut.appName ?? ''} ${shortcut.description ?? ''}`
  return haystack.toLowerCase().includes(query)
}

function badge(source: Shortcut['source']): string {
  const tipText =
    source === 'curated'
      ? 'Curated default — the app may have remapped this'
      : 'Detected live from this app or the OS'
  return `<span class="badge badge-${source}" data-tip="${escapeHtml(tipText)}">${source}</span>`
}

function renderRow(shortcut: Shortcut, platform: Platform): string {
  const disabled = shortcut.enabled === false ? ' <span class="off">(disabled)</span>' : ''
  const desc = shortcut.description ? escapeHtml(shortcut.description) : '<span class="dim">—</span>'
  const fullName = escapeHtml(fullComboName(shortcut, platform))
  return `
    <li class="row" data-combo="${escapeHtml(shortcut.comboLabel)}" data-tip="${fullName}">
      <kbd>${escapeHtml(shortcut.comboLabel)}</kbd>
      <span class="desc">${desc}${disabled}</span>
      ${badge(shortcut.source)}
    </li>
  `
}

function renderAppGroup(appName: string, rows: Shortcut[], platform: Platform): string {
  const items = rows.map((row) => renderRow(row, platform)).join('')
  return `
    <div class="app-group">
      <div class="app-name">${escapeHtml(appName)}</div>
      <ul class="rows">${items}</ul>
    </div>
  `
}

function renderSegment(
  segment: ShortcutSegment,
  shortcuts: Shortcut[],
  platform: Platform
): string {
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
    .map(([appName, rows]) => renderAppGroup(appName, rows, platform))
    .join('')

  const open = collapsedSegments.has(segment) ? '' : ' open'

  return `
    <details class="segment" data-segment="${segment}"${open}>
      <summary class="segment-head">
        <span class="caret" aria-hidden="true"></span>
        <h2>${escapeHtml(SEGMENT_LABELS[segment])}</h2>
        <span class="count">${shortcuts.length}</span>
      </summary>
      ${groups}
    </details>
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
  hideTip()
  const query = searchInput.value.trim().toLowerCase()
  const visible = lastResult.shortcuts.filter((sc) => matchesQuery(sc, query))
  const platform = lastResult.platform

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
      visible.filter((sc) => sc.segment === segment),
      platform
    )
  ).join('')

  const notes = lastResult.notes.length
    ? `<section class="notes"><h2>Notes</h2><ul>${lastResult.notes
        .map((n) => `<li>${escapeHtml(n)}</li>`)
        .join('')}</ul></section>`
    : ''

  content.innerHTML = sections + notes
}

function showToast(message = 'Copied'): void {
  toast.textContent = message
  toast.hidden = false
  toast.classList.add('show')
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => (toast.hidden = true), 200)
  }, 900)
}

function showTip(target: HTMLElement): void {
  const text = target.dataset.tip
  if (!text) return
  tipTarget = target
  tip.textContent = text
  tip.hidden = false
  const anchor = target.getBoundingClientRect()
  const box = tip.getBoundingClientRect()
  let left = anchor.left + anchor.width / 2 - box.width / 2
  left = Math.max(6, Math.min(left, window.innerWidth - box.width - 6))
  let top = anchor.top - box.height - 6
  if (top < 6) top = anchor.bottom + 6
  tip.style.left = `${left}px`
  tip.style.top = `${top}px`
  tip.classList.add('show')
}

function hideTip(): void {
  if (!tipTarget) return
  tipTarget = null
  tip.classList.remove('show')
  tip.hidden = true
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
quitButton.addEventListener('click', () => void window.shortcutApi.quit())
exportButton.addEventListener('click', () => {
  if (!hasExportable() || !lastResult) return
  void window.shortcutApi.exportJson(JSON.stringify(lastResult, null, 2)).then((saved) => {
    if (saved) showToast('Exported')
  })
})
searchInput.addEventListener('input', renderResult)

content.addEventListener(
  'toggle',
  (event) => {
    const details = event.target as HTMLElement
    if (!(details instanceof HTMLDetailsElement)) return
    const segment = details.dataset.segment as ShortcutSegment | undefined
    if (!segment) return
    if (details.open) collapsedSegments.delete(segment)
    else collapsedSegments.add(segment)
  },
  true
)

content.addEventListener('scroll', hideTip)

document.addEventListener('mouseover', (event) => {
  const target = (event.target as HTMLElement).closest('[data-tip]') as HTMLElement | null
  if (target && target !== tipTarget) showTip(target)
})

document.addEventListener('mouseout', (event) => {
  const target = (event.target as HTMLElement).closest('[data-tip]') as HTMLElement | null
  if (!target) return
  const related = event.relatedTarget as Node | null
  if (!related || !target.contains(related)) hideTip()
})

content.addEventListener('click', (event) => {
  const row = (event.target as HTMLElement).closest('.row') as HTMLElement | null
  if (!row) return
  const combo = row.dataset.combo
  if (!combo) return
  hideTip()
  void navigator.clipboard.writeText(combo).then(() => showToast())
})
