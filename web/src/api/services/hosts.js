class HostService extends ApiService {
  async getAllHosts() {
    const response = await this.get('/hosts')
    return {
      hosts: response.data || [],
      metadata: response.metadata || {},
    }
  }

  async getHost(id) {
    const response = await this.get('/hosts', { id })
    return response.data
  }

  async addHost(hostData) {
    return this.post('/hosts', hostData)
  }

  async updateHost(id, hostData) {
    return this.put('/hosts', hostData, { id })
  }

  async deleteHost(id) {
    return this.delete(`/hosts?id=${id}`)
  }

  async importHosts(hosts) {
    return this.post('/hosts/import', hosts)
  }

  async wakeHost(id) {
    return this.post(`/hosts/wake?id=${id}`)
  }

  async pingHost(id) {
    return this.post(`/hosts/ping?id=${id}`)
  }
}
