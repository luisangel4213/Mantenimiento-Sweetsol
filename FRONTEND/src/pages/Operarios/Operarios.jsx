import { useState, useEffect } from 'react'
import { Card, Loader } from '../../components'
import { userService } from '../../services'
import { useAuth } from '../../context'
import { ROLES } from '../../constants'
import './Operarios.css'

/** Operarios de mantenimiento con usuario y contraseña predeterminados (contraseña: 123456). Misma lista que fix:operarios. Nombres visibles = usuarios de login. */
const OPERARIOS_PREDETERMINADOS = [
  { nombre: 'RAFAEL PADILLA', usuario: 'RPADILLA' },
  { nombre: 'SERGIO VILLAFAÑE', usuario: 'SVILLAFAÑE' },
  { nombre: 'JEAN PIERRE', usuario: 'JPIERRE' },
  { nombre: 'JOLMAN VALLEJO', usuario: 'JVALLEJO' },
  { nombre: 'JORGE MADROÑERO', usuario: 'JMADROÑERO' },
  { nombre: 'JHON RENGIFO', usuario: 'JRENGIFO' },
  { nombre: 'SANTIAGO SILVA', usuario: 'SSILVA' },
  { nombre: 'ANDRÉS MERCHÁN', usuario: 'AMERCHAN' },
  { nombre: 'LUIS ÁNGEL SERNA', usuario: 'LSERNA' },
  { nombre: 'ESTEBAN QUINTERO', usuario: 'EQUINTERO' },
]

export const Operarios = () => {
  const { user, hasRole } = useAuth()
  const [operarios, setOperarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const esSuperUsuario = hasRole(ROLES.SUPER_USUARIO)

  const [formData, setFormData] = useState({
    usuario: '',
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    cargarOperarios()
  }, [])

  const cargarOperarios = async () => {
    setLoading(true)
    try {
      const res = await userService.listarOperarios()
      setOperarios(res.data || [])
    } catch (err) {
      setError('Error al cargar los operarios')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    // Convertir a mayúsculas si es el campo usuario
    const processedValue = name === 'usuario' ? value.toUpperCase() : value
    setFormData((prev) => ({ ...prev, [name]: processedValue }))
    // Limpiar mensajes al escribir
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    // Validaciones
    if (!formData.usuario.trim()) {
      setError('El nombre de usuario es obligatorio')
      setSaving(false)
      return
    }

    if (!formData.nombre.trim()) {
      setError('El nombre completo es obligatorio')
      setSaving(false)
      return
    }

    if (!formData.password) {
      setError('La contraseña es obligatoria')
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
      const dataToSend = {
        usuario: formData.usuario.trim(),
        nombre: formData.nombre.trim(),
        email: formData.email.trim() || null,
        password: formData.password,
      }

      await userService.crearOperario(dataToSend)
      setSuccess(`Operario "${formData.nombre}" creado exitosamente`)
      resetForm()
      await cargarOperarios()
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al crear el operario'
      setError(errorMessage)
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDesactivar = async (id, nombre, usuario) => {
    if (!window.confirm(`¿Desactivar al operario "${nombre}" (${usuario})? No podrá iniciar sesión.`)) return
    setSaving(true)
    setError(null)
    try {
      await userService.eliminarUsuario(id)
      setSuccess('Operario desactivado')
      await cargarOperarios()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al desactivar')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      usuario: '',
      nombre: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
  }

  if (loading) {
    return (
      <div className="operarios">
        <Loader />
      </div>
    )
  }

  return (
    <div className="operarios">
      <div className="operarios__header">
        <h1 className="page-title">Gestión de Operarios de Mantenimiento</h1>
        <p className="operarios__subtitle">Cree y administre los usuarios operarios de mantenimiento</p>
      </div>

      {error && (
        <div className="operarios__error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="operarios__success" role="alert">
          {success}
        </div>
      )}

      <Card title="Crear Nuevo Operario">
        <form onSubmit={handleSubmit} className="operarios__form">
          <div className="operarios__row">
            <div className="operarios__field">
              <label htmlFor="usuario" className="operarios__label">
                Nombre de Usuario <span className="operarios__required">*</span>
              </label>
              <input
                type="text"
                id="usuario"
                name="usuario"
                value={formData.usuario}
                onChange={handleInputChange}
                className="operarios__input operarios__input--uppercase"
                placeholder="Ej: OPERARIO1"
                disabled={saving}
                required
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="operarios__field">
              <label htmlFor="nombre" className="operarios__label">
                Nombre Completo <span className="operarios__required">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="operarios__input"
                placeholder="Ej: Juan Pérez"
                disabled={saving}
                required
              />
            </div>
          </div>

          <div className="operarios__row">
            <div className="operarios__field">
              <label htmlFor="email" className="operarios__label">
                Email (opcional)
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="operarios__input"
                placeholder="Ej: operario@sweetsol.com"
                disabled={saving}
              />
            </div>
          </div>

          <div className="operarios__row">
            <div className="operarios__field">
              <label htmlFor="password" className="operarios__label">
                Contraseña <span className="operarios__required">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="operarios__input"
                placeholder="Mínimo 6 caracteres"
                disabled={saving}
                required
                minLength={6}
              />
            </div>

            <div className="operarios__field">
              <label htmlFor="confirmPassword" className="operarios__label">
                Confirmar Contraseña <span className="operarios__required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="operarios__input"
                placeholder="Repita la contraseña"
                disabled={saving}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="operarios__actions">
            <button
              type="submit"
              className="operarios__btn operarios__btn--primary"
              disabled={saving}
            >
              {saving ? 'Creando...' : 'Crear Operario'}
            </button>
            <button
              type="button"
              className="operarios__btn operarios__btn--secondary"
              onClick={resetForm}
              disabled={saving}
            >
              Limpiar
            </button>
          </div>
        </form>
      </Card>

      <Card title="Operarios Registrados">
        <p className="operarios__hint">
          Operarios de mantenimiento. Crear con contraseña mínima 6 caracteres. El Super Usuario puede desactivar operarios.
        </p>
        <div className="operarios__table-wrapper">
          <table className="operarios__table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Estado</th>
                {esSuperUsuario && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {operarios.length === 0 ? (
                <tr>
                  <td colSpan={esSuperUsuario ? 4 : 3}>No hay operarios registrados</td>
                </tr>
              ) : (
                operarios.map((op) => (
                  <tr key={op.id}>
                    <td>{op.nombre}</td>
                    <td>{op.usuario}</td>
                    <td>
                      <span className={`operarios__status operarios__status--${op.activo ? 'activo' : 'inactivo'}`}>
                        {op.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {esSuperUsuario && (
                      <td>
                        {op.activo && op.id !== user?.id && (
                          <button
                            type="button"
                            className="operarios__btn operarios__btn--link operarios__btn--danger"
                            onClick={() => handleDesactivar(op.id, op.nombre, op.usuario)}
                            disabled={saving}
                          >
                            Desactivar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

