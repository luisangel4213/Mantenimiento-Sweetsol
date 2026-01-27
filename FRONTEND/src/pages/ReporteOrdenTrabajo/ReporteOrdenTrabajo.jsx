import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, Loader, FirmaCanvas } from '../../components'
import { mantenimientoService } from '../../services'
import { exportarOrdenTrabajoPDF } from '../../utils'
import './ReporteOrdenTrabajo.css'

export const ReporteOrdenTrabajo = () => {
  const { ordenId } = useParams()
  const [orden, setOrden] = useState(null)
  const [loading, setLoading] = useState(true)

  const [datosReporte, setDatosReporte] = useState({
    tipoOrden: 'Orden de mantenimiento',
    ubicacionTecnica: '',
    emplazamiento: '',
    grupoPlanificador: 'Producción',
    responsablePtoTriba: 'Mantenimiento',
    responsable1: '',
    operacionesPlaneadas: [{ puestoTrabajo: '', descripcion: '', cantPersonas: '', horasTrabajo: '', horaInicio: '', horaFin: '', horasReales: '', ejecuto: false }],
    operacionesNoPlaneadas: [{ descripcion: '', horaInicio: '', horaFin: '', horasReales: '', ejecuto: false }],
    repuestos: [{ codigo: '', descripcion: '', cantidad: '', tipoPosicion: '', documento: '' }],
    observaciones: '',
    ejecutanteNombre: '',
    ejecutanteFecha: '',
    solicitanteNombre: '',
    solicitanteFecha: '',
    encargadoFecha: '',
  })

  const [firmas, setFirmas] = useState({
    ejecutante: null,
    solicitante: null,
    encargado: null,
  })

  useEffect(() => {
    if (!ordenId) return
    setLoading(true)
    mantenimientoService
      .getOrdenById(ordenId)
      .then((r) => {
        setOrden(r.data)
        // Si la orden ya tiene datosReporte guardado, usarlo directamente
        if (r.data.datosReporte) {
          setDatosReporte(r.data.datosReporte)
          if (r.data.datosReporte.firmas) {
            setFirmas(r.data.datosReporte.firmas)
          }
        } else {
          // Prellenar datos desde la orden (modo edición)
          const desc = r.data.descripcion || ''
          const lines = desc.split('\n')
          lines.forEach((line) => {
            if (line.startsWith('Solicitante:')) {
              setDatosReporte((prev) => ({
                ...prev,
                solicitanteNombre: line.replace('Solicitante:', '').trim(),
              }))
            }
          })
          if (r.data.asignadoANombre) {
            setDatosReporte((prev) => ({
              ...prev,
              ejecutanteNombre: r.data.asignadoANombre,
              responsable1: r.data.asignadoANombre,
            }))
          }
          if (r.data.trabajoRealizado) {
            setDatosReporte((prev) => ({
              ...prev,
              observaciones: r.data.trabajoRealizado,
            }))
          }
          // Prellenar fechas con fecha actual
          const hoy = new Date().toISOString().split('T')[0]
          setDatosReporte((prev) => ({
            ...prev,
            ejecutanteFecha: prev.ejecutanteFecha || hoy,
            solicitanteFecha: prev.solicitanteFecha || hoy,
            encargadoFecha: prev.encargadoFecha || hoy,
          }))
        }
      })
      .catch(() => setOrden(null))
      .finally(() => setLoading(false))
  }, [ordenId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setDatosReporte((prev) => ({ ...prev, [name]: value }))
  }

  const handleArrayChange = (arrayName, index, field, value) => {
    setDatosReporte((prev) => {
      const newArray = [...prev[arrayName]]
      newArray[index] = { ...newArray[index], [field]: value }
      return { ...prev, [arrayName]: newArray }
    })
  }

  const addArrayItem = (arrayName, template) => {
    setDatosReporte((prev) => ({
      ...prev,
      [arrayName]: [...prev[arrayName], { ...template }],
    }))
  }

  const removeArrayItem = (arrayName, index) => {
    setDatosReporte((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }))
  }

  const tieneDatosReporte = orden?.datosReporte != null
  const modoLectura = tieneDatosReporte

  const handleGenerarPDF = () => {
    if (!orden) return
    exportarOrdenTrabajoPDF(orden, datosReporte, firmas.ejecutante, firmas.solicitante, firmas.encargado)
  }

  if (loading) {
    return (
      <div className="reporte-orden-trabajo">
        <Loader />
      </div>
    )
  }

  if (!orden) {
    return (
      <div className="reporte-orden-trabajo">
        <p className="reporte-orden-trabajo__error">No se encontró la orden.</p>
        <Link to="/ordenes">Volver a órdenes</Link>
      </div>
    )
  }

  return (
    <div className="reporte-orden-trabajo">
      <div className="reporte-orden-trabajo__header">
        <Link to="/ordenes" className="reporte-orden-trabajo__back">← Volver</Link>
        <h1 className="page-title">Reporte de Orden de Trabajo</h1>
        <p className="reporte-orden-trabajo__orden">Orden #{orden.id}</p>
        {modoLectura && (
          <p className="reporte-orden-trabajo__modo-lectura">
            <strong>Modo lectura:</strong> Este reporte ya fue completado por el operario de mantenimiento.
          </p>
        )}
        {!tieneDatosReporte && (
          <p className="reporte-orden-trabajo__advertencia">
            <strong>Advertencia:</strong> Esta orden aún no tiene un reporte completo. El operario debe finalizar la orden primero.
          </p>
        )}
      </div>

      <Card title="Datos Adicionales">
        <div className="reporte-orden-trabajo__form">
          <div className="reporte-orden-trabajo__row">
            <div className="reporte-orden-trabajo__field">
              <label>Tipo de Orden</label>
              <input
                type="text"
                name="tipoOrden"
                value={datosReporte.tipoOrden || ''}
                onChange={handleChange}
                placeholder="Ej: Orden de mantenimiento Preventivo"
                readOnly={modoLectura}
                disabled={modoLectura}
              />
            </div>
            <div className="reporte-orden-trabajo__field">
              <label>Ubicación Técnica</label>
              <input
                type="text"
                name="ubicacionTecnica"
                value={datosReporte.ubicacionTecnica || ''}
                onChange={handleChange}
                placeholder="Ej: FABRICACION JARABES"
                readOnly={modoLectura}
                disabled={modoLectura}
              />
            </div>
          </div>

          <div className="reporte-orden-trabajo__row">
            <div className="reporte-orden-trabajo__field">
              <label>Emplazamiento</label>
              <input
                type="text"
                name="emplazamiento"
                value={datosReporte.emplazamiento || ''}
                onChange={handleChange}
                placeholder="Ej: Liquidos piso2"
                readOnly={modoLectura}
                disabled={modoLectura}
              />
            </div>
            <div className="reporte-orden-trabajo__field">
              <label>Grupo Planificador</label>
              <input
                type="text"
                name="grupoPlanificador"
                value={datosReporte.grupoPlanificador || ''}
                onChange={handleChange}
                readOnly={modoLectura}
                disabled={modoLectura}
              />
            </div>
          </div>

          <div className="reporte-orden-trabajo__row">
            <div className="reporte-orden-trabajo__field">
              <label>Resp. Pto Triba</label>
              <input
                type="text"
                name="responsablePtoTriba"
                value={datosReporte.responsablePtoTriba || ''}
                onChange={handleChange}
                readOnly={modoLectura}
                disabled={modoLectura}
              />
            </div>
            <div className="reporte-orden-trabajo__field">
              <label>Responsable 1</label>
              <input
                type="text"
                name="responsable1"
                value={datosReporte.responsable1 || ''}
                onChange={handleChange}
                readOnly={modoLectura}
                disabled={modoLectura}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Operaciones Planeadas">
        {datosReporte.operacionesPlaneadas.map((op, idx) => (
          <div key={idx} className="reporte-orden-trabajo__op-item">
            <div className="reporte-orden-trabajo__op-header">
              <strong>Operación {idx + 1}</strong>
              {datosReporte.operacionesPlaneadas.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('operacionesPlaneadas', idx)}
                  className="reporte-orden-trabajo__btn-remove"
                >
                  Eliminar
                </button>
              )}
            </div>
            <div className="reporte-orden-trabajo__op-fields">
              <input
                type="text"
                placeholder="Puesto de Trabajo"
                value={op.puestoTrabajo}
                onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'puestoTrabajo', e.target.value)}
              />
              <textarea
                placeholder="Descripción de la operación"
                value={op.descripcion}
                onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'descripcion', e.target.value)}
                rows={2}
              />
              <input
                type="text"
                placeholder="Cant. Personas"
                value={op.cantPersonas}
                onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'cantPersonas', e.target.value)}
              />
              <input
                type="text"
                placeholder="Horas Trabajo"
                value={op.horasTrabajo}
                onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'horasTrabajo', e.target.value)}
              />
              <input
                type="time"
                placeholder="Hora Inicio"
                value={op.horaInicio}
                onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'horaInicio', e.target.value)}
              />
              <input
                type="time"
                placeholder="Hora Fin"
                value={op.horaFin}
                onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'horaFin', e.target.value)}
              />
              <input
                type="text"
                placeholder="Horas Reales"
                value={op.horasReales}
                onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'horasReales', e.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  checked={op.ejecuto}
                  onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'ejecuto', e.target.checked)}
                />
                Ejecutó
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('operacionesPlaneadas', {
            puestoTrabajo: '',
            descripcion: '',
            cantPersonas: '',
            horasTrabajo: '',
            horaInicio: '',
            horaFin: '',
            horasReales: '',
            ejecuto: false,
          })}
          className="reporte-orden-trabajo__btn-add"
        >
          + Agregar Operación Planeada
        </button>
      </Card>

      <Card title="Operaciones Ejecutadas No Planeadas">
        {datosReporte.operacionesNoPlaneadas.map((op, idx) => (
          <div key={idx} className="reporte-orden-trabajo__op-item">
            <div className="reporte-orden-trabajo__op-header">
              <strong>Operación {idx + 1}</strong>
              {datosReporte.operacionesNoPlaneadas.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('operacionesNoPlaneadas', idx)}
                  className="reporte-orden-trabajo__btn-remove"
                >
                  Eliminar
                </button>
              )}
            </div>
            <div className="reporte-orden-trabajo__op-fields">
              <textarea
                placeholder="Descripción de la operación"
                value={op.descripcion}
                onChange={(e) => handleArrayChange('operacionesNoPlaneadas', idx, 'descripcion', e.target.value)}
                rows={2}
              />
              <input
                type="time"
                placeholder="Hora Inicio"
                value={op.horaInicio}
                onChange={(e) => handleArrayChange('operacionesNoPlaneadas', idx, 'horaInicio', e.target.value)}
              />
              <input
                type="time"
                placeholder="Hora Fin"
                value={op.horaFin}
                onChange={(e) => handleArrayChange('operacionesNoPlaneadas', idx, 'horaFin', e.target.value)}
              />
              <input
                type="text"
                placeholder="Horas Reales"
                value={op.horasReales}
                onChange={(e) => handleArrayChange('operacionesNoPlaneadas', idx, 'horasReales', e.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  checked={op.ejecuto}
                  onChange={(e) => handleArrayChange('operacionesNoPlaneadas', idx, 'ejecuto', e.target.checked)}
                />
                Ejecutó
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('operacionesNoPlaneadas', {
            descripcion: '',
            horaInicio: '',
            horaFin: '',
            horasReales: '',
            ejecuto: false,
          })}
          className="reporte-orden-trabajo__btn-add"
        >
          + Agregar Operación No Planeada
        </button>
      </Card>

      <Card title="Repuestos">
        {datosReporte.repuestos.map((rep, idx) => (
          <div key={idx} className="reporte-orden-trabajo__op-item">
            <div className="reporte-orden-trabajo__op-header">
              <strong>Repuesto {idx + 1}</strong>
              {datosReporte.repuestos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('repuestos', idx)}
                  className="reporte-orden-trabajo__btn-remove"
                >
                  Eliminar
                </button>
              )}
            </div>
            <div className="reporte-orden-trabajo__op-fields">
              <input
                type="text"
                placeholder="Código"
                value={rep.codigo}
                onChange={(e) => handleArrayChange('repuestos', idx, 'codigo', e.target.value)}
              />
              <input
                type="text"
                placeholder="Descripción"
                value={rep.descripcion}
                onChange={(e) => handleArrayChange('repuestos', idx, 'descripcion', e.target.value)}
              />
              <input
                type="text"
                placeholder="Cantidad"
                value={rep.cantidad}
                onChange={(e) => handleArrayChange('repuestos', idx, 'cantidad', e.target.value)}
              />
              <input
                type="text"
                placeholder="Tipo Posición"
                value={rep.tipoPosicion}
                onChange={(e) => handleArrayChange('repuestos', idx, 'tipoPosicion', e.target.value)}
              />
              <input
                type="text"
                placeholder="Documento"
                value={rep.documento}
                onChange={(e) => handleArrayChange('repuestos', idx, 'documento', e.target.value)}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('repuestos', {
            codigo: '',
            descripcion: '',
            cantidad: '',
            tipoPosicion: '',
            documento: '',
          })}
          className="reporte-orden-trabajo__btn-add"
        >
          + Agregar Repuesto
        </button>
      </Card>

      <Card title="Observaciones">
        <textarea
          name="observaciones"
          value={datosReporte.observaciones}
          onChange={handleChange}
          placeholder="Ingrese las observaciones del trabajo realizado..."
          rows={6}
          className="reporte-orden-trabajo__textarea"
        />
      </Card>

      <Card title="Firmas">
        <div className="reporte-orden-trabajo__firmas">
          <div className="reporte-orden-trabajo__firma-item">
            <h4>Ejecutante</h4>
            <input
              type="text"
              placeholder="Nombre del ejecutante"
              value={datosReporte.ejecutanteNombre}
              onChange={(e) => setDatosReporte((prev) => ({ ...prev, ejecutanteNombre: e.target.value }))}
            />
            <input
              type="date"
              placeholder="Fecha"
              value={datosReporte.ejecutanteFecha}
              onChange={(e) => setDatosReporte((prev) => ({ ...prev, ejecutanteFecha: e.target.value }))}
            />
            <FirmaCanvas
              onChange={(firma) => setFirmas((prev) => ({ ...prev, ejecutante: firma }))}
              width={300}
              height={120}
            />
          </div>

          <div className="reporte-orden-trabajo__firma-item">
            <h4>Cliente interno (Solicitante)</h4>
            <input
              type="text"
              placeholder="Nombre del solicitante"
              value={datosReporte.solicitanteNombre}
              onChange={(e) => setDatosReporte((prev) => ({ ...prev, solicitanteNombre: e.target.value }))}
            />
            <input
              type="date"
              placeholder="Fecha"
              value={datosReporte.solicitanteFecha}
              onChange={(e) => setDatosReporte((prev) => ({ ...prev, solicitanteFecha: e.target.value }))}
            />
            <FirmaCanvas
              onChange={(firma) => setFirmas((prev) => ({ ...prev, solicitante: firma }))}
              width={300}
              height={120}
            />
          </div>

          <div className="reporte-orden-trabajo__firma-item">
            <h4>Encargado Mantenimiento</h4>
            <input
              type="date"
              placeholder="Fecha"
              value={datosReporte.encargadoFecha}
              onChange={(e) => setDatosReporte((prev) => ({ ...prev, encargadoFecha: e.target.value }))}
            />
            <FirmaCanvas
              onChange={(firma) => setFirmas((prev) => ({ ...prev, encargado: firma }))}
              width={300}
              height={120}
            />
          </div>
        </div>
      </Card>

      {tieneDatosReporte && (
        <Card title="Generar Reporte">
          <p className="reporte-orden-trabajo__text">
            Puede descargar el reporte completo tal como fue guardado por el operario de mantenimiento.
          </p>
          <button
            type="button"
            onClick={handleGenerarPDF}
            className="reporte-orden-trabajo__btn-generar"
          >
            Descargar PDF de Orden de Trabajo
          </button>
        </Card>
      )}
    </div>
  )
}
