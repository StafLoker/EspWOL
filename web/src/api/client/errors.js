export class ApiError extends Error {
  constructor(message, status, response) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.response = response
  }
}

export function handleApiError(error) {
  if (error instanceof ApiError) {
    return error.message
  }
  return 'Network error'
}
