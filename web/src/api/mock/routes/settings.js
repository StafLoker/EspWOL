import { Response } from 'miragejs'
import { mockConstants } from '../data.js'

export function settingsRoutes() {
  // =============================================================================
  // SETTINGS
  // =============================================================================

  this.get('/settings', () => {
    return {
      success: true,
      message: 'Settings retrieved successfully',
      data: {
        networkConfig: {
          enable: false,
          ip: '192.168.1.50',
          networkMask: '255.255.255.0',
          gateway: '192.168.1.1',
          dns: '8.8.8.8',
        },
        pingPeriod: 60000,
      },
    }
  })

  this.get('/settings/network', () => {
    return {
      success: true,
      message: 'Network settings retrieved',
      data: {
        enable: false,
        ip: '192.168.1.50',
        networkMask: '255.255.255.0',
        gateway: '192.168.1.1',
        dns: '8.8.8.8',
      },
    }
  })

  this.put('/settings/network', (schema, request) => {
    const networkConfig = JSON.parse(request.requestBody)

    return {
      success: true,
      message: 'Network settings updated',
      data: networkConfig,
    }
  })

  this.get('/settings/auth', () => {
    return {
      success: true,
      message: 'Auth settings retrieved',
      data: {
        username: 'glavniy',
      },
    }
  })

  this.put('/settings/auth', (schema, request) => {
    const { username, password } = JSON.parse(request.requestBody)

    if (username && username.length > MAX_USERNAME_LENGTH) {
      return new Response(
        400,
        {},
        {
          success: false,
          message: `Username exceeds maximum length of ${MAX_USERNAME_LENGTH} characters`,
        },
      )
    }

    if (password && password.length > MAX_PASSWORD_LENGTH) {
      return new Response(
        400,
        {},
        {
          success: false,
          message: `Password exceeds maximum length of ${MAX_PASSWORD_LENGTH} characters`,
        },
      )
    }

    return {
      success: true,
      message: 'Auth settings updated successfully',
    }
  })

  this.get('/settings/about', () => {
    return {
      success: true,
      message: 'About information retrieved',
      data: {
        version: '3.0.0',
        hostname: 'wol',
      },
    }
  })

  this.get('/settings/ping_period', () => {
    return {
      success: true,
      message: 'Ping period retrieved',
      data: {
        pingPeriod: 60000,
      },
    }
  })

  this.put('/settings/ping_period', (schema, request) => {
    const { pingPeriod } = JSON.parse(request.requestBody)

    if (!VALID_PING_PERIODS.includes(pingPeriod / 1000)) {
      return new Response(
        400,
        {},
        {
          success: false,
          message: 'Invalid ping period',
        },
      )
    }

    return {
      success: true,
      message: 'Ping period updated',
      data: { pingPeriod },
    }
  })

  this.post('/settings/reset_wifi', () => {
    return {
      success: true,
      message: 'WiFi reset successful',
    }
  })
}
