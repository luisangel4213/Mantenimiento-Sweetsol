import { createContext, useContext, useState, useCallback } from 'react'
import { mantenimientoService } from '../services'

const MantenimientoContext = createContext(null)

export const useMantenimiento = () => {
  const context = useContext(MantenimientoContext)
  if (!context) {
    throw new Error('useMantenimiento debe usarse dentro de MantenimientoProvider')
  }
  return context
}

export const MantenimientoProvider = ({ children }) => {
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchOrdenes = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await mantenimientoService.getOrdenes(params)
      setOrdenes(data ?? [])
      return data
    } catch (err) {
      const message = err.response?.data?.message || 'Error al cargar órdenes'
      setError(message)
      setOrdenes([])
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOrdenesPendientes = useCallback(async () => {
    return fetchOrdenes({ estado: 'pendiente' })
  }, [fetchOrdenes])

  const crearOrden = useCallback(async (ordenData) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await mantenimientoService.createOrden(ordenData)
      setOrdenes((prev) => [data, ...prev])
      return data
    } catch (err) {
      const message = err.response?.data?.message || 'Error al crear orden'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const actualizarOrden = useCallback(async (id, ordenData) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await mantenimientoService.updateOrden(id, ordenData)
      setOrdenes((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...data } : o))
      )
      return data
    } catch (err) {
      const message = err.response?.data?.message || 'Error al actualizar orden'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const eliminarOrden = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      await mantenimientoService.deleteOrden(id)
      setOrdenes((prev) => prev.filter((o) => o.id !== id))
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar orden'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const subirEvidencias = useCallback(async (id, files) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await mantenimientoService.uploadEvidencias(id, files)
      setOrdenes((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...data } : o))
      )
      return data
    } catch (err) {
      const message = err.response?.data?.message || 'Error al subir evidencias'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = {
    ordenes,
    loading,
    error,
    fetchOrdenes,
    fetchOrdenesPendientes,
    crearOrden,
    actualizarOrden,
    eliminarOrden,
    subirEvidencias,
    clearError,
  }

  return (
    <MantenimientoContext.Provider value={value}>
      {children}
    </MantenimientoContext.Provider>
  )
}
