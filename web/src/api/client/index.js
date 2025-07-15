import { AuthService } from '../services/auth.js'
import { HostService } from '../services/hosts.js'
import { SettingsService } from '../services/settings.js'

export class ApiClient {
  constructor() {
    this.auth = new AuthService()
    this.hosts = new HostService()
    this.settings = new SettingsService()
  }

  setSessionToken(token) {
    this.auth.sessionToken = token
    this.hosts.sessionToken = token
    this.settings.sessionToken = token
  }

  clearSession() {
    this.setSessionToken(null)
    localStorage.removeItem('sessionToken')
    localStorage.removeItem('username')
  }

  async login(username, password) {
    const response = await this.auth.login(username, password)
    if (response.success && response.token) {
      this.setSessionToken(response.token)
    }
    return response
  }

  async logout() {
    const response = await this.auth.logout()
    this.clearSession()
    return response
  }
}
