import api from './api'

const ENDPOINT = '/usuarios'

export const userService = {
  /**
   * Crea un nuevo operario de mantenimiento.
   * @param {Object} data - { usuario: string, email?: string, password: string, nombre: string }
   */
  crearOperario: (data) => api.post(`${ENDPOINT}/operarios`, data),

  /**
   * Lista todos los operarios de mantenimiento.
   */
  listarOperarios: () => api.get(`${ENDPOINT}/operarios`),
}

