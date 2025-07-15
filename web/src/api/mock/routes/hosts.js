import { Response } from 'miragejs'
import { currentHostId, mockMemoryInfo } from '../data.js'

export function hostsRoutes() {
  this.get('/hosts', (schema) => {
    const hosts = schema.hosts.all().models

    mockMemoryInfo.hosts.count = hosts.length
    mockMemoryInfo.hosts.remaining = mockMemoryInfo.hosts.maxAllowed - hosts.length
    mockMemoryInfo.canAddMoreHosts = hosts.length < mockMemoryInfo.hosts.maxAllowed

    return {
      success: true,
      message: 'Hosts retrieved successfully',
      data: hosts,
      metadata: mockMemoryInfo,
    }
  })

  this.post('/hosts', (schema, request) => {
    const hostData = JSON.parse(request.requestBody)

    if (hostData.name && hostData.name.length > MAX_HOST_NAME_LENGTH) {
      return new Response(
        400,
        {},
        {
          success: false,
          message: `Host name exceeds maximum length of ${MAX_HOST_NAME_LENGTH} characters`,
        },
      )
    }

    const currentCount = schema.hosts.all().length
    if (currentCount >= mockMemoryInfo.hosts.maxAllowed) {
      return new Response(
        400,
        {},
        {
          success: false,
          message: 'Maximum number of hosts reached',
        },
      )
    }

    const existingHost = schema.hosts.findBy({ mac: hostData.mac })
    if (existingHost) {
      return new Response(
        400,
        {},
        {
          success: false,
          message: 'Duplicate host',
        },
      )
    }

    const newHost = schema.hosts.create({
      id: currentHostId++,
      ...hostData,
      status: false,
    })

    return {
      success: true,
      message: 'Host added successfully',
      data: newHost,
    }
  })

  this.put('/hosts', (schema, request) => {
    const { id } = request.queryParams
    const hostData = JSON.parse(request.requestBody)

    if (hostData.name && hostData.name.length > MAX_HOST_NAME_LENGTH) {
      return new Response(
        400,
        {},
        {
          success: false,
          message: `Host name exceeds maximum length of ${MAX_HOST_NAME_LENGTH} characters`,
        },
      )
    }

    const host = schema.hosts.find(id)
    if (!host) {
      return new Response(
        400,
        {},
        {
          success: false,
          message: 'Host not found',
        },
      )
    }

    if (hostData.mac && hostData.mac !== host.mac) {
      const existingHost = schema.hosts.findBy({ mac: hostData.mac })
      if (existingHost) {
        return new Response(
          400,
          {},
          {
            success: false,
            message: 'Duplicate host',
          },
        )
      }
    }

    host.update(hostData)

    return {
      success: true,
      message: 'Host updated successfully',
      data: host,
    }
  })

  this.delete('/hosts', (schema, request) => {
    const { id } = request.queryParams
    const host = schema.hosts.find(id)

    if (!host) {
      return new Response(
        400,
        {},
        {
          success: false,
          message: 'Host not found',
        },
      )
    }

    host.destroy()

    return new Response(204)
  })

  this.post('/hosts/import', (schema, request) => {
    const hostsArray = JSON.parse(request.requestBody)

    if (!Array.isArray(hostsArray)) {
      return new Response(
        400,
        {},
        {
          success: false,
          message: 'Invalid data format',
        },
      )
    }

    const currentCount = schema.hosts.all().length
    const inputSize = hostsArray.length

    if (currentCount + hostsArray.length > mockMemoryInfo.hosts.maxAllowed) {
      return new Response(
        400,
        {},
        {
          success: false,
          message: 'Import would exceed maximum host limit',
        },
      )
    }

    let importedCount = 0
    let ignoredCount = 0

    hostsArray.forEach((hostData) => {
      if (!schema.hosts.findBy({ mac: hostData.mac })) {
        if (hostData.name && hostData.mac && hostData.ip) {
          schema.hosts.create({
            id: currentHostId++,
            ...hostData,
            status: false,
          })
          importedCount++
        } else {
          ignoredCount++
        }
      } else {
        ignoredCount++
      }
    })

    const finalHostCount = schema.hosts.all().length

    mockMemoryInfo.hosts.count = finalHostCount
    mockMemoryInfo.hosts.remaining = mockMemoryInfo.hosts.maxAllowed - finalHostCount

    const isSuccessful = importedCount > 0
    const message = `Imported ${importedCount} hosts from ${inputSize}. ${ignoredCount} hosts ignored. Hosts in database after import: ${finalHostCount}.`

    return {
      success: isSuccessful,
      message: message,
      imported_count: importedCount,
      ignored_count: ignoredCount,
      input_size: inputSize,
      current_host_count: finalHostCount,
      metadata: mockMemoryInfo,
    }
  })

  this.post('/hosts/wake', (schema, request) => {
    const { id } = request.queryParams
    const host = schema.hosts.find(id)

    if (!host) {
      return new Response(
        400,
        {},
        {
          success: false,
          message: 'Host not found',
        },
      )
    }

    host.update({ status: true })

    return {
      success: true,
      message: `WOL packet sent to ${host.name}`,
    }
  })

  this.post('/hosts/ping', (schema, request) => {
    const { id } = request.queryParams
    const host = schema.hosts.find(id)

    if (!host) {
      return new Response(
        400,
        {},
        {
          success: false,
          message: 'Host not found',
        },
      )
    }

    const isOnline = Math.random() > 0.3
    host.update({ status: isOnline })

    return {
      success: isOnline,
      message: isOnline ? 'Host is online' : 'Host is offline',
    }
  })
}
