import { useState, useEffect } from 'react'
import { Card, Loader } from '../../components'
import { equiposService } from '../../services'
import './Equipos.css'

export const Equipos = () => {
  const [equipos, setEquipos] = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filtroArea, setFiltroArea] = useState('')
  const [filtroCriticidad, setFiltroCriticidad] = useState('')

  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    marca: '',
    modelo: '',
    criticidad: 'media',
    area: '',
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    cargarEquipos()
  }, [filtroArea, filtroCriticidad])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [equiposRes, estacionesRes] = await Promise.all([
        equiposService.getAll(),
        equiposService.getEstaciones(),
      ])
      setEquipos(equiposRes.data || [])
      setEstaciones(estacionesRes.data || [])
    } catch (err) {
      setError('Error al cargar los datos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const cargarEquipos = async () => {
    try {
      const params = {}
      if (filtroArea) params.area = filtroArea
      if (filtroCriticidad) params.criticidad = filtroCriticidad
      const res = await equiposService.getAll(params)
      setEquipos(res.data || [])
    } catch (err) {
      setError('Error al cargar equipos')
      console.error(err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const dataToSend = {
        nombre: formData.nombre.trim(),
        codigo: formData.codigo.trim() || null,
        marca: formData.marca.trim() || null,
        modelo: formData.modelo.trim() || null,
        criticidad: formData.criticidad,
        area: formData.area || null,
      }

      if (editingId) {
        // Buscar el ID de la estación por nombre
        const estacion = estaciones.find((e) => e.nombre === formData.area)
        if (estacion) {
          dataToSend.estacionId = estacion.id
        }
        await equiposService.update(editingId, dataToSend)
      } else {
        await equiposService.create(dataToSend)
      }

      await cargarEquipos()
      resetForm()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el equipo')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (equipo) => {
    setFormData({
      nombre: equipo.nombre || '',
      codigo: equipo.codigo || '',
      marca: equipo.marca || '',
      modelo: equipo.modelo || '',
      criticidad: equipo.criticidad || 'media',
      area: equipo.area || '',
    })
    setEditingId(equipo.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este equipo?')) return

    try {
      await equiposService.delete(id)
      await cargarEquipos()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el equipo')
      console.error(err)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      codigo: '',
      marca: '',
      modelo: '',
      criticidad: 'media',
      area: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const criticidadLabels = {
    alta: 'Alta',
    media: 'Media',
    baja: 'Baja',
  }

  const criticidadColors = {
    alta: '#dc2626',
    media: '#f59e0b',
    baja: '#10b981',
  }

  if (loading) {
    return (
      <div className="equipos">
        <Loader />
      </div>
    )
  }

  return (
    <div className="equipos">
      <div className="equipos__header">
        <h1 className="page-title">Equipos de Trabajo</h1>
        <button
          type="button"
          className="equipos__btn equipos__btn--primary"
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
        >
          + Nuevo Equipo
        </button>
      </div>

      {error && (
        <div className="equipos__error" role="alert">
          {error}
        </div>
      )}

      {/* Filtros */}
      <Card title="Filtros">
        <div className="equipos__filtros">
          <div className="equipos__filtro">
            <label className="equipos__label">
              Área
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="equipos__select"
              >
                <option value="">Todas las áreas</option>
                {estaciones.map((est) => (
                  <option key={est.id} value={est.nombre}>
                    {est.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="equipos__filtro">
            <label className="equipos__label">
              Criticidad
              <select
                value={filtroCriticidad}
                onChange={(e) => setFiltroCriticidad(e.target.value)}
                className="equipos__select"
              >
                <option value="">Todas</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </label>
          </div>
        </div>
      </Card>

      {/* Formulario */}
      {showForm && (
        <Card title={editingId ? 'Editar Equipo' : 'Nuevo Equipo'}>
          <form onSubmit={handleSubmit} className="equipos__form">
            <div className="equipos__form-row">
              <div className="equipos__form-field">
                <label className="equipos__label">
                  Nombre <span className="equipos__required">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="equipos__input"
                  required
                  disabled={saving}
                />
              </div>
              <div className="equipos__form-field">
                <label className="equipos__label">Código</label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  className="equipos__input"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="equipos__form-row">
              <div className="equipos__form-field">
                <label className="equipos__label">Marca</label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleInputChange}
                  className="equipos__input"
                  disabled={saving}
                />
              </div>
              <div className="equipos__form-field">
                <label className="equipos__label">Modelo</label>
                <input
                  type="text"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleInputChange}
                  className="equipos__input"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="equipos__form-row">
              <div className="equipos__form-field">
                <label className="equipos__label">
                  Área <span className="equipos__required">*</span>
                </label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="equipos__select"
                  required
                  disabled={saving}
                >
                  <option value="">Seleccione un área</option>
                  {estaciones.map((est) => (
                    <option key={est.id} value={est.nombre}>
                      {est.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="equipos__form-field">
                <label className="equipos__label">
                  Criticidad <span className="equipos__required">*</span>
                </label>
                <select
                  name="criticidad"
                  value={formData.criticidad}
                  onChange={handleInputChange}
                  className="equipos__select"
                  required
                  disabled={saving}
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
            </div>

            <div className="equipos__form-actions">
              <button
                type="submit"
                className="equipos__btn equipos__btn--primary"
                disabled={saving}
              >
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                className="equipos__btn equipos__btn--secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Listado */}
      <Card title={`Equipos (${equipos.length})`}>
        {equipos.length === 0 ? (
          <p className="equipos__empty">No hay equipos registrados.</p>
        ) : (
          <div className="equipos__table-container">
            <table className="equipos__table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Área</th>
                  <th>Criticidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equipos.map((equipo) => (
                  <tr key={equipo.id}>
                    <td>{equipo.nombre}</td>
                    <td>{equipo.codigo || '—'}</td>
                    <td>{equipo.marca || '—'}</td>
                    <td>{equipo.modelo || '—'}</td>
                    <td>{equipo.area || '—'}</td>
                    <td>
                      <span
                        className="equipos__badge"
                        style={{
                          backgroundColor: criticidadColors[equipo.criticidad] + '20',
                          color: criticidadColors[equipo.criticidad],
                        }}
                      >
                        {criticidadLabels[equipo.criticidad] || equipo.criticidad}
                      </span>
                    </td>
                    <td>
                      <div className="equipos__actions">
                        <button
                          type="button"
                          className="equipos__btn-action equipos__btn-action--edit"
                          onClick={() => handleEdit(equipo)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="equipos__btn-action equipos__btn-action--delete"
                          onClick={() => handleDelete(equipo.id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
