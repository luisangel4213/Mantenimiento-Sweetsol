import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, Loader } from '../../components'
import { useMantenimiento, useAuth } from '../../context'
import { ESTADOS_ORDEN, ROLES } from '../../constants'
import './Ordenes.css'

export const Ordenes = () => {
  const { ordenes, loading, error, fetchOrdenes, clearError } = useMantenimiento()
  const { user, hasRole } = useAuth()
  const esOperario = hasRole(ROLES.OPERARIO_MANTENIMIENTO)

  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroAsignacion, setFiltroAsignacion] = useState(esOperario ? 'asignadas' : 'todas')
  const [ordenesFiltradas, setOrdenesFiltradas] = useState([])

  useEffect(() => {
    cargarOrdenes()
  }, [filtroEstado, filtroAsignacion])

  const cargarOrdenes = async () => {
    try {
      const params = {}
      if (filtroEstado) {
        params.estado = filtroEstado
      }
      if (esOperario && user?.id) {
        if (filtroAsignacion === 'asignadas') {
          params.asignadoA = user.id
        } else if (filtroAsignacion === 'disponibles') {
          params.asignadoA = 'null' // Enviar como string 'null' para filtrar órdenes sin asignar
        }
        // Si es 'todas', no agregamos filtro de asignación
      }
      await fetchOrdenes(params)
    } catch (err) {
      console.error('Error al cargar órdenes:', err)
    }
  }

  useEffect(() => {
    if (error) clearError()
  }, [clearError, error])

  useEffect(() => {
    setOrdenesFiltradas(ordenes || [])
  }, [ordenes])

  return (
    <div className="ordenes">
      <h1 className="page-title">Órdenes de Trabajo</h1>

      {error && (
        <div className="ordenes__error" role="alert">
          {error}
        </div>
      )}

      {/* Filtros */}
      <Card title="Filtros">
        <div className="ordenes__filtros">
          <div className="ordenes__filtro">
            <label className="ordenes__label">
              Estado
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="ordenes__select"
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="en_progreso">En progreso</option>
                <option value="completada">Completadas</option>
                <option value="proceso_cerrado">Proceso Cerrado</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </label>
          </div>

          {esOperario && (
            <div className="ordenes__filtro">
              <label className="ordenes__label">
                Ver órdenes
                <select
                  value={filtroAsignacion}
                  onChange={(e) => setFiltroAsignacion(e.target.value)}
                  className="ordenes__select"
                >
                  <option value="asignadas">Asignadas a mí</option>
                  <option value="todas">Todas las órdenes</option>
                  <option value="disponibles">Disponibles (sin asignar)</option>
                </select>
              </label>
            </div>
          )}
        </div>
      </Card>

      <Card title={`Listado (${ordenesFiltradas.length})`}>
        {loading ? (
          <Loader />
        ) : ordenesFiltradas?.length > 0 ? (
          <ul className="ordenes__list">
            {ordenesFiltradas.map((o) => (
              <li key={o.id} className="ordenes__item">
                <Link to={`/ordenes/${o.id}`} className="ordenes__link">
                  <span className="ordenes__id">#{o.id}</span>
                  <span className="ordenes__titulo">{o.descripcion || o.titulo || 'Sin descripción'}</span>
                </Link>
                <div className="ordenes__info">
                  {o.asignadoANombre && (
                    <span className="ordenes__asignado">Asignado a: {o.asignadoANombre}</span>
                  )}
                  <span className={`ordenes__estado ordenes__estado--${o.estado || 'pendiente'}`}>
                    {o.estado || 'pendiente'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ordenes__empty">No hay órdenes disponibles con los filtros seleccionados.</p>
        )}
      </Card>
    </div>
  )
}
