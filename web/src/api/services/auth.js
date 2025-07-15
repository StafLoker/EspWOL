import { ApiService } from '../client/base.js'

class AuthService extends ApiService {
  async login(username, password) {
    const response = await this.post('/login', { username, password })

    if (response.success && response.token) {
      this.sessionToken = response.token
      localStorage.setItem('sessionToken', response.token)
      localStorage.setItem('username', response.username)
    }

    return response
  }

  async logout() {
    const response = await this.post('/logout')
    this.sessionToken = null
    localStorage.removeItem('sessionToken')
    localStorage.removeItem('username')
    return response
  }
}
