import { ApiService } from '../client/base.js'

class SettingsService extends ApiService {
  async getAllSettings() {
    const response = await this.get('/settings')
    return response.data
  }

  async getNetworkSettings() {
    const response = await this.get('/settings/network')
    return response.data
  }

  async updateNetworkSettings(networkConfig) {
    return this.put('/settings/network', networkConfig)
  }

  async getAuthSettings() {
    const response = await this.get('/settings/auth')
    return response.data
  }

  async updateAuthSettings(authConfig) {
    return this.put('/settings/auth', authConfig)
  }

  async getAbout() {
    const response = await this.get('/settings/about')
    return response.data
  }

  async getPingPeriod() {
    const response = await this.get('/settings/ping_period')
    return response.data
  }

  async updatePingPeriod(pingPeriod) {
    return this.put('/settings/ping_period', { pingPeriod })
  }

  async resetWiFi() {
    return this.post('/settings/reset_wifi')
  }
}
