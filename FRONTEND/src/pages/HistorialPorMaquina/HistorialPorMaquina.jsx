import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Loader } from '../../components'
import { useAuth } from '../../context'
import { equiposService, maquinasService, mantenimientoService } from '../../services'
import { ESTADOS_ORDEN } from '../../constants'
import { exportarReporteMasivoPDF } from '../../utils'
import * as XLSX from 'xlsx'
import './HistorialPorMaquina.css'

const ESTADO_COLORES = {
  pendiente: '#6b7280', // gris
  en_progreso: '#2563eb', // azul
  completada: '#16a34a', // verde
  proceso_cerrado: '#7c3aed', // violeta
  cancelada: '#9ca3af',
}

export const HistorialPorMaquina = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [equipos, setEquipos] = useState([])
  const [selectedEquipoId, setSelectedEquipoId] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [loadingEquipos, setLoadingEquipos] = useState(true)
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [error, setError] = useState(null)
  const [historial, setHistorial] = useState([])
  const [maquinaInfo, setMaquinaInfo] = useState(null)

  useEffect(() => {
    const cargarEquipos = async () => {
      setLoadingEquipos(true)
      setError(null)
      try {
        const res = await equiposService.getAll()
        setEquipos(res.data || [])
      } catch (err) {
        console.error(err)
        setError('Error al cargar la lista de máquinas.')
      } finally {
        setLoadingEquipos(false)
      }
    }
    cargarEquipos()
  }, [])

  const handleBuscar = async (e) => {
    e.preventDefault()
    if (!selectedEquipoId) return

    setLoadingHistorial(true)
    setError(null)
    try {
      const params = {}
      if (fechaDesde) params.desde = fechaDesde
      if (fechaHasta) params.hasta = fechaHasta

      const res = await maquinasService.getHistorial(selectedEquipoId, params)
      const data = res.data || {}
      setMaquinaInfo(data.maquina || null)
      setHistorial(data.historial || [])
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Error al cargar el historial.')
      setHistorial([])
      setMaquinaInfo(null)
    } finally {
      setLoadingHistorial(false)
    }
  }

  const handleExportPDF = async () => {
    if (!historial.length) return
    try {
      const ordenesCompletas = await Promise.all(
        historial.map(async (item) => {
          try {
            const res = await mantenimientoService.getOrdenById(item.ordenId)
            return res.data
          } catch {
            return null
          }
        })
      )
      const validas = ordenesCompletas.filter(Boolean)
      if (!validas.length) return
      await exportarReporteMasivoPDF(validas, {
        tipoOrden: 'Orden de mantenimiento',
        grupoPlanificador: 'Producción',
        responsablePtoTriba: 'Mantenimiento',
        usuarioGenera: user?.nombre || user?.usuario || '—',
      })
    } catch (err) {
      console.error('Error al exportar PDF de historial:', err)
      setError('Error al generar el PDF del historial.')
    }
  }

  const handleExportExcel = () => {
    if (!historial.length || !maquinaInfo) return

    const rows = historial.map((item) => ({
      'ID Orden': item.ordenId,
      'Máquina': maquinaInfo.nombre,
      'Código máquina': maquinaInfo.codigo || '',
      'Área': maquinaInfo.area || '',
      'Fecha inicio': item.fechaInicio || '',
      'Fecha cierre': item.fechaCierre || '',
      'Tipo mantenimiento': item.tipoMantenimiento || '',
      'Operario': item.operarioNombre || '',
      'Tiempo total (min)': item.duracionMinutos ?? '',
      'Estado': getEstadoLabel(item.estado),
      'Prioridad': item.prioridad || '',
      'Título': item.titulo || '',
      'Descripción (solicitud)': item.descripcion || '',
      'Trabajo realizado': item.trabajoRealizado || '',
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 10 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 25 },
      { wch: 18 },
      { wch: 14 },
      { wch: 10 },
      { wch: 30 },
      { wch: 60 },
      { wch: 60 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Historial')

    const fecha = new Date().toISOString().split('T')[0]
    const nombreBase = maquinaInfo.codigo || maquinaInfo.nombre || 'maquina'
    XLSX.writeFile(wb, `historial-${nombreBase}-${fecha}.xlsx`)
  }

  const formatFecha = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString()
  }

  const formatTiempoTotal = (minutos) => {
    if (minutos == null) return '—'
    const total = Number(minutos)
    if (Number.isNaN(total) || total < 0) return '—'
    const horas = Math.floor(total / 60)
    const mins = total % 60
    if (horas === 0) return `${mins} min`
    if (mins === 0) return `${horas} h`
    return `${horas} h ${mins} min`
  }

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case ESTADOS_ORDEN.PENDIENTE:
        return 'Pendiente'
      case ESTADOS_ORDEN.EN_PROGRESO:
        return 'En curso'
      case ESTADOS_ORDEN.COMPLETADA:
        return 'Finalizada'
      case ESTADOS_ORDEN.PROCESO_CERRADO:
        return 'Proceso Cerrado'
      case ESTADOS_ORDEN.CANCELADA:
        return 'Cancelada'
      default:
        return estado || 'Desconocido'
    }
  }

  const getEstadoColor = (estado) => {
    return ESTADO_COLORES[estado] || ESTADO_COLORES.pendiente
  }

  const handleVerInforme = (ordenId, informeId) => {
    // Reutiliza la vista de informe técnico existente
    if (informeId) {
      navigate(`/reportes/informe/${ordenId}`)
    } else {
      navigate(`/ordenes/${ordenId}`)
    }
  }

  if (loadingEquipos) {
    return (
      <div className="historial-maquina">
        <Loader />
      </div>
    )
  }

  return (
    <div className="historial-maquina">
      <h1 className="page-title">Historial por Máquina</h1>
      <p className="historial-maquina__subtitle">
        Analice el comportamiento histórico de cada máquina, tiempos de intervención y estado final de las órdenes.
      </p>

      {error && (
        <div className="historial-maquina__error" role="alert">
          {error}
        </div>
      )}

      <Card title="Filtros de búsqueda">
        <form className="historial-maquina__form" onSubmit={handleBuscar}>
          <div className="historial-maquina__row">
            <div className="historial-maquina__field historial-maquina__field--grow">
              <label className="historial-maquina__label">
                Máquina <span className="historial-maquina__required">*</span>
                <select
                  value={selectedEquipoId}
                  onChange={(e) => setSelectedEquipoId(e.target.value)}
                  className="historial-maquina__select"
                  required
                >
                  <option value="">Seleccione una máquina</option>
                  {equipos.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.nombre} {eq.codigo ? `(${eq.codigo})` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="historial-maquina__field">
              <label className="historial-maquina__label">
                Fecha desde
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="historial-maquina__input"
                />
              </label>
            </div>
            <div className="historial-maquina__field">
              <label className="historial-maquina__label">
                Fecha hasta
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="historial-maquina__input"
                />
              </label>
            </div>
          </div>

          <div className="historial-maquina__actions">
            <button
              type="submit"
              className="historial-maquina__btn historial-maquina__btn--primary"
              disabled={!selectedEquipoId || loadingHistorial}
            >
              {loadingHistorial ? 'Buscando...' : 'Buscar historial'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Resultados">
        {!maquinaInfo && historial.length === 0 ? (
          <p className="historial-maquina__empty">
            Seleccione una máquina y un rango de fechas para ver su historial de mantenimiento.
          </p>
        ) : (
          <>
            {maquinaInfo && (
              <div className="historial-maquina__resumen">
                <p>
                  <strong>Máquina:</strong> {maquinaInfo.nombre}{' '}
                  {maquinaInfo.codigo ? `(${maquinaInfo.codigo})` : ''}
                </p>
                {maquinaInfo.area && (
                  <p>
                    <strong>Área:</strong> {maquinaInfo.area}
                  </p>
                )}
              </div>
            )}

            {historial.length > 0 && (
              <div className="historial-maquina__export">
                <button
                  type="button"
                  className="historial-maquina__btn historial-maquina__btn--secondary"
                  onClick={handleExportPDF}
                  disabled={loadingHistorial}
                >
                  Descargar PDF
                </button>
                <button
                  type="button"
                  className="historial-maquina__btn historial-maquina__btn--secondary"
                  onClick={handleExportExcel}
                  disabled={loadingHistorial}
                >
                  Descargar Excel
                </button>
              </div>
            )}

            {loadingHistorial ? (
              <Loader />
            ) : historial.length === 0 ? (
              <p className="historial-maquina__empty">
                No se encontraron intervenciones para los filtros seleccionados.
              </p>
            ) : (
              <div className="historial-maquina__table-container">
                <table className="historial-maquina__table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Operario</th>
                      <th>Tiempo total</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((item) => (
                      <tr key={item.ordenId}>
                        <td>{formatFecha(item.fechaInicio)}</td>
                        <td>{item.tipoMantenimiento || '—'}</td>
                        <td>{item.operarioNombre || '—'}</td>
                        <td>{formatTiempoTotal(item.duracionMinutos)}</td>
                        <td>
                          <span
                            className="historial-maquina__badge"
                            style={{
                              backgroundColor: getEstadoColor(item.estado) + '20',
                              color: getEstadoColor(item.estado),
                            }}
                          >
                            {getEstadoLabel(item.estado)}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="historial-maquina__link"
                            onClick={() => handleVerInforme(item.ordenId, item.informeId)}
                          >
                            {item.informeId ? 'Ver informe' : 'Ver orden'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

