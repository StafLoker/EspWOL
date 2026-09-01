import { api } from '../api.js'
import { esc, toast, isValidIp, openModal } from '../util.js'

// value is milliseconds (what /settings reports); the API takes seconds on write.
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

const TABS = [
  ['general', 'General'],
  ['network', 'Network'],
  ['hosts', 'Hosts'],
  ['system', 'System'],
]

function parseCsv(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  return lines
    .slice(1)
    .map((line) => {
      const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
      const h = {}
      headers.forEach((k, i) => {
        if (k === 'name') h.name = vals[i]
        else if (k === 'mac') h.mac = (vals[i] || '').toUpperCase()
        else if (k === 'ip') h.ip = vals[i]
        else if (k === 'autowake' || k === 'auto_wake')
          h.autoWake = vals[i]?.toLowerCase() === 'true' || vals[i] === '1'
      })
      return h
    })
    .filter((h) => h.name && h.mac && h.ip)
}

function toCsv(hosts) {
  return [
    'name,mac,ip,autoWake',
    ...hosts.map(
      (h) => `"${h.name}","${h.mac}","${h.ip}",${h.autoWake ? 'true' : 'false'}`,
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
    <div class="-mt-4 border-b border-border">
      <nav class="flex gap-6" role="tablist" aria-label="Settings sections">${tabs}</nav>
    </div>
    <div id="s-body" role="tabpanel" class="pt-8"></div>`
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
          <span class="text-sm font-medium">Ping interval</span>
          <span class="hint mt-0.5 block">How often every host is checked.</span>
        </label>
        <select id="ping-period" class="input w-40">${opts}</select>
      </div>
      <div class="row">
        <div>
          <p class="text-sm font-medium">Reset Wi-Fi</p>
          <p class="hint mt-0.5">Reboots into the setup portal.</p>
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
        <input id="net-${k}" data-net="${k}" class="input font-mono" placeholder="${ph}"
          value="${esc(s.net[k] || '')}" />
      </div>`,
  ).join('')

  return `
    <div class="panel divide-rows">
      <div class="row">
        <label for="net-enable">
          <span class="text-sm font-medium">Static IP</span>
          <span class="hint mt-0.5 block">Off means DHCP.</span>
        </label>
        <input id="net-enable" type="checkbox" class="switch" ${s.net.enable ? 'checked' : ''} />
      </div>
      <div class="${s.net.enable ? '' : 'hidden'} p-4">
        <div class="grid gap-4 sm:grid-cols-2">${fields}</div>
      </div>
    </div>
    <div class="mt-4 flex items-center justify-between gap-4">
      <p class="hint">Saving reboots the device.</p>
      <button id="save-net" class="btn-primary">Save</button>
    </div>`
}

function hostsTab() {
  return `
    <div class="panel divide-rows">
      <div class="row flex-col items-start sm:flex-row sm:items-center">
        <div>
          <p class="text-sm font-medium">Import</p>
          <p class="hint mt-0.5">CSV (name,mac,ip,autoWake) or JSON array.</p>
        </div>
        <div class="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          <input id="file" type="file" accept=".csv,.json" class="hidden" />
          <button id="pick" class="btn-secondary min-w-0 flex-1 sm:flex-none">
            <span id="pick-label" class="truncate">Choose file</span>
          </button>
          <button id="import" class="btn-primary shrink-0" disabled>Import</button>
        </div>
      </div>
      <div class="row">
        <div>
          <p class="text-sm font-medium">Export</p>
          <p class="hint mt-0.5">${s.hosts.length} host${s.hosts.length === 1 ? '' : 's'} as CSV.</p>
        </div>
        <button id="export" class="btn-secondary" ${s.hosts.length ? '' : 'disabled'}>Export</button>
      </div>
    </div>`
}

function systemTab() {
  return `
    <div class="panel divide-rows">
      <div class="row">
        <p class="text-sm font-medium">Version</p>
        <span class="badge">${esc(s.about.version || '—')}</span>
      </div>
      <div class="row">
        <p class="text-sm font-medium">Hostname</p>
        <span class="badge">${esc(s.about.hostname || '—')}</span>
      </div>
      <div class="row">
        <div>
          <p class="text-sm font-medium">Firmware update</p>
          <p class="hint mt-0.5">Upload a new .bin over the air.</p>
        </div>
        <a href="/update" class="btn-secondary">Open updater</a>
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
    ? `<div class="panel h-40 animate-pulse opacity-50"></div>`
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

  $('net-enable')?.addEventListener('change', (e) => {
    s.net.enable = e.target.checked
    for (const i of document.querySelectorAll('[data-net]'))
      s.net[i.dataset.net] = i.value
    repaint()
  })
  $('save-net')?.addEventListener('click', saveNet)

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
    const arr = f.name.endsWith('.json') ? JSON.parse(text) : parseCsv(text)
    if (!Array.isArray(arr) || !arr.length) throw new Error('Nothing to import.')
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
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([toCsv(s.hosts)], { type: 'text/csv' }))
  a.download = `espwol-hosts-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function savePing() {
  const ms = Number(document.getElementById('ping-period').value)
  try {
    await api.updatePingPeriod(ms / 1000)
    s.pingPeriod = ms
    toast('Ping interval saved')
  } catch (e) {
    toast(e.message, false)
  }
}

async function saveNet() {
  const body = { enable: document.getElementById('net-enable').checked }
  for (const [k] of NET_FIELDS) body[k] = ''
  for (const i of document.querySelectorAll('[data-net]'))
    body[i.dataset.net] = i.value.trim()

  if (body.enable && !NET_FIELDS.every(([k]) => isValidIp(body[k])))
    return toast('All network fields must be valid IPv4.', false)

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
    `<p class="mt-2 text-sm text-fg-muted">
      The device reboots into its setup portal and disconnects from this network.
    </p>
    <div class="mt-5 flex justify-end gap-2">
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
