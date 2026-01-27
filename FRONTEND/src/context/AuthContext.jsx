import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services'
import { TOKEN_KEY, USER_KEY } from '../constants'
import { ROLES_LIST } from '../constants'

const AuthContext = createContext(null)

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
    const token = localStorage.getItem(TOKEN_KEY)
    const stored = localStorage.getItem(USER_KEY)
    const parsed = parseStoredUser(stored)
    if (token && parsed?.role && ROLES_LIST.includes(parsed.role)) {
      setUser(parsed)
    } else {
      if (!parsed?.role || !ROLES_LIST.includes(parsed.role)) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
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

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const hasRole = useCallback(
    (role) => (user?.role ? user.role === role : false),
    [user?.role]
  )

  const hasAnyRole = useCallback(
    (roles) => (user?.role ? roles.includes(user.role) : false),
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
