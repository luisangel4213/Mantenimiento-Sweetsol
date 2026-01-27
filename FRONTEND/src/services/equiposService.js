import api from './api'

const ENDPOINT = '/equipos'

export const equiposService = {
  getAll: (params) => api.get(ENDPOINT, { params }),

  getById: (id) => api.get(`${ENDPOINT}/${id}`),

  create: (data) => api.post(ENDPOINT, data),

  update: (id, data) => api.put(`${ENDPOINT}/${id}`, data),

  delete: (id) => api.delete(`${ENDPOINT}/${id}`),

  getPorArea: (area) => api.get(ENDPOINT, { params: { area } }),

  getPorCriticidad: (criticidad) =>
    api.get(ENDPOINT, { params: { criticidad } }),

  getEstaciones: () => api.get(`${ENDPOINT}/estaciones`),
}
