import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth, useMantenimiento } from '../../context'
import { ROLES, ESTADOS_ORDEN, INFORME_TECNICO_ROLES } from '../../constants'
import { Card, Loader, FirmaCanvas } from '../../components'
import { mantenimientoService, authService } from '../../services'
import './OrdenDetalle.css'

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  en_progreso: 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
}

export const OrdenDetalle = () => {
  const { id } = useParams()
  const { hasAnyRole, hasRole, user } = useAuth()
  const { actualizarOrden, subirEvidencias, error, clearError } = useMantenimiento()

  const [orden, setOrden] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [subiendoEvidencias, setSubiendoEvidencias] = useState(false)
  const [operarios, setOperarios] = useState([])
  const [loadingOperarios, setLoadingOperarios] = useState(false)
  const [asignadoA, setAsignadoA] = useState('')
  const [asignando, setAsignando] = useState(false)
  const [evidenciasFiles, setEvidenciasFiles] = useState([])
  // Estados para jefe de mantenimiento
  const [prioridadEdit, setPrioridadEdit] = useState('media')
  const [fechaRealizacion, setFechaRealizacion] = useState('')
  const [actualizandoOrden, setActualizandoOrden] = useState(false)

  // Estados para formulario de finalización completo
  const [datosReporte, setDatosReporte] = useState({
    tipoOrden: 'Orden de mantenimiento',
    ubicacionTecnica: '',
    emplazamiento: '',
    grupoPlanificador: 'Producción',
    responsablePtoTriba: 'Mantenimiento',
    responsable1: user?.nombre || '',
    operacionesPlaneadas: [{ puestoTrabajo: '', descripcion: '', cantPersonas: '', horasTrabajo: '', horaInicio: '', horaFin: '', horasReales: '', ejecuto: false }],
    operacionesNoPlaneadas: [{ descripcion: '', horaInicio: '', horaFin: '', horasReales: '', ejecuto: false }],
    repuestos: [{ codigo: '', descripcion: '', cantidad: '', tipoPosicion: '', documento: '' }],
    observaciones: '',
    ejecutanteNombre: user?.nombre || '',
    ejecutanteFecha: new Date().toISOString().split('T')[0],
    solicitanteNombre: '',
    solicitanteFecha: new Date().toISOString().split('T')[0],
    encargadoFecha: new Date().toISOString().split('T')[0],
  })

  const [firmas, setFirmas] = useState({
    ejecutante: null,
    solicitante: null,
    encargado: null,
  })

  const puedeAtender = hasAnyRole([ROLES.OPERARIO_MANTENIMIENTO, ROLES.JEFE_MANTENIMIENTO])
  const esJefe = hasRole(ROLES.JEFE_MANTENIMIENTO)
  const esOperario = hasRole(ROLES.OPERARIO_MANTENIMIENTO)
  const puedeInforme = hasAnyRole(INFORME_TECNICO_ROLES)
  const estado = orden?.estado || ESTADOS_ORDEN.PENDIENTE

  // Extraer información de la descripción
  const extraerInfoDescripcion = (descripcion) => {
    if (!descripcion) return { area: '', maquina: '', tipoM: '', descripcionReal: '', solicitanteNombre: '' }
    const lines = descripcion.split('\n')
    let area = ''
    let maquina = ''
    let tipoM = ''
    let solicitanteNombre = ''
    let descripcionReal = ''
    
    // Encontrar el índice donde terminan los metadatos
    let indiceFinMetadatos = -1
    let encontroDatos = false
    
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim()
      
      if (trimmed.startsWith('Área:')) {
        area = trimmed.replace('Área:', '').trim()
      } else if (trimmed.startsWith('Máquina:')) {
        maquina = trimmed.replace('Máquina:', '').trim()
      } else if (trimmed.startsWith('Tipo M:')) {
        tipoM = trimmed.replace('Tipo M:', '').trim()
      } else if (trimmed.startsWith('Solicitante:')) {
        solicitanteNombre = trimmed.replace('Solicitante:', '').trim()
      } else if (trimmed.startsWith('Datos:')) {
        encontroDatos = true
        // Después de "Datos:" y una línea vacía, viene la descripción
        if (i + 1 < lines.length && lines[i + 1].trim() === '') {
          indiceFinMetadatos = i + 1
          break
        }
      }
    }
    
    // Si no encontramos "Datos:", buscar después de "Solicitante:" y una línea vacía
    if (indiceFinMetadatos === -1) {
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim()
        if (trimmed.startsWith('Solicitante:')) {
          // Buscar línea vacía después de "Solicitante:"
          if (i + 1 < lines.length && lines[i + 1].trim() === '') {
            indiceFinMetadatos = i + 1
            break
          }
        }
      }
    }
    
    // Extraer la descripción real (todo después de los metadatos)
    if (indiceFinMetadatos >= 0 && indiceFinMetadatos + 1 < lines.length) {
      descripcionReal = lines
        .slice(indiceFinMetadatos + 1)
        .map((l) => l.trim())
        .filter((l) => l !== '')
        .join('\n')
        .trim()
    }
    
    return { area, maquina, tipoM, descripcionReal, solicitanteNombre }
  }

  // Extraer área y máquina de la descripción para uso en el componente
  const infoOrden = orden ? extraerInfoDescripcion(orden.descripcion || '') : { area: '', maquina: '' }
  const area = infoOrden.area
  const maquina = infoOrden.maquina

  useEffect(() => {
    if (!id) return
    setLoading(true)
    mantenimientoService
      .getOrdenById(id)
      .then((r) => {
        setOrden(r.data)
        if (r.data.asignadoA) {
          setAsignadoA(String(r.data.asignadoA))
        }
        // Inicializar estados para jefe
        if (r.data.prioridad) {
          setPrioridadEdit(r.data.prioridad)
        }
        if (r.data.fechaInicio) {
          const fecha = new Date(r.data.fechaInicio).toISOString().split('T')[0]
          setFechaRealizacion(fecha)
        }
      })
      .catch(() => setOrden(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (error) clearError()
  }, [error, clearError])

  // Cargar operarios para asignación
  useEffect(() => {
    if (esJefe && estado === ESTADOS_ORDEN.PENDIENTE) {
      setLoadingOperarios(true)
      authService
        .getOperarios()
        .then((r) => setOperarios(r.data || []))
        .catch(() => setOperarios([]))
        .finally(() => setLoadingOperarios(false))
    }
  }, [esJefe, estado])

  // Pre-llenar datos desde la orden automáticamente
  useEffect(() => {
    if (orden) {
      const info = extraerInfoDescripcion(orden.descripcion || '')
      
      // Pre-llenar datos adicionales
      const nuevosDatos = {}
      
      // Tipo M → Tipo de Orden
      if (info.tipoM) {
        nuevosDatos.tipoOrden = info.tipoM
      }
      
      // Área → Ubicación Técnica
      if (info.area) {
        nuevosDatos.ubicacionTecnica = info.area
      }
      
      // Descripción real → Emplazamiento
      if (info.descripcionReal) {
        nuevosDatos.emplazamiento = info.descripcionReal
      }
      
      // Nombre del solicitante
      if (info.solicitanteNombre) {
        nuevosDatos.solicitanteNombre = info.solicitanteNombre
      }
      
      // Actualizar datos del reporte
      setDatosReporte((prev) => {
        const actualizado = { ...prev, ...nuevosDatos }
        
        // Nombre de la máquina → Puesto de Trabajo (en la primera operación planeada)
        if (info.maquina) {
          if (prev.operacionesPlaneadas && prev.operacionesPlaneadas.length > 0) {
            // Si ya hay operaciones, actualizar solo el puesto de trabajo de la primera
            actualizado.operacionesPlaneadas = [
              { ...prev.operacionesPlaneadas[0], puestoTrabajo: info.maquina },
              ...prev.operacionesPlaneadas.slice(1),
            ]
          } else {
            // Si no hay operaciones, crear una nueva con el puesto de trabajo
            actualizado.operacionesPlaneadas = [
              {
                puestoTrabajo: info.maquina,
                descripcion: '',
                cantPersonas: '',
                horasTrabajo: '',
                horaInicio: '',
                horaFin: '',
                horasReales: '',
                ejecuto: false,
              },
            ]
          }
        }
        
        return actualizado
      })
      
      // Actualizar ejecutante y responsable si está asignado
      if (orden.asignadoANombre) {
        setDatosReporte((prev) => ({
          ...prev,
          ejecutanteNombre: orden.asignadoANombre,
          responsable1: orden.asignadoANombre,
        }))
      }
    }
  }, [orden])

  const handleChange = (e) => {
    const { name, value } = e.target
    setDatosReporte((prev) => ({ ...prev, [name]: value }))
  }

  // Función para calcular horas reales entre hora de inicio y fin
  const calcularHorasReales = (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) return ''
    
    try {
      // Parsear las horas en formato HH:MM
      const [hInicio, mInicio] = horaInicio.split(':').map(Number)
      const [hFin, mFin] = horaFin.split(':').map(Number)
      
      // Convertir a minutos desde medianoche
      const minutosInicio = hInicio * 60 + mInicio
      const minutosFin = hFin * 60 + mFin
      
      // Calcular diferencia en minutos
      let diferenciaMinutos = minutosFin - minutosInicio
      
      // Si la diferencia es negativa, significa que cruzó la medianoche (día siguiente)
      if (diferenciaMinutos < 0) {
        diferenciaMinutos += 24 * 60 // Agregar 24 horas (1440 minutos)
      }
      
      // Convertir minutos a horas y minutos
      const horas = Math.floor(diferenciaMinutos / 60)
      const minutos = diferenciaMinutos % 60
      
      // Formatear como "Xh Ym" o "Xh" si no hay minutos
      if (minutos === 0) {
        return `${horas}h`
      } else {
        return `${horas}h ${minutos}m`
      }
    } catch (error) {
      return ''
    }
  }

  const handleArrayChange = (arrayName, index, field, value) => {
    setDatosReporte((prev) => {
      const newArray = [...prev[arrayName]]
      const updatedItem = { ...newArray[index], [field]: value }
      
      // Si se actualiza horaInicio o horaFin en operaciones planeadas o no planeadas, calcular horasReales
      if ((arrayName === 'operacionesPlaneadas' || arrayName === 'operacionesNoPlaneadas') && 
          (field === 'horaInicio' || field === 'horaFin')) {
        const horaInicio = field === 'horaInicio' ? value : updatedItem.horaInicio
        const horaFin = field === 'horaFin' ? value : updatedItem.horaFin
        
        if (horaInicio && horaFin) {
          updatedItem.horasReales = calcularHorasReales(horaInicio, horaFin)
        } else {
          updatedItem.horasReales = ''
        }
      }
      
      newArray[index] = updatedItem
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

  // Función para calcular fecha sugerida según prioridad
  const calcularFechaSugerida = (prioridad) => {
    const hoy = new Date()
    switch (prioridad) {
      case 'alta':
        // Alta: hoy mismo o mañana
        return hoy.toISOString().split('T')[0]
      case 'media':
        // Media: en 3-5 días
        hoy.setDate(hoy.getDate() + 4)
        return hoy.toISOString().split('T')[0]
      case 'baja':
        // Baja: en 7-10 días
        hoy.setDate(hoy.getDate() + 8)
        return hoy.toISOString().split('T')[0]
      default:
        return ''
    }
  }

  // Actualizar fecha sugerida cuando cambia la prioridad (solo si no hay fecha ya establecida)
  useEffect(() => {
    if (esJefe && estado === ESTADOS_ORDEN.PENDIENTE && prioridadEdit) {
      const fechaSugerida = calcularFechaSugerida(prioridadEdit)
      // Solo actualizar si no hay fecha o si la fecha actual es muy antigua
      if (!fechaRealizacion || (fechaRealizacion && new Date(fechaRealizacion) < new Date())) {
        setFechaRealizacion(fechaSugerida)
      }
    }
  }, [prioridadEdit, esJefe, estado])

  // Función para actualizar orden (prioridad y fecha)
  const handleActualizarOrden = async () => {
    if (!orden) return
    setActualizandoOrden(true)
    try {
      const updateData = {}
      if (prioridadEdit !== orden.prioridad) {
        updateData.prioridad = prioridadEdit
      }
      if (fechaRealizacion) {
        // Convertir fecha a formato MySQL: YYYY-MM-DD HH:MM:SS
        // Si solo hay fecha, usar medianoche
        updateData.fechaInicio = `${fechaRealizacion} 00:00:00`
      }
      
      if (Object.keys(updateData).length > 0) {
        const { data } = await mantenimientoService.updateOrden(id, updateData)
        setOrden((o) => (o ? { ...o, ...data } : o))
      }
    } catch (err) {
      console.error('Error al actualizar orden:', err)
      alert('Error al actualizar la orden. Por favor, intente nuevamente.')
    } finally {
      setActualizandoOrden(false)
    }
  }

  const handleAsignar = async (e) => {
    e.preventDefault()
    if (!asignadoA) return
    
    // Primero actualizar prioridad y fecha si es necesario
    if (prioridadEdit !== orden.prioridad || fechaRealizacion) {
      await handleActualizarOrden()
    }
    
    setAsignando(true)
    try {
      const { data } = await mantenimientoService.asignarOrden(id, Number(asignadoA))
      setOrden((o) => (o ? { ...o, ...data } : o))
      setAsignadoA('')
    } catch (err) {
      console.error('Error al asignar:', err)
      alert('Error al asignar la orden. Por favor, intente nuevamente.')
    } finally {
      setAsignando(false)
    }
  }

  const marcarEnCurso = async () => {
    setSaving(true)
    try {
      const { data } = await mantenimientoService.iniciarOrden(id)
      setOrden((o) => (o ? { ...o, estado: ESTADOS_ORDEN.EN_PROGRESO, ...data } : o))
    } catch (err) {
      console.error('Error al iniciar orden:', err)
      alert('Error al iniciar la orden. Por favor, intente nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleFinalizar = async (e) => {
    e.preventDefault()
    
    // Validaciones básicas
    if (!datosReporte.ejecutanteNombre) {
      alert('El nombre del ejecutante es requerido')
      return
    }

    setSaving(true)
    try {
      // Construir trabajo realizado como resumen (para compatibilidad)
      let trabajoRealizado = `OPERACIONES PLANEADAS\n`
      trabajoRealizado += `Área de trabajo: ${area || '—'}\n`
      trabajoRealizado += `Máquina: ${maquina || '—'}\n\n`
      trabajoRealizado += `Operador: ${datosReporte.ejecutanteNombre}\n`
      if (datosReporte.observaciones) {
        trabajoRealizado += `Observaciones: ${datosReporte.observaciones}\n`
      }

      // Construir objeto datosReporte completo con firmas
      // La firma del encargado NO se guarda aquí, solo se agrega desde la vista del jefe de mantenimiento
      const datosReporteCompleto = {
        ...datosReporte,
        firmas: {
          ejecutante: firmas.ejecutante,
          solicitante: firmas.solicitante,
          // encargado: se agrega solo desde la vista del jefe de mantenimiento (InformeTecnico)
        },
      }

      // Llamar al servicio de finalización con datosReporte
      const { data } = await mantenimientoService.finalizarOrden(id, {
        trabajoRealizado,
        datosReporte: datosReporteCompleto,
      })
      
      setOrden((o) => (o ? { ...o, estado: ESTADOS_ORDEN.COMPLETADA, trabajoRealizado, datosReporte: datosReporteCompleto, ...data } : o))
    } catch (err) {
      console.error('Error al finalizar:', err)
      alert('Error al finalizar la orden. Por favor, intente nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const subirEvidenciasHandler = async (e) => {
    e.preventDefault()
    const files = evidenciasFiles
    if (!files.length) return
    setSubiendoEvidencias(true)
    try {
      const data = await subirEvidencias(id, files)
      setOrden((o) => (o ? { ...o, ...data, evidencias: data?.evidencias ?? o.evidencias ?? [] } : o))
      setEvidenciasFiles([])
      const input = document.getElementById('orden-evidencias-input')
      if (input) input.value = ''
    } finally {
      setSubiendoEvidencias(false)
    }
  }

  if (loading) {
    return (
      <div className="orden-detalle">
        <Loader />
      </div>
    )
  }

  if (!orden) {
    return (
      <div className="orden-detalle">
        <p className="orden-detalle__error">No se encontró la orden.</p>
        <Link to="/ordenes">Volver al listado</Link>
      </div>
    )
  }

  const evidencias = Array.isArray(orden.evidencias) ? orden.evidencias : []

  return (
    <div className="orden-detalle">
      <div className="orden-detalle__header">
        <Link to="/ordenes" className="orden-detalle__back">← Volver al listado</Link>
        <h1 className="page-title">Orden #{orden.id}</h1>
        <p className="orden-detalle__estado">
          Estado: <span className={`orden-detalle__estado-badge orden-detalle__estado-badge--${estado}`}>
            {ESTADO_LABEL[estado] || estado}
          </span>
        </p>
        {orden.asignadoANombre && (
          <p className="orden-detalle__asignado">
            Asignado a: <strong>{orden.asignadoANombre}</strong>
          </p>
        )}
      </div>

      {error && (
        <div className="orden-detalle__error-msg" role="alert">{error}</div>
      )}

      {/* Información detallada de la orden - Mejorada para jefe */}
      {esJefe && (
        <Card title="Información de la Orden">
          <div className="orden-detalle__info-detallada">
            <div className="orden-detalle__info-row">
              <div className="orden-detalle__info-item">
                <strong>Título:</strong>
                <p>{orden.titulo || '—'}</p>
              </div>
            </div>
            <div className="orden-detalle__info-row">
              <div className="orden-detalle__info-item">
                <strong>Área:</strong>
                <p>{infoOrden.area || '—'}</p>
              </div>
              <div className="orden-detalle__info-item">
                <strong>Máquina:</strong>
                <p>{infoOrden.maquina || '—'}</p>
              </div>
            </div>
            <div className="orden-detalle__info-row">
              <div className="orden-detalle__info-item">
                <strong>Tipo M:</strong>
                <p>{infoOrden.tipoM || '—'}</p>
              </div>
              <div className="orden-detalle__info-item">
                <strong>Solicitante:</strong>
                <p>{infoOrden.solicitanteNombre || '—'}</p>
              </div>
            </div>
            <div className="orden-detalle__info-row">
              <div className="orden-detalle__info-item">
                <strong>Prioridad actual:</strong>
                <span className={`orden-detalle__prioridad-badge orden-detalle__prioridad-badge--${orden.prioridad || 'media'}`}>
                  {orden.prioridad === 'alta' ? 'Alta' : orden.prioridad === 'baja' ? 'Baja' : 'Media'}
                </span>
              </div>
              <div className="orden-detalle__info-item">
                <strong>Fecha de inicio:</strong>
                <p>{orden.fechaInicio ? new Date(orden.fechaInicio).toLocaleDateString('es-CO') : 'No asignada'}</p>
              </div>
            </div>
            <div className="orden-detalle__info-row">
              <div className="orden-detalle__info-item orden-detalle__info-item--full">
                <strong>Descripción:</strong>
                <p className="orden-detalle__desc-texto">{infoOrden.descripcionReal || orden.descripcion || '—'}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Card simple para otros usuarios */}
      {!esJefe && (
        <Card title={orden.titulo || orden.descripcion || 'Sin título'}>
          <p className="orden-detalle__desc">{orden.descripcion || orden.titulo || 'Sin descripción.'}</p>
        </Card>
      )}

      {/* Configuración y asignación de orden - Solo para jefe de mantenimiento */}
      {esJefe && estado === ESTADOS_ORDEN.PENDIENTE && (
        <>
          <Card title="Configurar Orden">
            <div className="orden-detalle__form-configurar">
              <div className="orden-detalle__row">
                <div className="orden-detalle__field">
                  <label className="orden-detalle__label">
                    Prioridad
                  </label>
                  <select
                    value={prioridadEdit}
                    onChange={(e) => setPrioridadEdit(e.target.value)}
                    className="orden-detalle__select"
                    disabled={actualizandoOrden}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                  <p className="orden-detalle__help-text">
                    {prioridadEdit === 'alta' && 'Se sugiere realizar hoy o mañana'}
                    {prioridadEdit === 'media' && 'Se sugiere realizar en 3-5 días'}
                    {prioridadEdit === 'baja' && 'Se sugiere realizar en 7-10 días'}
                  </p>
                </div>
                <div className="orden-detalle__field">
                  <label className="orden-detalle__label">
                    Fecha de Realización
                  </label>
                  <input
                    type="date"
                    value={fechaRealizacion}
                    onChange={(e) => setFechaRealizacion(e.target.value)}
                    className="orden-detalle__input"
                    min={new Date().toISOString().split('T')[0]}
                    disabled={actualizandoOrden}
                  />
                  <p className="orden-detalle__help-text">
                    Fecha programada para realizar el trabajo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleActualizarOrden}
                className="orden-detalle__btn orden-detalle__btn--secondary"
                disabled={actualizandoOrden || (prioridadEdit === orden.prioridad && !fechaRealizacion)}
              >
                {actualizandoOrden ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </Card>

          <Card title="Asignar Orden">
            <form onSubmit={handleAsignar} className="orden-detalle__form-asignar">
              <label className="orden-detalle__label">
                Asignar a operario de mantenimiento
                {loadingOperarios ? (
                  <Loader />
                ) : (
                  <select
                    value={asignadoA}
                    onChange={(e) => setAsignadoA(e.target.value)}
                    className="orden-detalle__select"
                    required
                    disabled={asignando}
                  >
                    <option value="">Seleccione un operario</option>
                    {operarios.length > 0 ? (
                      operarios.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.nombre} ({op.usuario})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No hay operarios disponibles</option>
                    )}
                  </select>
                )}
              </label>
              <button
                type="submit"
                className="orden-detalle__btn orden-detalle__btn--primary"
                disabled={asignando || !asignadoA || operarios.length === 0}
              >
                {asignando ? 'Asignando...' : 'Asignar Orden'}
              </button>
            </form>
          </Card>
        </>
      )}

      {/* Marcar en curso - Solo para operario */}
      {esOperario && estado === ESTADOS_ORDEN.PENDIENTE && (
        <Card title="Acciones">
          <p className="orden-detalle__texto">
            {orden.asignadoA ? (
              <>Esta orden está asignada. Puede marcarla como en curso para comenzar el trabajo.</>
            ) : (
              <>Esta orden no está asignada. Puede iniciarla y se le asignará automáticamente.</>
            )}
          </p>
          <button
            type="button"
            className="orden-detalle__btn orden-detalle__btn--primary"
            onClick={marcarEnCurso}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Marcar EN CURSO'}
          </button>
        </Card>
      )}

      {/* Formulario de finalización completo - Solo para operario */}
      {esOperario && estado === ESTADOS_ORDEN.EN_PROGRESO && (
        <>
          <Card title="Información de la Orden">
            <div className="orden-detalle__info-auto">
              <p><strong>Área de trabajo:</strong> {area || '—'}</p>
              <p><strong>Máquina:</strong> {maquina || '—'}</p>
            </div>
          </Card>

          <form onSubmit={handleFinalizar}>
            <Card title="Datos Adicionales">
              <div className="orden-detalle__form-finalizar">
                <div className="orden-detalle__row">
                  <div className="orden-detalle__field">
                    <label className="orden-detalle__label">Tipo de Orden</label>
                    <input
                      type="text"
                      name="tipoOrden"
                      value={datosReporte.tipoOrden}
                      onChange={handleChange}
                      placeholder="Ej: Orden de mantenimiento Preventivo"
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                  </div>
                  <div className="orden-detalle__field">
                    <label className="orden-detalle__label">Ubicación Técnica</label>
                    <input
                      type="text"
                      name="ubicacionTecnica"
                      value={datosReporte.ubicacionTecnica}
                      onChange={handleChange}
                      placeholder="Ej: FABRICACION JARABES"
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="orden-detalle__row">
                  <div className="orden-detalle__field">
                    <label className="orden-detalle__label">Emplazamiento</label>
                    <input
                      type="text"
                      name="emplazamiento"
                      value={datosReporte.emplazamiento}
                      onChange={handleChange}
                      placeholder="Ej: Liquidos piso2"
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                  </div>
                  <div className="orden-detalle__field">
                    <label className="orden-detalle__label">Grupo Planificador</label>
                    <input
                      type="text"
                      name="grupoPlanificador"
                      value={datosReporte.grupoPlanificador}
                      onChange={handleChange}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="orden-detalle__row">
                  <div className="orden-detalle__field">
                    <label className="orden-detalle__label">Resp. Pto Triba</label>
                    <input
                      type="text"
                      name="responsablePtoTriba"
                      value={datosReporte.responsablePtoTriba}
                      onChange={handleChange}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                  </div>
                  <div className="orden-detalle__field">
                    <label className="orden-detalle__label">Responsable 1</label>
                    <input
                      type="text"
                      name="responsable1"
                      value={datosReporte.responsable1}
                      onChange={handleChange}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Operaciones Planeadas">
              {datosReporte.operacionesPlaneadas.map((op, idx) => (
                <div key={idx} className="orden-detalle__op-item">
                  <div className="orden-detalle__op-header">
                    <strong>Operación {idx + 1}</strong>
                    {datosReporte.operacionesPlaneadas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('operacionesPlaneadas', idx)}
                        className="orden-detalle__btn-remove"
                        disabled={saving}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <div className="orden-detalle__op-fields">
                    <input
                      type="text"
                      placeholder="Puesto de Trabajo"
                      value={op.puestoTrabajo}
                      onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'puestoTrabajo', e.target.value)}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                    <textarea
                      placeholder="Descripción de la operación"
                      value={op.descripcion}
                      onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'descripcion', e.target.value)}
                      rows={2}
                      className="orden-detalle__textarea"
                      disabled={saving}
                    />
                    <input
                      type="text"
                      placeholder="Cant. Personas"
                      value={op.cantPersonas}
                      onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'cantPersonas', e.target.value)}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                    <input
                      type="text"
                      placeholder="Horas Trabajo"
                      value={op.horasTrabajo}
                      onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'horasTrabajo', e.target.value)}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                    <input
                      type="time"
                      placeholder="Hora Inicio"
                      value={op.horaInicio}
                      onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'horaInicio', e.target.value)}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                    <input
                      type="time"
                      placeholder="Hora Fin"
                      value={op.horaFin}
                      onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'horaFin', e.target.value)}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                    <input
                      type="text"
                      placeholder="Horas Reales (calculado automáticamente)"
                      value={op.horasReales}
                      readOnly
                      className="orden-detalle__input orden-detalle__input--readonly"
                      disabled={saving}
                      title="Se calcula automáticamente según hora de inicio y fin"
                    />
                    <label className="orden-detalle__checkbox-label">
                      <input
                        type="checkbox"
                        checked={op.ejecuto}
                        onChange={(e) => handleArrayChange('operacionesPlaneadas', idx, 'ejecuto', e.target.checked)}
                        disabled={saving}
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
                className="orden-detalle__btn-add"
                disabled={saving}
              >
                + Agregar Operación Planeada
              </button>
            </Card>

            <Card title="Operaciones Ejecutadas No Planeadas">
              {datosReporte.operacionesNoPlaneadas.map((op, idx) => (
                <div key={idx} className="orden-detalle__op-item">
                  <div className="orden-detalle__op-header">
                    <strong>Operación {idx + 1}</strong>
                    {datosReporte.operacionesNoPlaneadas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('operacionesNoPlaneadas', idx)}
                        className="orden-detalle__btn-remove"
                        disabled={saving}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <div className="orden-detalle__op-fields">
                    <textarea
                      placeholder="Descripción de la operación"
                      value={op.descripcion}
                      onChange={(e) => handleArrayChange('operacionesNoPlaneadas', idx, 'descripcion', e.target.value)}
                      rows={2}
                      className="orden-detalle__textarea"
                      disabled={saving}
                    />
                    <input
                      type="time"
                      placeholder="Hora Inicio"
                      value={op.horaInicio}
                      onChange={(e) => handleArrayChange('operacionesNoPlaneadas', idx, 'horaInicio', e.target.value)}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                    <input
                      type="time"
                      placeholder="Hora Fin"
                      value={op.horaFin}
                      onChange={(e) => handleArrayChange('operacionesNoPlaneadas', idx, 'horaFin', e.target.value)}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                    <input
                      type="text"
                      placeholder="Horas Reales (calculado automáticamente)"
                      value={op.horasReales}
                      readOnly
                      className="orden-detalle__input orden-detalle__input--readonly"
                      disabled={saving}
                      title="Se calcula automáticamente según hora de inicio y fin"
                    />
                    <label className="orden-detalle__checkbox-label">
                      <input
                        type="checkbox"
                        checked={op.ejecuto}
                        onChange={(e) => handleArrayChange('operacionesNoPlaneadas', idx, 'ejecuto', e.target.checked)}
                        disabled={saving}
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
                className="orden-detalle__btn-add"
                disabled={saving}
              >
                + Agregar Operación No Planeada
              </button>
            </Card>

            <Card title="Repuestos">
              {datosReporte.repuestos.map((rep, idx) => (
                <div key={idx} className="orden-detalle__op-item">
                  <div className="orden-detalle__op-header">
                    <strong>Repuesto {idx + 1}</strong>
                    {datosReporte.repuestos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('repuestos', idx)}
                        className="orden-detalle__btn-remove"
                        disabled={saving}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <div className="orden-detalle__op-fields">
                    <input
                      type="text"
                      placeholder="Código"
                      value={rep.codigo}
                      onChange={(e) => handleArrayChange('repuestos', idx, 'codigo', e.target.value)}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                    <input
                      type="text"
                      placeholder="Descripción"
                      value={rep.descripcion}
                      onChange={(e) => handleArrayChange('repuestos', idx, 'descripcion', e.target.value)}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                    <input
                      type="text"
                      placeholder="Cantidad"
                      value={rep.cantidad}
                      onChange={(e) => handleArrayChange('repuestos', idx, 'cantidad', e.target.value)}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                    <input
                      type="text"
                      placeholder="Tipo Posición"
                      value={rep.tipoPosicion}
                      onChange={(e) => handleArrayChange('repuestos', idx, 'tipoPosicion', e.target.value)}
                      className="orden-detalle__input"
                      disabled={saving}
                    />
                    <input
                      type="text"
                      placeholder="Documento"
                      value={rep.documento}
                      onChange={(e) => handleArrayChange('repuestos', idx, 'documento', e.target.value)}
                      className="orden-detalle__input"
                      disabled={saving}
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
                className="orden-detalle__btn-add"
                disabled={saving}
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
                className="orden-detalle__textarea"
                disabled={saving}
              />
            </Card>

            <Card title="Firmas">
              <div className="orden-detalle__firmas">
                <div className="orden-detalle__firma-item">
                  <h4>Ejecutante</h4>
                  <input
                    type="text"
                    placeholder="Nombre del ejecutante"
                    value={datosReporte.ejecutanteNombre}
                    onChange={(e) => setDatosReporte((prev) => ({ ...prev, ejecutanteNombre: e.target.value }))}
                    className="orden-detalle__input"
                    required
                    disabled={saving}
                  />
                  <input
                    type="date"
                    placeholder="Fecha"
                    value={datosReporte.ejecutanteFecha}
                    onChange={(e) => setDatosReporte((prev) => ({ ...prev, ejecutanteFecha: e.target.value }))}
                    className="orden-detalle__input"
                    disabled={saving}
                  />
                  <FirmaCanvas
                    onChange={(firma) => setFirmas((prev) => ({ ...prev, ejecutante: firma }))}
                    width={300}
                    height={120}
                  />
                </div>

                <div className="orden-detalle__firma-item">
                  <h4>Cliente interno (Solicitante)</h4>
                  <input
                    type="text"
                    placeholder="Nombre del solicitante"
                    value={datosReporte.solicitanteNombre}
                    onChange={(e) => setDatosReporte((prev) => ({ ...prev, solicitanteNombre: e.target.value }))}
                    className="orden-detalle__input"
                    disabled={saving}
                  />
                  <input
                    type="date"
                    placeholder="Fecha"
                    value={datosReporte.solicitanteFecha}
                    onChange={(e) => setDatosReporte((prev) => ({ ...prev, solicitanteFecha: e.target.value }))}
                    className="orden-detalle__input"
                    disabled={saving}
                  />
                  <FirmaCanvas
                    onChange={(firma) => setFirmas((prev) => ({ ...prev, solicitante: firma }))}
                    width={300}
                    height={120}
                  />
                </div>

                {/* La firma del encargado de mantenimiento se agrega solo desde la vista del jefe de mantenimiento (Informe Técnico) */}
              </div>
            </Card>

            <Card title="Finalizar Orden">
              <button
                type="submit"
                className="orden-detalle__btn orden-detalle__btn--primary"
                disabled={saving || !datosReporte.ejecutanteNombre}
              >
                {saving ? 'Finalizando...' : 'Finalizar Orden'}
              </button>
            </Card>
          </form>

          <Card title="Subir evidencias adicionales">
            <form onSubmit={subirEvidenciasHandler}>
              <label className="orden-detalle__label">
                Archivos (fotos, PDF)
                <input
                  id="orden-evidencias-input"
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => setEvidenciasFiles(Array.from(e.target.files || []))}
                  className="orden-detalle__file"
                />
              </label>
              {evidenciasFiles.length > 0 && (
                <p className="orden-detalle__files-count">
                  {evidenciasFiles.length} archivo(s) seleccionado(s)
                </p>
              )}
              <button
                type="submit"
                className="orden-detalle__btn orden-detalle__btn--secondary"
                disabled={subiendoEvidencias || evidenciasFiles.length === 0}
              >
                {subiendoEvidencias ? 'Subiendo…' : 'Subir evidencias'}
              </button>
            </form>
          </Card>
        </>
      )}

      {(evidencias.length > 0 || orden.trabajoRealizado) && (
        <Card title="Registro">
          {orden.trabajoRealizado && (
            <div className="orden-detalle__bloque">
              <strong>Trabajo realizado</strong>
              <pre className="orden-detalle__texto">{orden.trabajoRealizado}</pre>
            </div>
          )}
          {evidencias.length > 0 && (
            <div className="orden-detalle__bloque">
              <strong>Evidencias</strong>
              <ul className="orden-detalle__evidencias">
                {evidencias.map((e, i) => {
                  const item = typeof e === 'string' ? { url: e, nombre: `Evidencia ${i + 1}` } : e
                  return (
                    <li key={i}>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.nombre || item.url || `Evidencia ${i + 1}`}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </Card>
      )}

      {puedeInforme && estado === ESTADOS_ORDEN.COMPLETADA && (
        <>
          <Card title="Informe técnico">
            <p className="orden-detalle__texto">Genere el informe con resumen, evidencias, firma y exporte a PDF o Excel.</p>
            <Link to={`/reportes/informe/${orden.id}`} className="orden-detalle__link-informe">
              Generar informe técnico
            </Link>
          </Card>
        </>
      )}
    </div>
  )
}
