import { api } from '../api.js'
import { esc, isValidIp, icon, setFieldError, validateFields } from '../util.js'
import { toast } from '../components/toast'
import { openModal } from '../components/modal'

const MAX_HOST_NAME_LENGTH = 32

// Minimum time the wake/ping blinking state stays on screen.
const FEEDBACK_MS = 1800

const isValidMac = (m) => /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(m)

function formatMac(value) {
  const v = value
    .replace(/[^0-9A-Fa-f]/g, '')
    .toUpperCase()
    .slice(0, 12)
  return v.match(/.{1,2}/g)?.join(':') ?? v
}

let state = {
  hosts: [],
  limits: { current: 0, max: 0, canAddMore: true },
  loading: true,
  search: '',
  ping: {}, // id -> true while a ping is in flight
  waking: {}, // id -> true while a WOL packet is in flight
}
let refreshTimer = null

export function renderHome() {
  return `
    <div class="page-head">
      <div class="page-title">
        <h1>Hosts</h1>
        <span id="count"></span>
      </div>
      <div class="page-actions">
        <div class="search">
          ${icon('search')}
          <input id="search" type="search" aria-label="Search hosts" placeholder="Search"
            value="${esc(state.search)}" class="input" />
        </div>
        <button id="add" class="btn-primary">
          ${icon('add')} Add
        </button>
      </div>
    </div>
    <div id="list" aria-busy="true"></div>`
}

function listHtml() {
  if (state.loading)
    return `<div class="host-grid">
      ${'<div class="host-card skeleton"></div>'.repeat(3)}
    </div>`

  const term = state.search.toLowerCase()
  const hosts = state.hosts.filter(
    (h) =>
      !term ||
      h.name.toLowerCase().includes(term) ||
      h.ip.includes(term) ||
      h.mac.toLowerCase().includes(term),
  )

  if (hosts.length === 0)
    return `<p class="panel empty-state">
      ${state.search ? `No hosts match “${esc(state.search)}”.` : 'No hosts yet.'}
    </p>`

  return `
    <ul class="host-grid">
      ${hosts
        .map(
          (h) => `<li><host-card data-id="${h.id}"
            name="${esc(h.name)}" ip="${esc(h.ip)}"
            online="${h.up ? '1' : '0'}"
            pinging="${state.ping[h.id] ? '1' : '0'}"
            waking="${state.waking[h.id] ? '1' : '0'}"></host-card></li>`,
        )
        .join('')}
    </ul>`
}

function paint() {
  // A wake/ping still holding its feedback delay can land here after the user
  // has navigated away, so a missing #list is expected, not an error.
  const el = document.getElementById('list')
  if (!el) return

  const count = document.getElementById('count')
  if (count)
    count.textContent = state.loading ? '' : `${state.limits.current}/${state.limits.max}`

  el.setAttribute('aria-busy', String(state.loading))
  el.innerHTML = listHtml()

  for (const card of el.querySelectorAll('host-card')) {
    const id = Number(card.dataset.id)
    const host = () => state.hosts.find((h) => h.id === id)
    card.addEventListener('wake', () => confirmWake(host()))
    card.addEventListener('ping', () => ping(id))
    card.addEventListener('edit', () => openDialog(host()))
  }
}

function applyLimits(res) {
  const m = res.metadata || {}
  state.limits = {
    current: m.hosts?.count ?? state.hosts.length,
    max: m.hosts?.maxAllowed ?? 0,
    canAddMore: m.canAddMoreHosts ?? true,
  }
}

async function load() {
  try {
    const res = await api.getHosts()
    state.hosts = res.data || []
    applyLimits(res)
  } catch (e) {
    toast(e.message, false)
  } finally {
    state.loading = false
    paint()
  }
}

function confirmWake(host) {
  if (!host) return
  if (!host.up) return wake(host.id)

  const { el, close } = openModal(
    'Send WOL packet?',
    `<p class="dialog-text">
      <strong>${esc(host.name)}</strong> already appears online. Send a magic packet anyway?
    </p>
    <div class="dialog-actions">
      <button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" data-yes>Send</button>
    </div>`,
  )
  el.querySelector('[data-yes]').addEventListener('click', () => {
    close()
    wake(host.id)
  })
}

// A request can resolve in milliseconds on a LAN, far too fast for the blinking
// state to register. Hold it until at least FEEDBACK_MS have passed.
const holdFeedback = (since) => {
  const left = FEEDBACK_MS - (Date.now() - since)
  return left > 0 ? new Promise((r) => setTimeout(r, left)) : Promise.resolve()
}

async function wake(id) {
  state.waking[id] = true
  paint()

  const started = Date.now()
  try {
    await api.wakeHost(id)
    toast('Magic packet sent')
    const h = state.hosts.find((x) => x.id === id)
    if (h) h.up = true
  } catch (e) {
    toast(e.message, false)
  }
  await holdFeedback(started)

  delete state.waking[id]
  paint()
}

async function ping(id) {
  state.ping[id] = true
  paint()

  const started = Date.now()
  try {
    const res = await api.pingHost(id)
    const h = state.hosts.find((x) => x.id === id)
    if (h) h.up = res.success
    toast(res.success ? 'Host is online' : 'Host is offline', res.success)
  } catch (e) {
    toast(e.message, false)
  }
  await holdFeedback(started)

  delete state.ping[id]
  paint()
}

function openDialog(host) {
  const isEdit = !!host
  const { el, close } = openModal(
    isEdit ? 'Edit host' : 'Add host',
    `<form class="dialog-form" novalidate>
      <div class="field">
        <label class="label" for="f-name">Name</label>
        <input id="f-name" name="name" class="input" maxlength="${MAX_HOST_NAME_LENGTH}" required
          placeholder="Living room NAS" value="${esc(host?.name ?? '')}"
          aria-describedby="e-name" />
        <p id="e-name" class="error field-error" role="alert"></p>
      </div>
      <div class="field">
        <label class="label" for="f-mac">MAC address</label>
        <input id="f-mac" name="mac" class="input input-mono" maxlength="17" required
          placeholder="AA:BB:CC:DD:EE:FF" value="${esc(host?.mac ?? '')}"
          aria-describedby="e-mac" />
        <p id="e-mac" class="error field-error" role="alert"></p>
      </div>
      <div class="field">
        <label class="label" for="f-ip">IP address</label>
        <input id="f-ip" name="ip" class="input input-mono" required
          placeholder="192.168.1.10" value="${esc(host?.ip ?? '')}"
          aria-describedby="e-ip" />
        <p id="e-ip" class="error field-error" role="alert"></p>
      </div>
      <div class="row-inline">
        <label class="label" for="f-wake">
          Auto wake
          <span class="hint">Send a magic packet when the host goes offline.</span>
        </label>
        <input id="f-wake" name="autoWake" type="checkbox" class="switch" ${host?.autoWake ? 'checked' : ''} />
      </div>
      <p class="err error" role="alert"></p>
      <div class="dialog-actions">
        ${isEdit ? '<button type="button" class="btn-danger-ghost" data-delete>Delete</button>' : ''}
        <button type="button" class="btn-ghost" data-close>Cancel</button>
        <button type="submit" class="btn-primary">${isEdit ? 'Save' : 'Add host'}</button>
      </div>
    </form>`,
  )

  if (isEdit) {
    el.querySelector('[data-delete]').addEventListener('click', () => {
      close()
      confirmDelete(host)
    })
  }

  const form = el.querySelector('form')

  // Clear a field's error as soon as it is edited. The ids are spelled out
  // rather than derived from field.name, so renaming an input cannot silently
  // stop the clearing from finding its message element.
  for (const [field, errorId] of [
    [form.name, 'e-name'],
    [form.mac, 'e-mac'],
    [form.ip, 'e-ip'],
  ]) {
    field.addEventListener('input', () => setFieldError(field, errorId, ''))
  }

  form.mac.addEventListener('input', () => {
    form.mac.value = formatMac(form.mac.value)
  })
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const err = el.querySelector('.err')
    err.textContent = ''
    const data = {
      name: form.name.value.trim(),
      mac: form.mac.value,
      ip: form.ip.value.trim(),
      autoWake: form.autoWake.checked,
    }

    // Check every field, so all the problems show at once rather than one per try.
    const ok = validateFields([
      [form.name, 'e-name', data.name ? '' : 'Name is required.'],
      [
        form.mac,
        'e-mac',
        isValidMac(data.mac) ? '' : 'Must look like AA:BB:CC:DD:EE:FF.',
      ],
      [form.ip, 'e-ip', isValidIp(data.ip) ? '' : 'Must be a valid IPv4 address.'],
    ])
    if (!ok) return

    try {
      const res = isEdit ? await api.updateHost(host.id, data) : await api.addHost(data)
      const saved = res.data
      const i = state.hosts.findIndex((x) => x.id === saved.id)
      if (i >= 0) state.hosts[i] = saved
      else state.hosts.push(saved)
      applyLimits(res)
      close()
      toast(isEdit ? 'Host updated' : 'Host added')
      paint()
    } catch (ex) {
      err.textContent = ex.message
    }
  })
}

function confirmDelete(host) {
  if (!host) return
  const { el, close } = openModal(
    'Delete host',
    `<p class="dialog-text">
      <strong>${esc(host.name)}</strong> will be removed. This cannot be undone.
    </p>
    <div class="dialog-actions">
      <button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-danger" data-yes>Delete</button>
    </div>`,
  )

  el.querySelector('[data-yes]').addEventListener('click', async () => {
    try {
      await api.deleteHost(host.id)
      toast('Host deleted')
      load()
    } catch (ex) {
      toast(ex.message, false)
    }
    close()
  })
}

export async function mountHome() {
  document.getElementById('search').addEventListener('input', (e) => {
    state.search = e.target.value
    paint()
  })
  document.getElementById('add').addEventListener('click', () => {
    if (!state.limits.canAddMore) return toast('Host limit reached', false)
    openDialog(null)
  })

  paint()
  await load()

  clearInterval(refreshTimer)
  refreshTimer = setInterval(load, 60000)
}

export function unmountHome() {
  clearInterval(refreshTimer)
  refreshTimer = null
  state.loading = true
  state.ping = {}
  state.waking = {}
}
