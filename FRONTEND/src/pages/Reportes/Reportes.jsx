import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, Loader } from '../../components'
import { useMantenimiento, useAuth } from '../../context'
import { ESTADOS_ORDEN } from '../../constants'
import { exportarReporteMasivoPDF, exportarReporteMasivoExcel, exportarOrdenTrabajoPDF } from '../../utils'
import { mantenimientoService } from '../../services'
import './Reportes.css'

export const Reportes = () => {
  const { user } = useAuth()
  const { ordenes, loading, fetchOrdenes } = useMantenimiento()
  const [formatoExportando, setFormatoExportando] = useState(null) // 'pdf' | 'excel' | null
  const [descargandoPDFs, setDescargandoPDFs] = useState(false)
  const [ordenesSeleccionadasPDF, setOrdenesSeleccionadasPDF] = useState(new Set())
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

  const opcionesReporte = {
    tipoOrden: 'Orden de mantenimiento',
    grupoPlanificador: 'Producción',
    responsablePtoTriba: 'Mantenimiento',
    usuarioGenera: user?.nombre || user?.usuario || '—',
  }

  const handleGenerarMasivoPDF = async () => {
    if (ordenesFiltradas.length === 0) {
      alert('No hay órdenes seleccionadas para generar el reporte')
      return
    }
    setFormatoExportando('pdf')
    try {
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
      await exportarReporteMasivoPDF(ordenesCompletas, opcionesReporte)
    } catch (err) {
      console.error('Error al generar reporte PDF:', err)
      alert('Error al generar el reporte. Por favor, intente nuevamente.')
    } finally {
      setFormatoExportando(null)
    }
  }

  const handleGenerarMasivoExcel = async () => {
    if (ordenesFiltradas.length === 0) {
      alert('No hay órdenes seleccionadas para generar el reporte')
      return
    }
    setFormatoExportando('excel')
    try {
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
      exportarReporteMasivoExcel(ordenesCompletas, opcionesReporte)
    } catch (err) {
      console.error('Error al generar reporte Excel:', err)
      alert('Error al generar el reporte. Por favor, intente nuevamente.')
    } finally {
      setFormatoExportando(null)
    }
  }

  const toggleSeleccionPDF = (ordenId) => {
    setOrdenesSeleccionadasPDF((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(ordenId)) nuevo.delete(ordenId)
      else nuevo.add(ordenId)
      return nuevo
    })
  }

  const seleccionarTodosPDF = () => {
    if (ordenesSeleccionadasPDF.size === ordenesFiltradas.length) {
      setOrdenesSeleccionadasPDF(new Set())
    } else {
      setOrdenesSeleccionadasPDF(new Set(ordenesFiltradas.map((o) => o.id)))
    }
  }

  const handleDescargarPDFsSeleccionados = async () => {
    const ids = Array.from(ordenesSeleccionadasPDF)
    if (ids.length === 0) {
      alert('Seleccione al menos una orden para descargar')
      return
    }
    setDescargandoPDFs(true)
    try {
      const ordenesParaDescargar = ordenesFiltradas.filter((o) => ids.includes(o.id))
      for (let i = 0; i < ordenesParaDescargar.length; i++) {
        try {
          const res = await mantenimientoService.getOrdenById(ordenesParaDescargar[i].id)
          const ordenCompleta = res.data
          await exportarOrdenTrabajoPDF(ordenCompleta, ordenCompleta.datosReporte)
          if (i < ordenesParaDescargar.length - 1) {
            await new Promise((r) => setTimeout(r, 500))
          }
        } catch (err) {
          console.error(`Error al descargar orden #${ordenesParaDescargar[i].id}:`, err)
        }
      }
      setOrdenesSeleccionadasPDF(new Set())
    } catch (err) {
      console.error('Error al descargar PDFs:', err)
      alert('Error al descargar los reportes. Por favor, intente nuevamente.')
    } finally {
      setDescargandoPDFs(false)
    }
  }

  return (
    <div className="reportes">
      <h1 className="page-title">Reportes</h1>

      {/* Filtros compartidos */}
      <Card title="Filtros">
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
        <p className="reportes__resumen-p">
          <strong>Órdenes filtradas: {ordenesFiltradas.length}</strong>
        </p>
      </Card>

      {/* Descargas Masivas: todos los reportes en un solo archivo */}
      <Card title="Descargas Masivas">
        <p className="reportes__text">
          Descargue todas las órdenes filtradas en un solo archivo (PDF o Excel).
        </p>
        <div className="reportes__opciones" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="reportes__btn reportes__btn--primary"
            onClick={handleGenerarMasivoPDF}
            disabled={formatoExportando !== null || ordenesFiltradas.length === 0}
          >
            {formatoExportando === 'pdf' ? 'Generando...' : 'Descargar PDF'}
          </button>
          <button
            type="button"
            className="reportes__btn reportes__btn--secondary"
            onClick={handleGenerarMasivoExcel}
            disabled={formatoExportando !== null || ordenesFiltradas.length === 0}
          >
            {formatoExportando === 'excel' ? 'Generando...' : 'Descargar Excel'}
          </button>
        </div>
      </Card>

      {/* Descargas PDF: reporte individual por orden */}
      <Card title="Descargas PDF">
        <p className="reportes__text">
          Descargue el reporte (Orden de Trabajo) de una o varias órdenes. Cada orden se descargará como un archivo PDF individual.
        </p>
        <div className="reportes__resumen">
          <p>
            <strong>Órdenes filtradas: {ordenesFiltradas.length}</strong>
            {ordenesFiltradas.length > 0 && (
              <>
                {' — '}
                <button
                  type="button"
                  className="reportes__link-btn"
                  onClick={seleccionarTodosPDF}
                >
                  {ordenesSeleccionadasPDF.size === ordenesFiltradas.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                </button>
              </>
            )}
          </p>
        </div>

        {loading ? (
          <Loader />
        ) : ordenesFiltradas.length === 0 ? (
          <p className="reportes__empty">No hay órdenes para mostrar. Ajuste los filtros.</p>
        ) : (
          <>
            <ul className="reportes__list reportes__list--selectable">
              {ordenesFiltradas.map((o) => (
                <li key={o.id} className="reportes__item reportes__item--row">
                  <label className="reportes__checkbox-label">
                    <input
                      type="checkbox"
                      checked={ordenesSeleccionadasPDF.has(o.id)}
                      onChange={() => toggleSeleccionPDF(o.id)}
                    />
                    <span className="reportes__item-text">
                      Orden #{o.id} — {o.titulo || o.descripcion || 'Sin título'}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="reportes__btn reportes__btn--primary"
              onClick={handleDescargarPDFsSeleccionados}
              disabled={descargandoPDFs || ordenesSeleccionadasPDF.size === 0}
              style={{ marginTop: '1rem' }}
            >
              {descargandoPDFs ? 'Descargando...' : `Descargar PDF (${ordenesSeleccionadasPDF.size} seleccionadas)`}
            </button>
          </>
        )}
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
