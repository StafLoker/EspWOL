import { api } from '../api.js'
import { esc, toast, isValidIp, openModal } from '../util.js'

const MAX_HOST_NAME_LENGTH = 32

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
  ping: {}, // id -> 'ok' | 'fail' | 'pending'
}
let refreshTimer = null

export function renderHome() {
  return `
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-baseline gap-3">
        <h1 class="text-xl font-semibold tracking-tight">Hosts</h1>
        <span id="count" class="text-sm text-fg-subtle"></span>
      </div>
      <div class="flex gap-2">
        <div class="relative flex-1 sm:flex-none">
          <i class="material-symbols-outlined input-icon" aria-hidden="true">search</i>
          <input id="search" type="search" aria-label="Search hosts" placeholder="Search"
            value="${esc(state.search)}" class="input input-search w-full sm:w-56" />
        </div>
        <button id="add" class="btn-primary shrink-0">
          <i class="material-symbols-outlined text-lg" aria-hidden="true">add</i> Add
        </button>
      </div>
    </div>
    <div id="list" aria-busy="true"></div>`
}

function listHtml() {
  if (state.loading)
    return `<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      ${'<div class="host-card h-[132px] animate-pulse opacity-50"></div>'.repeat(3)}
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
    return `<p class="panel px-6 py-16 text-center text-sm text-fg-muted">
      ${state.search ? `No hosts match “${esc(state.search)}”.` : 'No hosts yet.'}
    </p>`

  return `
    <ul class="grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
      ${hosts
        .map((h) => {
          const pr = state.ping[h.id]
          return `<li><host-card data-id="${h.id}"
            name="${esc(h.name)}" ip="${esc(h.ip)}" mac="${esc(h.mac)}"
            online="${h.status ? '1' : '0'}"
            pinging="${pr === 'pending' ? '1' : '0'}"
            ping-result="${pr === 'ok' || pr === 'fail' ? pr : ''}"></host-card></li>`
        })
        .join('')}
    </ul>`
}

function paint() {
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
    card.addEventListener('wake', () => wake(id))
    card.addEventListener('ping', () => ping(id))
    card.addEventListener('edit', () => openDialog(host()))
    card.addEventListener('delete', () => confirmDelete(host()))
  }
}

async function load() {
  try {
    const res = await api.getHosts()
    state.hosts = res.data || []
    const m = res.metadata || {}
    state.limits = {
      current: m.hosts?.count ?? state.hosts.length,
      max: m.hosts?.maxAllowed ?? 0,
      canAddMore: m.canAddMoreHosts ?? true,
    }
  } catch (e) {
    toast(e.message, false)
  } finally {
    state.loading = false
    paint()
  }
}

async function wake(id) {
  try {
    await api.wakeHost(id)
    toast('Magic packet sent')
    const h = state.hosts.find((x) => x.id === id)
    if (h) h.status = true
    paint()
  } catch (e) {
    toast(e.message, false)
  }
}

async function ping(id) {
  state.ping[id] = 'pending'
  paint()
  try {
    const res = await api.pingHost(id)
    state.ping[id] = res.success ? 'ok' : 'fail'
    const h = state.hosts.find((x) => x.id === id)
    if (h) h.status = res.success
    toast(res.success ? 'Host is online' : 'Host is offline', res.success)
  } catch {
    state.ping[id] = 'fail'
  }
  paint()
  setTimeout(() => {
    delete state.ping[id]
    paint()
  }, 2500)
}

function openDialog(host) {
  const isEdit = !!host
  const { el, close } = openModal(
    isEdit ? 'Edit host' : 'Add host',
    `<form class="mt-5 space-y-4" novalidate>
      <div class="field">
        <label class="label" for="f-name">Name</label>
        <input id="f-name" name="name" class="input" maxlength="${MAX_HOST_NAME_LENGTH}" required
          placeholder="Living room NAS" value="${esc(host?.name ?? '')}" />
      </div>
      <div class="field">
        <label class="label" for="f-mac">MAC address</label>
        <input id="f-mac" name="mac" class="input font-mono" maxlength="17" required
          placeholder="AA:BB:CC:DD:EE:FF" value="${esc(host?.mac ?? '')}" />
      </div>
      <div class="field">
        <label class="label" for="f-ip">IP address</label>
        <input id="f-ip" name="ip" class="input font-mono" required
          placeholder="192.168.1.10" value="${esc(host?.ip ?? '')}" />
      </div>
      <div class="flex items-center justify-between gap-4">
        <label class="label" for="f-wake">
          Auto wake
          <span class="mt-0.5 block hint font-normal">Send a magic packet when the host goes offline.</span>
        </label>
        <input id="f-wake" name="autoWake" type="checkbox" class="switch" ${host?.autoWake ? 'checked' : ''} />
      </div>
      <p class="err error" role="alert"></p>
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn-ghost" data-close>Cancel</button>
        <button type="submit" class="btn-primary">${isEdit ? 'Save' : 'Add host'}</button>
      </div>
    </form>`,
  )

  const form = el.querySelector('form')
  form.mac.addEventListener('input', () => {
    form.mac.value = formatMac(form.mac.value)
  })
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const err = el.querySelector('.err')
    const data = {
      name: form.name.value.trim(),
      mac: form.mac.value,
      ip: form.ip.value.trim(),
      autoWake: form.autoWake.checked,
    }
    if (!data.name) return (err.textContent = 'Name is required.')
    if (!isValidMac(data.mac)) return (err.textContent = 'Invalid MAC address.')
    if (!isValidIp(data.ip)) return (err.textContent = 'Invalid IP address.')
    try {
      if (isEdit) await api.updateHost(host.id, data)
      else await api.addHost(data)
      close()
      toast(isEdit ? 'Host updated' : 'Host added')
      load()
    } catch (ex) {
      err.textContent = ex.message
    }
  })
}

function confirmDelete(host) {
  if (!host) return
  const { el, close } = openModal(
    'Delete host',
    `<p class="mt-2 text-sm text-fg-muted">
      <span class="text-fg">${esc(host.name)}</span> will be removed. This cannot be undone.
    </p>
    <div class="mt-5 flex justify-end gap-2">
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
}
