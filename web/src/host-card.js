import { esc } from './util.js'

export class HostCard extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'ip', 'mac', 'online', 'pinging', 'ping-result']
  }

  connectedCallback() {
    this.render()
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render()
  }

  emit(type) {
    this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true }))
  }

  render() {
    const name = esc(this.getAttribute('name'))
    const ip = esc(this.getAttribute('ip'))
    const mac = esc(this.getAttribute('mac'))
    const online = this.getAttribute('online') === '1'
    const pinging = this.getAttribute('pinging') === '1'
    const pr = this.getAttribute('ping-result')

    const glow = pr === 'ok' ? 'ping-success-glow' : pr === 'fail' ? 'ping-fail-glow' : ''

    this.innerHTML = `
      <article class="host-card" aria-label="${name}">
        <div class="flex items-start gap-3">
          <button type="button" data-act="wake"
            class="status-indicator ${online ? 'status-online' : 'status-offline'} ${glow}"
            aria-label="Wake ${name}">
            <i class="material-symbols-outlined text-xl" aria-hidden="true">power_settings_new</i>
          </button>
          <div class="min-w-0 flex-1">
            <h3 class="truncate font-medium">${name}</h3>
            <p class="mt-0.5 font-mono text-sm text-fg-muted">${ip}</p>
            <p class="font-mono text-xs text-fg-subtle">${mac}</p>
            <p class="sr-only">Status: ${online ? 'online' : 'offline'}</p>
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-1">
          <button data-act="ping" class="action-button" aria-label="Ping ${name}" ${pinging ? 'disabled' : ''}>
            <i class="material-symbols-outlined text-lg ${pinging ? 'animate-pulse' : ''}" aria-hidden="true">network_ping</i>
          </button>
          <button data-act="edit" class="action-button" aria-label="Edit ${name}">
            <i class="material-symbols-outlined text-lg" aria-hidden="true">edit</i>
          </button>
          <button data-act="delete" class="action-button action-button-danger" aria-label="Delete ${name}">
            <i class="material-symbols-outlined text-lg" aria-hidden="true">delete</i>
          </button>
        </div>
      </article>`

    for (const btn of this.querySelectorAll('[data-act]')) {
      btn.addEventListener('click', () => this.emit(btn.dataset.act))
    }
  }
}

customElements.define('host-card', HostCard)
