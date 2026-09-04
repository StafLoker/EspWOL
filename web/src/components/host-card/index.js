import { esc, icon } from '../../util.js'
import './style.css'

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
        <div class="host-card-top">
          <button type="button" data-act="wake"
            class="status-indicator ${online ? 'status-online' : 'status-offline'} ${glow}"
            aria-label="Wake ${name}">
            ${icon('power_settings_new')}
          </button>
          <div class="host-card-info">
            <h3>${name}</h3>
            <p class="host-ip">${ip}</p>
            <p class="host-mac">${mac}</p>
            <p class="sr-only">Status: ${online ? 'online' : 'offline'}</p>
          </div>
        </div>
        <div class="host-card-actions">
          <button data-act="ping" class="action-button" aria-label="Ping ${name}" ${pinging ? 'disabled' : ''}>
            ${icon('network_ping', pinging ? 'is-pinging' : '')}
          </button>
          <button data-act="edit" class="action-button" aria-label="Edit ${name}">
            ${icon('edit')}
          </button>
          <button data-act="delete" class="action-button action-button-danger" aria-label="Delete ${name}">
            ${icon('delete')}
          </button>
        </div>
      </article>`

    for (const btn of this.querySelectorAll('[data-act]')) {
      btn.addEventListener('click', () => this.emit(btn.dataset.act))
    }
  }
}

customElements.define('host-card', HostCard)
