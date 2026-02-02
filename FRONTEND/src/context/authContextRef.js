import { createContext } from 'react'

/**
 * Referencia única del contexto de autenticación.
 * En un archivo aparte para que el HMR (Vite) no cree una segunda referencia
 * al recargar AuthContext.jsx, lo que provocaría "useAuth debe usarse dentro de AuthProvider".
 */
export const AuthContext = createContext(null)
