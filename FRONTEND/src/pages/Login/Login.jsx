import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context'
import { Loader } from '../../components'
import { getDefaultPathForRole } from '../../constants'
import { validateLogin, getLoginErrorMessage } from '../../utils'
import './Login.css'

export const Login = () => {
  const { user, login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ usuario: null, password: null })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copiedCredential, setCopiedCredential] = useState(null)

  const copyToClipboard = (text, credentialType) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCredential(credentialType)
      setTimeout(() => setCopiedCredential(null), 2000)
    })
  }

  const fillCredentials = (user, pass) => {
    setUsuario(user)
    setPassword(pass)
    setError('')
    setFieldErrors({ usuario: null, password: null })
  }

  const clearFieldError = (field) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({ usuario: null, password: null })

    const errors = validateLogin({ usuario, password })
    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }))
      return
    }

    setSubmitting(true)
    try {
      const userData = await login({
        usuario: usuario.trim(),
        password,
      })
      const target =
        from && from !== '/' ? from : getDefaultPathForRole(userData?.role)
      navigate(target, { replace: true })
    } catch (err) {
      setError(getLoginErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="login">
        <Loader />
      </div>
    )
  }

  return (
    <div className="login">
      <div className="login__card">
        <h1 className="login__title">Sweetsol</h1>
        <p className="login__subtitle">Mantenimiento Industrial</p>

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="login__error" role="alert">
              {error}
            </div>
          )}

          <div className="login__field">
            <label htmlFor="login-usuario" className="login__label">
              Usuario
            </label>
            <input
              id="login-usuario"
              type="text"
              className={`login__input ${fieldErrors.usuario ? 'login__input--error' : ''}`}
              value={usuario}
              onChange={(e) => {
                setUsuario(e.target.value)
                clearFieldError('usuario')
              }}
              autoComplete="username"
              disabled={submitting}
              placeholder="Email o nombre de usuario"
              autoFocus
              aria-invalid={!!fieldErrors.usuario}
              aria-describedby={fieldErrors.usuario ? 'login-usuario-error' : undefined}
            />
            {fieldErrors.usuario && (
              <span id="login-usuario-error" className="login__field-error">
                {fieldErrors.usuario}
              </span>
            )}
          </div>

          <div className="login__field">
            <label htmlFor="login-password" className="login__label">
              Contraseña
            </label>
            <div className="login__password-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className={`login__input login__input--password ${fieldErrors.password ? 'login__input--error' : ''}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearFieldError('password')
                }}
                autoComplete="current-password"
                disabled={submitting}
                placeholder="Mínimo 6 caracteres"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                className="login__toggle-password"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {fieldErrors.password && (
              <span id="login-password-error" className="login__field-error">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="login__submit"
            disabled={submitting}
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="login__credentials">
          <p className="login__credentials-title">Credenciales de prueba:</p>
          <p className="login__credentials-note">
            <strong>Importante:</strong> Estas credenciales se crean automáticamente al iniciar el servidor backend. Si recibe "Credenciales inválidas":
            <br />1. Verifique que el backend esté ejecutándose (puerto 3000)
            <br />2. Verifique que la base de datos esté conectada
            <br />3. Los usuarios se crean automáticamente con la contraseña: <code>123456</code>
          </p>
          <div className="login__credentials-list">
            {/* 0. Super Usuario (acceso total al aplicativo) */}
            <div className="login__credential-item">
              <div className="login__credential-header">
                <strong>Superior</strong>
                <span className="login__credential-role-note">Super Usuario (acceso total)</span>
                <button
                  type="button"
                  className="login__credential-fill"
                  onClick={() => fillCredentials('superior', '123456')}
                  disabled={submitting}
                >
                  Usar estas credenciales
                </button>
              </div>
              <div className="login__credential-detail">
                <span>Usuario:</span>
                <code onClick={() => copyToClipboard('superior', 'superior-user')} className="login__credential-copy">
                  superior
                </code>
                {copiedCredential === 'superior-user' && (
                  <span className="login__credential-copied">✓ Copiado</span>
                )}
              </div>
              <div className="login__credential-detail">
                <span>Contraseña:</span>
                <code onClick={() => copyToClipboard('123456', 'superior-pass')} className="login__credential-copy">
                  123456
                </code>
                {copiedCredential === 'superior-pass' && (
                  <span className="login__credential-copied">✓ Copiado</span>
                )}
              </div>
            </div>

            {/* 1. Producción */}
            <div className="login__credential-item">
              <div className="login__credential-header">
                <strong>Producción</strong>
                <span className="login__credential-role-note">Rol interno: Operario de Producción</span>
                <button
                  type="button"
                  className="login__credential-fill"
                  onClick={() => fillCredentials('produccion', '123456')}
                  disabled={submitting}
                >
                  Usar estas credenciales
                </button>
              </div>
              <div className="login__credential-detail">
                <span>Usuario:</span>
                <code onClick={() => copyToClipboard('produccion', 'prod-user')} className="login__credential-copy">
                  produccion
                </code>
                {copiedCredential === 'prod-user' && <span className="login__credential-copied">✓ Copiado</span>}
              </div>
              <div className="login__credential-detail">
                <span>Contraseña:</span>
                <code onClick={() => copyToClipboard('123456', 'prod-pass')} className="login__credential-copy">
                  123456
                </code>
                {copiedCredential === 'prod-pass' && <span className="login__credential-copied">✓ Copiado</span>}
              </div>
            </div>

            {/* 2. Calidad (mismas funciones que Producción) */}
            <div className="login__credential-item">
              <div className="login__credential-header">
                <strong>Calidad</strong>
                <span className="login__credential-role-note">Tec Calidad</span>
                <button
                  type="button"
                  className="login__credential-fill"
                  onClick={() => fillCredentials('calidad', '123456')}
                  disabled={submitting}
                >
                  Usar estas credenciales
                </button>
              </div>
              <div className="login__credential-detail">
                <span>Usuario:</span>
                <code onClick={() => copyToClipboard('calidad', 'calidad-user')} className="login__credential-copy">
                  calidad
                </code>
                {copiedCredential === 'calidad-user' && (
                  <span className="login__credential-copied">✓ Copiado</span>
                )}
              </div>
              <div className="login__credential-detail">
                <span>Contraseña:</span>
                <code onClick={() => copyToClipboard('123456', 'calidad-pass')} className="login__credential-copy">
                  123456
                </code>
                {copiedCredential === 'calidad-pass' && (
                  <span className="login__credential-copied">✓ Copiado</span>
                )}
              </div>
            </div>

            {/* 3. Técnico MTTO (antes Operario de Mantenimiento) */}
            <div className="login__credential-item">
              <div className="login__credential-header">
                <strong>Técnico MTTO</strong>
                <span className="login__credential-role-note">Rol interno: Operario de Mantenimiento</span>
                <button
                  type="button"
                  className="login__credential-fill"
                  onClick={() => fillCredentials('operario1', '123456')}
                  disabled={submitting}
                >
                  Usar estas credenciales
                </button>
              </div>
              <div className="login__credential-detail">
                <span>Usuario:</span>
                <code onClick={() => copyToClipboard('operario1', 'op1-user')} className="login__credential-copy">
                  operario1
                </code>
                {copiedCredential === 'op1-user' && <span className="login__credential-copied">✓ Copiado</span>}
              </div>
              <div className="login__credential-detail">
                <span>Contraseña:</span>
                <code onClick={() => copyToClipboard('123456', 'op1-pass')} className="login__credential-copy">
                  123456
                </code>
                {copiedCredential === 'op1-pass' && <span className="login__credential-copied">✓ Copiado</span>}
              </div>
            </div>

            {/* 4. Coordinador MTTO (antes Jefe de Mantenimiento) */}
            <div className="login__credential-item">
              <div className="login__credential-header">
                <strong>Coordinador MTTO</strong>
                <span className="login__credential-role-note">Rol interno: Jefe de Mantenimiento</span>
                <button
                  type="button"
                  className="login__credential-fill"
                  onClick={() => fillCredentials('jefe', '123456')}
                  disabled={submitting}
                >
                  Usar estas credenciales
                </button>
              </div>
              <div className="login__credential-detail">
                <span>Usuario:</span>
                <code onClick={() => copyToClipboard('jefe', 'jefe-user')} className="login__credential-copy">
                  jefe
                </code>
                {copiedCredential === 'jefe-user' && <span className="login__credential-copied">✓ Copiado</span>}
              </div>
              <div className="login__credential-detail">
                <span>Contraseña:</span>
                <code onClick={() => copyToClipboard('123456', 'jefe-pass')} className="login__credential-copy">
                  123456
                </code>
                {copiedCredential === 'jefe-pass' && <span className="login__credential-copied">✓ Copiado</span>}
              </div>
            </div>

            {/* Técnicos MTTO (usuarios múltiples de mantenimiento) */}
            <div className="login__credential-item">
              <div className="login__credential-header">
                <strong>Técnicos MTTO (usuarios)</strong>
              </div>
              <p className="login__credential-detail">
                Todos estos usuarios usan la misma contraseña:{' '}
                <code
                  onClick={() => copyToClipboard('123456', 'all-op-pass')}
                  className="login__credential-copy"
                >
                  123456
                </code>
                {copiedCredential === 'all-op-pass' && (
                  <span className="login__credential-copied">✓ Copiado</span>
                )}
              </p>
              <ul className="login__credential-list-compact">
                {[
                  'RPADILLA',
                  'SVILLAFAÑE',
                  'JPIERRE',
                  'JVALLEJO',
                  'JMADROÑERO',
                  'JRENGIFO',
                  'SSILVA',
                  'AMERCHAN',
                  'LSERNA',
                  'EQUINTERO',
                ].map((u) => (
                  <li key={u} className="login__credential-detail">
                    <span>Usuario:</span>
                    <code
                      onClick={() => {
                        copyToClipboard(u, `op-${u}-user`)
                        fillCredentials(u, '123456')
                      }}
                      className="login__credential-copy"
                    >
                      {u}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
