import { useState, useEffect } from 'react'
import { Card, Loader } from '../../components'
import { userService } from '../../services'
import { useAuth } from '../../context'
import { ROLES, ROLES_LABEL } from '../../constants'
import './AdminUsuarios.css'

const ROL_OPCIONES = [
  { value: ROLES.OPERARIO_PRODUCCION, label: 'Producción / Calidad' },
  { value: ROLES.OPERARIO_MANTENIMIENTO, label: 'Mantenimiento (Técnico MTTO)' },
  { value: ROLES.JEFE_MANTENIMIENTO, label: 'Coordinador (Jefe de Mantenimiento)' },
]

export const AdminUsuarios = () => {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ nombre: '', usuario: '', password: '' })

  const [formData, setFormData] = useState({
    rolCodigo: ROLES.OPERARIO_PRODUCCION,
    usuario: '',
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    setLoading(true)
    try {
      const res = await userService.listarTodos()
      setUsuarios(res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar usuarios')
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    if (!formData.usuario.trim() || !formData.nombre.trim() || !formData.password) {
      setError('Usuario, nombre y contraseña son obligatorios')
      setSaving(false)
      return
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setSaving(false)
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setSaving(false)
      return
    }
    try {
      await userService.crearUsuario({
        rolCodigo: formData.rolCodigo,
        usuario: formData.usuario.trim(),
        nombre: formData.nombre.trim(),
        email: formData.email.trim() || undefined,
        password: formData.password,
      })
      setSuccess('Usuario creado correctamente')
      setFormData({
        rolCodigo: ROLES.OPERARIO_PRODUCCION,
        usuario: '',
        nombre: '',
        email: '',
        password: '',
        confirmPassword: '',
      })
      await cargarUsuarios()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear usuario')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (u) => {
    setEditingId(u.id)
    setEditForm({ nombre: u.nombre, usuario: u.usuario, password: '' })
    setError(null)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingId) return
    setSaving(true)
    setError(null)
    try {
      const payload = { nombre: editForm.nombre.trim(), usuario: editForm.usuario.trim() }
      if (editForm.password && editForm.password.length >= 6) payload.password = editForm.password
      await userService.actualizarUsuario(editingId, payload)
      setSuccess('Usuario actualizado')
      setEditingId(null)
      await cargarUsuarios()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (id, u) => {
    if (u.role === ROLES.SUPER_USUARIO) {
      setError('No se puede desactivar al Super Usuario')
      return
    }
    if (id === user?.id) {
      setError('No puede desactivar su propio usuario')
      return
    }
    if (!window.confirm(`¿Desactivar al usuario "${u.nombre}" (${u.usuario})? No podrá iniciar sesión.`)) return
    setSaving(true)
    setError(null)
    try {
      await userService.eliminarUsuario(id)
      setSuccess('Usuario desactivado')
      await cargarUsuarios()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al desactivar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-usuarios">
        <Loader />
      </div>
    )
  }

  return (
    <div className="admin-usuarios">
      <div className="admin-usuarios__header">
        <h1 className="page-title">Administración de usuarios</h1>
        <p className="admin-usuarios__subtitle">
          Crear usuarios (Calidad, Producción, Mantenimiento, Coordinador), recuperar contraseñas y cambiar nombres.
        </p>
      </div>

      {error && (
        <div className="admin-usuarios__error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="admin-usuarios__success" role="alert">
          {success}
        </div>
      )}

      <Card title="Crear usuario">
        <form onSubmit={handleSubmit} className="admin-usuarios__form">
          <div className="admin-usuarios__row">
            <div className="admin-usuarios__field">
              <label className="admin-usuarios__label">Rol <span className="admin-usuarios__required">*</span></label>
              <select
                name="rolCodigo"
                value={formData.rolCodigo}
                onChange={handleInputChange}
                className="admin-usuarios__input"
                required
                disabled={saving}
              >
                {ROL_OPCIONES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-usuarios__field">
              <label className="admin-usuarios__label">Usuario (login) <span className="admin-usuarios__required">*</span></label>
              <input
                type="text"
                name="usuario"
                value={formData.usuario}
                onChange={handleInputChange}
                className="admin-usuarios__input"
                placeholder="Ej: produccion2"
                disabled={saving}
                required
              />
            </div>
            <div className="admin-usuarios__field">
              <label className="admin-usuarios__label">Nombre completo <span className="admin-usuarios__required">*</span></label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="admin-usuarios__input"
                placeholder="Ej: María López"
                disabled={saving}
                required
              />
            </div>
          </div>
          <div className="admin-usuarios__row">
            <div className="admin-usuarios__field">
              <label className="admin-usuarios__label">Email (opcional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="admin-usuarios__input"
                placeholder="usuario@empresa.com"
                disabled={saving}
              />
            </div>
            <div className="admin-usuarios__field">
              <label className="admin-usuarios__label">Contraseña <span className="admin-usuarios__required">*</span></label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="admin-usuarios__input"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                disabled={saving}
                required
              />
            </div>
            <div className="admin-usuarios__field">
              <label className="admin-usuarios__label">Confirmar contraseña <span className="admin-usuarios__required">*</span></label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="admin-usuarios__input"
                placeholder="Repetir contraseña"
                minLength={6}
                disabled={saving}
                required
              />
            </div>
          </div>
          <div className="admin-usuarios__actions">
            <button type="submit" className="admin-usuarios__btn admin-usuarios__btn--primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Listado de usuarios">
        <div className="admin-usuarios__table-wrapper">
          <table className="admin-usuarios__table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  {editingId === u.id ? (
                    <>
                      <td colSpan={5}>
                        <form onSubmit={handleEditSubmit} className="admin-usuarios__edit-form">
                          <input
                            type="text"
                            name="usuario"
                            value={editForm.usuario}
                            onChange={handleEditChange}
                            placeholder="Usuario"
                            className="admin-usuarios__input admin-usuarios__input--inline"
                            required
                          />
                          <input
                            type="text"
                            name="nombre"
                            value={editForm.nombre}
                            onChange={handleEditChange}
                            placeholder="Nombre"
                            className="admin-usuarios__input admin-usuarios__input--inline"
                            required
                          />
                          <input
                            type="password"
                            name="password"
                            value={editForm.password}
                            onChange={handleEditChange}
                            placeholder="Nueva contraseña (opcional)"
                            className="admin-usuarios__input admin-usuarios__input--inline"
                            minLength={6}
                          />
                          <button type="submit" className="admin-usuarios__btn admin-usuarios__btn--small" disabled={saving}>
                            Guardar
                          </button>
                          <button
                            type="button"
                            className="admin-usuarios__btn admin-usuarios__btn--secondary admin-usuarios__btn--small"
                            onClick={() => setEditingId(null)}
                          >
                            Cancelar
                          </button>
                        </form>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{u.usuario}</td>
                      <td>{u.nombre}</td>
                      <td>{ROLES_LABEL[u.role] || u.role}</td>
                      <td>
                        <span className={`admin-usuarios__status admin-usuarios__status--${u.activo ? 'activo' : 'inactivo'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        {u.activo && u.role !== ROLES.SUPER_USUARIO && (
                          <>
                            <button
                              type="button"
                              className="admin-usuarios__btn admin-usuarios__btn--link"
                              onClick={() => openEdit(u)}
                            >
                              Editar
                            </button>
                            {u.id !== user?.id && (
                              <>
                                {' | '}
                                <button
                                  type="button"
                                  className="admin-usuarios__btn admin-usuarios__btn--link admin-usuarios__btn--danger"
                                  onClick={() => handleEliminar(u.id, u)}
                                  disabled={saving}
                                >
                                  Desactivar
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
