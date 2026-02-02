import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components'
import { useMantenimiento, useAuth } from '../../context'
import { AREAS_MAQUINAS, AREAS_LIST } from '../../constants/areas'
import { AREAS_SOLICITANTE, SOLICITANTES_BY_AREA } from '../../constants/solicitantes'
import './Produccion.css'

export const Produccion = () => {
  const navigate = useNavigate()
  const { crearOrden, subirEvidencias, loading, error, clearError } = useMantenimiento()
  const { user } = useAuth()

  const [saving, setSaving] = useState(false)
  const [numeroOrden, setNumeroOrden] = useState('')

  // Obtener fecha actual en formato YYYY-MM-DD
  const obtenerFechaActual = () => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0]
  }

  // Obtener hora actual en formato HH:MM
  const obtenerHoraActual = () => {
    const hoy = new Date()
    const horas = String(hoy.getHours()).padStart(2, '0')
    const minutos = String(hoy.getMinutes()).padStart(2, '0')
    return `${horas}:${minutos}`
  }

  const [formData, setFormData] = useState({
    area: '',
    maquina: '',
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    fechaInicio: obtenerFechaActual(),
    horaInicio: obtenerHoraActual(),
    tipoM: '',
    areaSolicitante: '',
    solicitante: '',
  })

  const [maquinasFiltradas, setMaquinasFiltradas] = useState([])
  const [solicitantesFiltrados, setSolicitantesFiltrados] = useState([])
  const [evidenciasFiles, setEvidenciasFiles] = useState([])

  useEffect(() => {
    if (error) clearError()
  }, [error, clearError])

  // Cargar número de orden consecutivo
  useEffect(() => {
    const cargarNumeroOrden = async () => {
      try {
        const { mantenimientoService } = await import('../../services')
        const response = await mantenimientoService.getOrdenes()
        const total = response.data?.length || 0
        // El siguiente número será total + 1
        const siguiente = String(total + 1).padStart(5, '0')
        setNumeroOrden(siguiente)
      } catch (err) {
        console.error('Error al cargar número de orden:', err)
        // Si falla, usar 1 como predeterminado
        setNumeroOrden('00001')
      }
    }
    cargarNumeroOrden()
  }, [])

  // Filtrar máquinas cuando cambia el área
  useEffect(() => {
    if (formData.area && AREAS_MAQUINAS[formData.area]) {
      setMaquinasFiltradas(AREAS_MAQUINAS[formData.area])
      // Resetear máquina si el área cambia
      setFormData((prev) => ({ ...prev, maquina: '' }))
    } else {
      setMaquinasFiltradas([])
    }
  }, [formData.area])

  // Filtrar solicitantes cuando cambia el área del solicitante
  useEffect(() => {
    if (formData.areaSolicitante && SOLICITANTES_BY_AREA[formData.areaSolicitante]) {
      setSolicitantesFiltrados(SOLICITANTES_BY_AREA[formData.areaSolicitante])
      setFormData((prev) => ({ ...prev, solicitante: '' }))
    } else {
      setSolicitantesFiltrados([])
    }
  }, [formData.areaSolicitante])


  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    setEvidenciasFiles(files)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.area || !formData.maquina || !formData.titulo || !formData.descripcion) {
      return
    }

    setSaving(true)

    try {
      // Construir descripción completa
      let descripcionCompleta = `Área: ${formData.area}\nMáquina: ${formData.maquina}\n`
      if (formData.tipoM) {
        descripcionCompleta += `Tipo M: ${formData.tipoM}\n`
      }
      if (formData.solicitante) {
        descripcionCompleta += `Solicitante: ${formData.solicitante}\n`
      }
      descripcionCompleta += '\n'
      descripcionCompleta += formData.descripcion.trim()

      // Crear la orden
      // Combinar fecha y hora en formato datetime para fechaInicio
      // MySQL espera formato: YYYY-MM-DD HH:MM:SS
      let fechaInicioCompleta = null
      if (formData.fechaInicio && formData.horaInicio) {
        // Formato: YYYY-MM-DD HH:MM:SS para MySQL
        fechaInicioCompleta = `${formData.fechaInicio} ${formData.horaInicio}:00`
      } else if (formData.fechaInicio) {
        // Si solo hay fecha, usar medianoche
        fechaInicioCompleta = `${formData.fechaInicio} 00:00:00`
      }

      const ordenData = {
        equipoId: null,
        titulo: `SOLICITUD DE MANTENIMIENTO Nro: ${numeroOrden} - ${formData.titulo.trim()}`,
        descripcion: descripcionCompleta,
        prioridad: formData.prioridad,
        estado: 'pendiente',
        fechaInicio: fechaInicioCompleta,
      }

      const ordenCreada = await crearOrden(ordenData)

      // Si hay evidencias, subirlas
      if (evidenciasFiles.length > 0 && ordenCreada?.id) {
        await subirEvidencias(ordenCreada.id, evidenciasFiles)
      }

      // Limpiar formulario
      setFormData({
        area: '',
        maquina: '',
        titulo: '',
        descripcion: '',
        prioridad: 'media',
        fechaInicio: obtenerFechaActual(),
        horaInicio: obtenerHoraActual(),
        tipoM: '',
        areaSolicitante: '',
        solicitante: '',
      })
      setEvidenciasFiles([])
      const fileInput = document.getElementById('produccion-evidencias-input')
      if (fileInput) fileInput.value = ''

      // Recargar número de orden para la siguiente solicitud
      const { mantenimientoService } = await import('../../services')
      const response = await mantenimientoService.getOrdenes()
      const total = response.data?.length || 0
      const siguiente = String(total + 1).padStart(5, '0')
      setNumeroOrden(siguiente)

      // Redirigir a la orden creada
      if (ordenCreada?.id) {
        navigate(`/ordenes/${ordenCreada.id}`, {
          state: { message: 'Solicitud de mantenimiento creada exitosamente' },
        })
      }
    } catch (err) {
      console.error('Error al crear orden:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="produccion">
      <h1 className="page-title">Solicitud de Mantenimiento</h1>
      <p className="produccion__subtitle">
        Genera una solicitud de mantenimiento para que el equipo de mantenimiento la revise y atienda.
      </p>

      {numeroOrden && (
        <div className="produccion__numero-orden">
          <strong>SOLICITUD DE MANTENIMIENTO Nro: {numeroOrden}</strong>
        </div>
      )}

      {error && (
        <div className="produccion__error" role="alert">
          {error}
        </div>
      )}

      <Card title="Nueva Solicitud de Mantenimiento">
        <form onSubmit={handleSubmit} className="produccion__form">
          <div className="produccion__field">
            <label htmlFor="area" className="produccion__label">
              Área <span className="produccion__required">*</span>
            </label>
            <select
              id="area"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              className="produccion__select"
              required
              disabled={saving}
            >
              <option value="">Seleccione un área</option>
              {AREAS_LIST.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div className="produccion__field">
            <label htmlFor="maquina" className="produccion__label">
              Máquina <span className="produccion__required">*</span>
            </label>
            <select
              id="maquina"
              name="maquina"
              value={formData.maquina}
              onChange={handleInputChange}
              className="produccion__select"
              required
              disabled={saving || !formData.area}
            >
              <option value="">{formData.area ? 'Seleccione una máquina' : 'Primero seleccione un área'}</option>
              {maquinasFiltradas.map((maquina) => (
                <option key={maquina} value={maquina}>
                  {maquina}
                </option>
              ))}
            </select>
          </div>

          <div className="produccion__field">
            <label htmlFor="titulo" className="produccion__label">
              Título del problema <span className="produccion__required">*</span>
            </label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleInputChange}
              className="produccion__input"
              placeholder="Ej: Fuga en bomba principal"
              required
              disabled={saving}
            />
          </div>

          <div className="produccion__field">
            <label htmlFor="descripcion" className="produccion__label">
              Descripción detallada <span className="produccion__required">*</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              className="produccion__textarea"
              placeholder="Describa el problema encontrado, síntomas, cuándo comenzó, impacto en producción..."
              rows={6}
              required
              disabled={saving}
            />
          </div>

          <div className="produccion__row">
            <div className="produccion__field produccion__field--half">
              <label htmlFor="prioridad" className="produccion__label">
                Prioridad
              </label>
              <select
                id="prioridad"
                name="prioridad"
                value={formData.prioridad}
                onChange={handleInputChange}
                className="produccion__select"
                disabled={saving}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div className="produccion__field produccion__field--half">
              <label htmlFor="fechaInicio" className="produccion__label">
                Fecha
              </label>
              <input
                type="date"
                id="fechaInicio"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleInputChange}
                className="produccion__input"
                disabled={saving}
              />
            </div>
          </div>

          <div className="produccion__row">
            <div className="produccion__field produccion__field--half">
              <label htmlFor="horaInicio" className="produccion__label">
                Hora
              </label>
              <input
                type="time"
                id="horaInicio"
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleInputChange}
                className="produccion__input"
                disabled={saving}
              />
            </div>
          </div>

          <div className="produccion__field">
            <label htmlFor="tipoM" className="produccion__label">
              Tipo M
            </label>
            <select
              id="tipoM"
              name="tipoM"
              value={formData.tipoM}
              onChange={handleInputChange}
              className="produccion__select"
              disabled={saving}
            >
              <option value="">Seleccione un tipo</option>
              <option value="Correctivo">Correctivo</option>
              <option value="Locativo">Locativo</option>
              <option value="Mejora">Mejora</option>
              <option value="Preventivo">Preventivo</option>
            </select>
          </div>

          <div className="produccion__field">
            <label htmlFor="areaSolicitante" className="produccion__label">
              Solicitante – Área
            </label>
            <select
              id="areaSolicitante"
              name="areaSolicitante"
              value={formData.areaSolicitante}
              onChange={handleInputChange}
              className="produccion__select"
              disabled={saving}
            >
              <option value="">Seleccione un área del solicitante</option>
              {AREAS_SOLICITANTE.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="produccion__field">
            <label htmlFor="solicitante" className="produccion__label">
              Solicitante
            </label>
            <select
              id="solicitante"
              name="solicitante"
              value={formData.solicitante}
              onChange={handleInputChange}
              className="produccion__select"
              disabled={saving || !formData.areaSolicitante}
            >
              <option value="">
                {formData.areaSolicitante ? 'Seleccione un solicitante' : 'Primero seleccione el área del solicitante'}
              </option>
              {solicitantesFiltrados.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="produccion__field">
            <label htmlFor="produccion-evidencias-input" className="produccion__label">
              Evidencias (imágenes)
            </label>
            <input
              type="file"
              id="produccion-evidencias-input"
              name="evidencias"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="produccion__file"
              disabled={saving}
            />
            {evidenciasFiles.length > 0 && (
              <p className="produccion__files-info">
                {evidenciasFiles.length} imagen{evidenciasFiles.length > 1 ? 'es' : ''} seleccionada
                {evidenciasFiles.length > 1 ? 's' : ''}
              </p>
            )}
            <p className="produccion__help">
              Puede seleccionar múltiples imágenes para documentar el problema.
            </p>
          </div>

          <div className="produccion__actions">
            <button
              type="submit"
              className="produccion__btn produccion__btn--primary"
              disabled={
                saving ||
                !formData.area ||
                !formData.maquina ||
                !formData.titulo ||
                !formData.descripcion
              }
            >
              {saving ? 'Grabando...' : 'Grabar'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
