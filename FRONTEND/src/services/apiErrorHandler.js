/**
 * Normaliza errores de Axios para un manejo centralizado.
 * @param {import('axios').AxiosError} error
 * @returns {{ message: string, status: number, isNetwork: boolean }}
 */
export function normalizeApiError(error) {
  const status = error.response?.status ?? 0
  const isNetwork = !error.response && !!error.request
  const serverMessage = error.response?.data?.message

  let message
  if (serverMessage && typeof serverMessage === 'string') {
    message = serverMessage
  } else if (status === 401) {
    message = 'Sesión expirada o no autorizado'
  } else if (status === 403) {
    message = 'No tiene permiso para esta acción'
  } else if (status === 404) {
    message = 'Recurso no encontrado'
  } else if (status === 400) {
    message = 'Solicitud incorrecta'
  } else if (status === 409) {
    message = 'Conflicto: el recurso ya existe o no puede modificarse'
  } else if (status === 422) {
    message = 'Datos inválidos'
  } else if (status >= 500) {
    message = 'Error del servidor. Intente más tarde.'
  } else if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
    message = 'La petición ha tardado demasiado'
  } else if (isNetwork) {
    message = 'No se pudo conectar con el servidor'
  } else {
    message = error.message || 'Ha ocurrido un error'
  }

  return { message, status, isNetwork }
}

/**
 * Obtiene el mensaje para mostrar en UI. Útil en .catch() de componentes.
 * @param {unknown} error - Error de Axios o con { apiMessage, response }
 * @returns {string}
 */
export function getApiErrorMessage(error) {
  if (error && typeof error === 'object') {
    if ('apiMessage' in error && typeof error.apiMessage === 'string') return error.apiMessage
    if ('response' in error && error.response?.data?.message) return error.response.data.message
    if ('message' in error && typeof error.message === 'string') return error.message
  }
  return 'Ha ocurrido un error'
}
