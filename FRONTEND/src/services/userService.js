import api from './api'

const ENDPOINT = '/usuarios'

export const userService = {
  /**
   * Lista todos los operarios de mantenimiento.
   */
  listarOperarios: () => api.get(`${ENDPOINT}/operarios`),

  /**
   * Crea un nuevo operario de mantenimiento.
   * @param {Object} data - { usuario: string, email?: string, password: string, nombre: string }
   */
  crearOperario: (data) => api.post(`${ENDPOINT}/operarios`, data),

  /**
   * Lista todos los usuarios (todos los roles). Jefe de Mantenimiento y Super Usuario.
   */
  listarTodos: () => api.get(`${ENDPOINT}/todos`),

  /**
   * Crea un usuario con cualquier rol. Solo Super Usuario.
   * @param {Object} data - { rolCodigo: string, usuario: string, nombre: string, email?: string, password: string }
   */
  crearUsuario: (data) => api.post(ENDPOINT, data),

  /**
   * Actualiza nombre, usuario y/o contraseña. Solo Super Usuario.
   * @param {number} id
   * @param {Object} data - { nombre?: string, usuario?: string, password?: string }
   */
  actualizarUsuario: (id, data) => api.put(`${ENDPOINT}/${id}`, data),

  /**
   * Desactiva un usuario. Solo Super Usuario.
   */
  eliminarUsuario: (id) => api.delete(`${ENDPOINT}/${id}`),
}

