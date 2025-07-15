import { ApiClient } from './client/index.js'
export { ApiError, handleApiError } from './client/errors.js'
export { getImportStatus } from './utils/helpers.js'
export { setupMirageServer } from './mock/index.js'

// Cliente API configurado
export const apiClient = new ApiClient()

// Auto-configurar el token al cargar
const storedToken = localStorage.getItem('sessionToken')
if (storedToken) {
  apiClient.setSessionToken(storedToken)
}
