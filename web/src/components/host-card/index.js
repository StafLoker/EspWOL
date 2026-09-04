import { esc, icon } from '../../util.js'
import './style.css'

export class HostCard extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'ip', 'online', 'pinging', 'waking']
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
    const online = this.getAttribute('online') === '1'
    const pinging = this.getAttribute('pinging') === '1'
    const waking = this.getAttribute('waking') === '1'

    this.innerHTML = `
      <article class="host-card" aria-label="${name}">
        <button type="button" data-act="wake"
          class="status-indicator ${online ? 'status-online' : 'status-offline'} ${waking ? 'is-waking' : ''}"
          title="Wake ${name}" aria-label="Wake ${name}">
          ${icon('power_settings_new')}
        </button>
        <div class="host-card-info">
          <h3>${name}</h3>
          <p class="host-ip">${ip}</p>
          <p class="sr-only">Status: ${online ? 'online' : 'offline'}</p>
        </div>
        <div class="host-card-actions">
          <button data-act="ping" class="action-button ${pinging ? 'is-pinging' : ''}"
            title="Ping ${name}" aria-label="Ping ${name}" ${pinging ? 'disabled' : ''}>
            ${icon('network_ping')}
          </button>
          <button data-act="edit" class="action-button" title="Edit ${name}" aria-label="Edit ${name}">
            ${icon('edit')}
          </button>
        </div>
      </article>`

    for (const btn of this.querySelectorAll('[data-act]')) {
      btn.addEventListener('click', () => this.emit(btn.dataset.act))
    }
  }
}

customElements.define('host-card', HostCard)
