import api from './api'

const ENDPOINT = '/mantenimiento'

export const mantenimientoService = {
  getOrdenes: (params) => api.get(ENDPOINT, { params }),

  getOrdenById: (id) => api.get(`${ENDPOINT}/${id}`),

  /**
   * Datos estructurados para PDF/Excel: orden, informe, paraPDF, paraExcel.
   */
  getDatosParaInforme: (id) => api.get(`${ENDPOINT}/${id}/informe/datos`),

  createOrden: (data) => api.post(ENDPOINT, data),

  updateOrden: (id, data) => api.put(`${ENDPOINT}/${id}`, data),

  deleteOrden: (id) => api.delete(`${ENDPOINT}/${id}`),

  getOrdenesPendientes: () =>
    api.get(ENDPOINT, { params: { estado: 'pendiente' } }),

  getOrdenesPorEquipo: (equipoId) =>
    api.get(ENDPOINT, { params: { equipoId } }),

  /**
   * Sube archivos de evidencia. Body: FormData con clave 'evidencias' (múltiple).
   * Respuesta esperada: { evidencias } o el objeto orden actualizado.
   */
  uploadEvidencias: (id, files) => {
    const form = new FormData()
    for (let i = 0; i < files.length; i++) {
      form.append('evidencias', files[i])
    }
    return api.post(`${ENDPOINT}/${id}/evidencias`, form)
  },

  asignarOrden: (id, asignadoA) => api.post(`${ENDPOINT}/${id}/asignar`, { asignadoA }),

  iniciarOrden: (id) => api.post(`${ENDPOINT}/${id}/iniciar`),

  finalizarOrden: (id, data) => api.post(`${ENDPOINT}/${id}/finalizar`, data),
}
