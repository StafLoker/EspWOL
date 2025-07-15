import { Response } from 'miragejs'
import { mockUser, sessionToken } from '../data.js'

export function authRoutes() {
  this.post('/login', (schema, request) => {
    const { username, password } = JSON.parse(request.requestBody)

    if (username === mockUser.username && password === mockUser.password) {
      return {
        success: true,
        message: 'Login successful',
        username: mockUser.username,
        token: sessionToken,
      }
    }

    return new Response(
      401,
      {},
      {
        success: false,
        message: 'Invalid credentials',
      },
    )
  })

  this.post('/logout', () => {
    return {
      success: true,
      message: 'Logout successful',
    }
  })
}
