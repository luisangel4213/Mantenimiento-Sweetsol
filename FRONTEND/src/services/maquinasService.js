import api from './api'

const ENDPOINT = '/maquinas'

export const maquinasService = {
  /**
   * Historial de mantenimiento por máquina.
   * GET /api/maquinas/:id/historial?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
   */
  getHistorial: (id, params) =>
    api.get(`${ENDPOINT}/${id}/historial`, { params }),
}

