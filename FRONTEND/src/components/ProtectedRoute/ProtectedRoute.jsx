import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context'
import { getDefaultPathForRole } from '../../constants'
import { Loader } from '../Loader'
import { Card } from '../Card'

/**
 * Ruta protegida: exige autenticación y, opcionalmente, uno de los roles indicados.
 * - Sin autenticación: redirige a /login conservando `from` para volver tras login.
 * - Con autenticación pero sin rol permitido: muestra mensaje claro y enlace para volver.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.roles] - Roles permitidos. Vacío o no pasado = cualquier autenticado.
 * @param {string} [props.redirectTo] - Si se deniega por rol, redirigir aquí. Por defecto: ruta por defecto del rol.
 */
export const ProtectedRoute = ({ children, roles, redirectTo }) => {
  const { user, isAuthenticated, isLoading, hasAnyRole } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <Loader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const rolesRequired = roles?.length > 0
  const hasAccess = !rolesRequired || hasAnyRole(roles)

  if (!hasAccess) {
    const target = redirectTo ?? getDefaultPathForRole(user?.role)
    return (
      <div style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
        <Card title="Acceso denegado">
          <p style={{ marginBottom: '1rem', color: '#64748b' }}>
            No tienes permisos para acceder a esta información.
          </p>
          <Link
            to={target}
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: '#1e3a5f',
              color: '#fff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Ir al inicio
          </Link>
        </Card>
      </div>
    )
  }

  return children
}
