import { useContext, useState, useEffect, useCallback } from 'react'
import { AuthContext } from './authContextRef'
import { authService } from '../services'
import { TOKEN_KEY, USER_KEY } from '../constants'
import { ROLES_LIST, ROLES } from '../constants'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

const parseStoredUser = (raw) => {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  const loadFromStorage = useCallback(() => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    const stored = sessionStorage.getItem(USER_KEY)
    const parsed = parseStoredUser(stored)
    if (token && parsed?.role && ROLES_LIST.includes(parsed.role)) {
      setUser(parsed)
    } else {
      if (!parsed?.role || ROLES_LIST.indexOf(parsed.role) === -1) {
        sessionStorage.removeItem(TOKEN_KEY)
        sessionStorage.removeItem(USER_KEY)
      }
      setUser(null)
    }
  }, [])

  useEffect(() => {
    loadFromStorage()
    setIsLoading(false)
  }, [loadFromStorage])

  const login = useCallback(async (credentials) => {
    const { data } = await authService.login(credentials)
    const { token, user: userData } = data

    if (!token || !userData?.role || !ROLES_LIST.includes(userData.role)) {
      throw new Error('Respuesta de login inválida: faltan token o rol válido')
    }

    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const hasRole = useCallback(
    (role) => (user?.role ? user.role === role : false),
    [user?.role]
  )

  const hasAnyRole = useCallback(
    (roles) => {
      if (!user?.role) return false
      if (user.role === ROLES.SUPER_USUARIO) return true
      return roles.includes(user.role)
    },
    [user?.role]
  )

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
    hasAnyRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
