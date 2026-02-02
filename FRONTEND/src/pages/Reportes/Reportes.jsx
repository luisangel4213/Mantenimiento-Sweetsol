import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, Loader } from '../../components'
import { useMantenimiento, useAuth } from '../../context'
import { ESTADOS_ORDEN } from '../../constants'
import { exportarReporteMasivoPDF } from '../../utils'
import { mantenimientoService } from '../../services'
import './Reportes.css'

export const Reportes = () => {
  const { user } = useAuth()
  const { ordenes, loading, fetchOrdenes } = useMantenimiento()
  const [generandoMasivo, setGenerandoMasivo] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('completada')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [ordenesFiltradas, setOrdenesFiltradas] = useState([])

  const completadas = (ordenes || []).filter((o) => o.estado === ESTADOS_ORDEN.COMPLETADA)
  // Solo órdenes en Proceso cerrado pueden acceder al Informe Técnico de Mantenimiento
  const ordenesParaInforme = (ordenes || []).filter((o) => o.estado === ESTADOS_ORDEN.PROCESO_CERRADO)

  useEffect(() => {
    fetchOrdenes().catch(() => {})
  }, [fetchOrdenes])

  useEffect(() => {
    filtrarOrdenes()
  }, [ordenes, filtroEstado, filtroFechaDesde, filtroFechaHasta])

  const filtrarOrdenes = () => {
    let filtradas = [...(ordenes || [])]

    // Filtrar por estado
    if (filtroEstado && filtroEstado !== 'todas') {
      filtradas = filtradas.filter((o) => o.estado === filtroEstado)
    }

    // Filtrar por fecha
    if (filtroFechaDesde) {
      const desde = new Date(filtroFechaDesde)
      desde.setHours(0, 0, 0, 0)
      filtradas = filtradas.filter((o) => {
        if (!o.createdAt) return false
        const fechaOrden = new Date(o.createdAt)
        fechaOrden.setHours(0, 0, 0, 0)
        return fechaOrden >= desde
      })
    }

    if (filtroFechaHasta) {
      const hasta = new Date(filtroFechaHasta)
      hasta.setHours(23, 59, 59, 999)
      filtradas = filtradas.filter((o) => {
        if (!o.createdAt) return false
        const fechaOrden = new Date(o.createdAt)
        return fechaOrden <= hasta
      })
    }

    setOrdenesFiltradas(filtradas)
  }

  const handleGenerarMasivo = async () => {
    if (ordenesFiltradas.length === 0) {
      alert('No hay órdenes seleccionadas para generar el reporte masivo')
      return
    }

    setGenerandoMasivo(true)
    try {
      // Cargar datos completos de cada orden
      const ordenesCompletas = await Promise.all(
        ordenesFiltradas.map(async (orden) => {
          try {
            const res = await mantenimientoService.getOrdenById(orden.id)
            return res.data
          } catch {
            return orden
          }
        })
      )

      // Generar reporte masivo (diseño corporativo: encabezado, tabla, pie de página)
      await exportarReporteMasivoPDF(ordenesCompletas, {
        tipoOrden: 'Orden de mantenimiento',
        grupoPlanificador: 'Producción',
        responsablePtoTriba: 'Mantenimiento',
        usuarioGenera: user?.nombre || user?.usuario || '—',
      })
    } catch (err) {
      console.error('Error al generar reporte masivo:', err)
      alert('Error al generar el reporte masivo. Por favor, intente nuevamente.')
    } finally {
      setGenerandoMasivo(false)
    }
  }

  return (
    <div className="reportes">
      <h1 className="page-title">Reportes</h1>

      {/* Reporte Masivo */}
      <Card title="Reporte Masivo de Órdenes de Trabajo">
        <p className="reportes__text">
          Genere un reporte PDF que incluya todas las órdenes de trabajo seleccionadas. Cada orden se mostrará en una página separada.
        </p>

        <div className="reportes__filtros">
          <div className="reportes__filtro">
            <label className="reportes__label">
              Estado
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="reportes__select"
              >
                <option value="todas">Todas</option>
                <option value="pendiente">Pendientes</option>
                <option value="en_progreso">En progreso</option>
                <option value="completada">Completadas</option>
                <option value="proceso_cerrado">Proceso Cerrado</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </label>
          </div>

          <div className="reportes__filtro">
            <label className="reportes__label">
              Fecha desde
              <input
                type="date"
                value={filtroFechaDesde}
                onChange={(e) => setFiltroFechaDesde(e.target.value)}
                className="reportes__input"
              />
            </label>
          </div>

          <div className="reportes__filtro">
            <label className="reportes__label">
              Fecha hasta
              <input
                type="date"
                value={filtroFechaHasta}
                onChange={(e) => setFiltroFechaHasta(e.target.value)}
                className="reportes__input"
              />
            </label>
          </div>
        </div>

        <div className="reportes__resumen">
          <p>
            <strong>Órdenes seleccionadas: {ordenesFiltradas.length}</strong>
          </p>
        </div>

        <button
          type="button"
          className="reportes__btn reportes__btn--primary"
          onClick={handleGenerarMasivo}
          disabled={generandoMasivo || ordenesFiltradas.length === 0}
        >
          {generandoMasivo ? 'Generando reporte...' : `Generar Reporte Masivo (${ordenesFiltradas.length} órdenes)`}
        </button>
      </Card>

      {/* Informe Técnico: solo órdenes en estado Proceso cerrado */}
      <Card title="Informe técnico de mantenimiento">
        <p className="reportes__text">
          Solo las órdenes en estado <strong>Proceso cerrado</strong> pueden generar el informe técnico. Incluye resumen, evidencias, firma y exportación a PDF o Excel.
        </p>
        {loading ? (
          <Loader />
        ) : ordenesParaInforme.length === 0 ? (
          <p className="reportes__empty">No hay órdenes en proceso cerrado para generar informes.</p>
        ) : (
          <ul className="reportes__list">
            {ordenesParaInforme.map((o) => (
              <li key={o.id} className="reportes__item">
                <Link to={`/reportes/informe/${o.id}`} className="reportes__link">
                  Orden #{o.id} — {o.titulo || o.descripcion || 'Sin título'}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
