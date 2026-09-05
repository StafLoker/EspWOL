import { api } from '../api.js'
import { esc, isValidIp, icon, setFieldError, validateFields } from '../util.js'
import { toast } from '../components/toast'
import { openModal } from '../components/modal'

// value is milliseconds
const PING_PERIODS = [
  { value: 0, label: 'Disabled' },
  { value: 60000, label: '1 minute' },
  { value: 300000, label: '5 minutes' },
  { value: 600000, label: '10 minutes' },
  { value: 900000, label: '15 minutes' },
  { value: 1800000, label: '30 minutes' },
  { value: 2700000, label: '45 minutes' },
  { value: 3600000, label: '1 hour' },
  { value: 10800000, label: '3 hours' },
  { value: 21600000, label: '6 hours' },
  { value: 43200000, label: '12 hours' },
  { value: 86400000, label: '24 hours' },
]

const NET_FIELDS = [
  ['ip', 'IP address', '192.168.1.100'],
  ['networkMask', 'Network mask', '255.255.255.0'],
  ['gateway', 'Gateway', '192.168.1.1'],
  ['dns', 'DNS', '8.8.8.8'],
]

const REPO_URL = 'https://github.com/StafLoker/EspWOL'

const TABS = [
  ['general', 'General'],
  ['network', 'Network'],
  ['hosts', 'Hosts'],
  ['system', 'System'],
]

/**
 * Splits one CSV line into its fields, unquoted and trimmed, honouring quoted
 * fields. A host name may contain commas and quotes, so a plain split(',')
 * would shift every later column.
 */
function splitCsvLine(line) {
  const vals = []
  let field = ''
  let quoted = false
  let i = 0

  while (i < line.length) {
    const c = line[i]
    if (quoted && c === '"' && line[i + 1] === '"') {
      field += '"' // an escaped quote inside a quoted field
      i++
    } else if (c === '"') {
      quoted = !quoted
    } else if (c === ',' && !quoted) {
      vals.push(field.trim())
      field = ''
    } else {
      field += c
    }
    i++
  }
  vals.push(field.trim())
  return vals
}

/**
 * Parses an exported host CSV, dropping entries missing a name, MAC or IP.
 *
 * v3 headers: name,mac,ip,autoWake (autoWake: "true"/"1").
 * v2 headers: Name, MAC Address, IP Address, Periodic ping — the last one is a
 * seconds interval, where any non-zero value means auto-wake was on.
 */
function parseCsv(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase())

  return lines
    .slice(1)
    .map((line) => {
      const vals = splitCsvLine(line)
      const h = {}
      headers.forEach((k, i) => {
        if (k === 'name') h.name = vals[i]
        else if (k === 'mac' || k === 'mac address') h.mac = (vals[i] || '').toUpperCase()
        else if (k === 'ip' || k === 'ip address') h.ip = vals[i]
        else if (k === 'autowake' || k === 'auto_wake')
          h.autoWake = vals[i]?.toLowerCase() === 'true' || vals[i] === '1'
        else if (k === 'periodic ping') h.autoWake = Number(vals[i]) > 0
      })
      return h
    })
    .filter((h) => h.name && h.mac && h.ip)
}

/**
 * Renders hosts as CSV, quoting every text field and doubling any quote inside
 * it, so the result survives a round trip through parseCsv.
 */
function toCsv(hosts) {
  const quote = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

  return [
    'name,mac,ip,autoWake',
    ...hosts.map(
      (h) =>
        `${quote(h.name)},${quote(h.mac)},${quote(h.ip)},${h.autoWake ? 'true' : 'false'}`,
    ),
  ].join('\n')
}

let s = {
  tab: 'general',
  about: { version: '', hostname: '' },
  pingPeriod: 60000,
  net: { enable: false, ip: '', networkMask: '', gateway: '', dns: '' },
  hosts: [],
  loading: true,
}

export function renderSettings() {
  const tabs = TABS.map(
    ([k, label]) =>
      `<button data-tab="${k}" role="tab" aria-selected="${s.tab === k}"
        class="tab ${s.tab === k ? 'tab-active' : ''}">${label}</button>`,
  ).join('')

  return `
    <h1 class="sr-only">Settings</h1>
    <div class="subtabs">
      <nav class="tabs" role="tablist" aria-label="Settings sections">${tabs}</nav>
    </div>
    <div id="s-body" role="tabpanel"></div>`
}

function generalTab() {
  const opts = PING_PERIODS.map(
    (p) =>
      `<option value="${p.value}" ${p.value === s.pingPeriod ? 'selected' : ''}>${p.label}</option>`,
  ).join('')

  return `
    <div class="panel divide-rows">
      <div class="row">
        <label for="ping-period">
          <span class="row-label">Ping interval</span>
          <span class="hint">How often every host is checked.</span>
        </label>
        <select id="ping-period" class="input input-narrow">${opts}</select>
      </div>
      <div class="row">
        <div>
          <p class="row-label">Reset Wi-Fi</p>
          <p class="hint">Reboots into the setup portal.</p>
        </div>
        <button id="reset-wifi" class="btn-secondary">Reset</button>
      </div>
    </div>`
}

function networkTab() {
  const fields = NET_FIELDS.map(
    ([k, label, ph]) => `
      <div class="field">
        <label class="label" for="net-${k}">${label}</label>
        <input id="net-${k}" data-net="${k}" class="input input-mono" placeholder="${ph}"
          value="${esc(s.net[k] || '')}" aria-describedby="err-net-${k}"
          ${s.net.enable ? '' : 'disabled'} />
        <p id="err-net-${k}" class="error field-error" role="alert"></p>
      </div>`,
  ).join('')

  // Radios rather than buttons: grouping and arrow-key navigation come for free.
  const modes = [
    ['dhcp', 'DHCP', false],
    ['static', 'Static', true],
  ]
    .map(
      ([id, label, enable]) => `
        <input type="radio" name="net-mode" id="net-mode-${id}" class="segment-input"
          value="${id}" ${s.net.enable === enable ? 'checked' : ''} />
        <label for="net-mode-${id}" class="segment">${label}</label>`,
    )
    .join('')

  return `
    <div class="panel divide-rows">
      <div class="row">
        <div>
          <p class="row-label">Network mode</p>
          <p class="hint">How the device gets its address.</p>
        </div>
        <div class="segmented" role="group" aria-label="Network mode">${modes}</div>
      </div>
      <div class="net-fields">
        <div class="field-grid">${fields}</div>
      </div>
    </div>
    <div class="panel-footer">
      <p class="hint">Saving reboots the device.</p>
      <button id="save-net" class="btn-primary">Save</button>
    </div>`
}

function hostsTab() {
  return `
    <div class="panel divide-rows">
      <div class="row row-stack">
        <div>
          <p class="row-label">Import</p>
          <p class="hint">CSV export file, from EspWOL v2 or v3.</p>
        </div>
        <div class="row-controls">
          <input id="file" type="file" accept=".csv" class="hidden" />
          <button id="pick" class="btn-secondary btn-file">
            <span id="pick-label">Choose file</span>
          </button>
          <button id="import" class="btn-primary" disabled>Import</button>
        </div>
      </div>
      <div class="row">
        <div>
          <p class="row-label">Export</p>
          <p class="hint">${s.hosts.length} host${s.hosts.length === 1 ? '' : 's'} as CSV.</p>
        </div>
        <button id="export" class="btn-secondary" ${s.hosts.length ? '' : 'disabled'}>Export</button>
      </div>
    </div>`
}

function systemTab() {
  return `
    <div class="panel divide-rows">
      <div class="row">
        <p class="row-label">Version</p>
        <span class="badge">${esc(s.about.version || '—')}</span>
      </div>
      <div class="row">
        <p class="row-label">Hostname</p>
        <span class="badge">${esc(s.about.hostname || '—')}</span>
      </div>
      <div class="row">
        <div>
          <p class="row-label">Firmware update</p>
          <p class="hint">Upload a new .bin over the air.</p>
        </div>
        <a href="/update" class="btn-secondary">Open updater</a>
      </div>
      <div class="row">
        <div>
          <p class="row-label">Project</p>
          <p class="hint">Source code, releases and issues.</p>
        </div>
        <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer" class="btn-secondary">
          GitHub
          ${icon('open_in_new')}
          <span class="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </div>`
}

const TAB_BODIES = {
  general: generalTab,
  network: networkTab,
  hosts: hostsTab,
  system: systemTab,
}

function repaint() {
  const b = document.getElementById('s-body')
  if (!b) return
  b.innerHTML = s.loading
    ? `<div class="panel skeleton skeleton-tall"></div>`
    : TAB_BODIES[s.tab]()
  if (!s.loading) bind()
}

function bindTabs() {
  for (const btn of document.querySelectorAll('[data-tab]')) {
    btn.addEventListener('click', () => {
      s.tab = btn.dataset.tab
      for (const b of document.querySelectorAll('[data-tab]')) {
        const on = b.dataset.tab === s.tab
        b.classList.toggle('tab-active', on)
        b.setAttribute('aria-selected', on)
      }
      repaint()
    })
  }
}

function bind() {
  const $ = (id) => document.getElementById(id)

  $('ping-period')?.addEventListener('change', savePing)
  $('reset-wifi')?.addEventListener('click', confirmResetWiFi)

  for (const radio of document.querySelectorAll('[name="net-mode"]')) {
    radio.addEventListener('change', (e) => {
      s.net.enable = e.target.value === 'static'
      for (const i of document.querySelectorAll('[data-net]'))
        s.net[i.dataset.net] = i.value
      repaint()
    })
  }
  $('save-net')?.addEventListener('click', saveNet)

  for (const input of document.querySelectorAll('[data-net]')) {
    input.addEventListener('input', () =>
      setFieldError(input, `err-net-${input.dataset.net}`, ''),
    )
  }

  const file = $('file')
  $('pick')?.addEventListener('click', () => file.click())
  file?.addEventListener('change', () => {
    $('import').disabled = !file.files.length
    if (file.files.length) $('pick-label').textContent = file.files[0].name
  })
  $('import')?.addEventListener('click', importHosts)
  $('export')?.addEventListener('click', exportHosts)
}

async function load() {
  try {
    const [settings, hosts] = await Promise.all([api.getSettings(), api.getHosts()])
    const d = settings.data || {}
    s.about = d.about || s.about
    s.pingPeriod = d.pingPeriod ?? s.pingPeriod
    s.net = { ...s.net, ...(d.network || {}) }
    s.hosts = hosts.data || []
  } catch (e) {
    toast(e.message, false)
  } finally {
    s.loading = false
    repaint()
  }
}

async function importHosts() {
  const f = document.getElementById('file').files[0]
  if (!f) return
  try {
    const text = await f.text()
    const arr = parseCsv(text)
    if (!arr.length) throw new Error('Nothing to import.')
    const res = await api.importHosts(arr)
    toast(
      `Imported ${res.data?.imported_count ?? 0}, ignored ${res.data?.ignored_count ?? 0}`,
      res.success,
    )
    load()
  } catch (e) {
    toast(e.message, false)
  }
}

function exportHosts() {
  const url = URL.createObjectURL(new Blob([toCsv(s.hosts)], { type: 'text/csv' }))
  const a = document.createElement('a')

  a.href = url
  a.download = `espwol-hosts-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()

  // Revoking in this same task can tear the blob down before the browser has
  // started fetching it, so hand the URL back only once the click has settled.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

async function savePing() {
  const ms = Number(document.getElementById('ping-period').value)
  try {
    const res = await api.updatePingPeriod(ms)
    s.pingPeriod = res.data?.pingPeriod ?? ms
    toast('Ping interval saved')
  } catch (e) {
    toast(e.message, false)
  }
}

async function saveNet() {
  const body = { enable: document.getElementById('net-mode-static').checked }

  // On DHCP the fields only mirror what the device was handed, so send them
  // empty rather than echoing them back as if they were a static config.
  for (const [k] of NET_FIELDS) body[k] = ''
  if (body.enable) {
    for (const i of document.querySelectorAll('[data-net]'))
      body[i.dataset.net] = i.value.trim()
  }

  // Flag every bad field at once instead of one generic toast for the lot.
  const ok = validateFields(
    [...document.querySelectorAll('[data-net]')].map((input) => [
      input,
      `err-net-${input.dataset.net}`,
      body.enable && !isValidIp(body[input.dataset.net])
        ? 'Must be a valid IPv4 address.'
        : '',
    ]),
  )
  if (!ok) return

  try {
    await api.updateNetwork(body)
    toast('Saved. Device is rebooting…')
  } catch (e) {
    toast(e.message, false)
  }
}

function confirmResetWiFi() {
  const { el, close } = openModal(
    'Reset Wi-Fi',
    `<p class="dialog-text">
      The device reboots into its setup portal and disconnects from this network.
    </p>
    <div class="dialog-actions">
      <button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-danger" data-yes>Reset</button>
    </div>`,
  )

  el.querySelector('[data-yes]').addEventListener('click', async () => {
    try {
      await api.resetWiFi()
      toast('Resetting…')
    } catch (ex) {
      toast(ex.message, false)
    }
    close()
  })
}

export async function mountSettings() {
  bindTabs()
  repaint()
  await load()
}

export function unmountSettings() {
  s.loading = true
}
