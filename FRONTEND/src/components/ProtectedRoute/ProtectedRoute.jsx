import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context'
import { getDefaultPathForRole } from '../../constants'
import { Loader } from '../Loader'

/**
 * Ruta protegida: exige autenticación y, opcionalmente, uno de los roles indicados.
 * - Sin autenticación: redirige a /login conservando `from` para volver tras login.
 * - Con autenticación pero sin rol permitido: redirige a la ruta por defecto del rol del usuario
 *   (o a `redirectTo` si se pasa), nunca renderiza el contenido (bloqueo por URL).
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
    const target =
      redirectTo ?? getDefaultPathForRole(user?.role)
    return <Navigate to={target} replace />
  }

  return children
}
