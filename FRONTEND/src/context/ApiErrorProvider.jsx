import { useState, useEffect } from 'react'
import { setGlobalErrorHandler } from '../services/api'
import './ApiErrorProvider.css'

/**
 * Provider que registra un manejador global de errores de API (5xx, red)
 * y muestra un banner. Envuelve la app para manejo centralizado.
 */
export const ApiErrorProvider = ({ children }) => {
  const [error, setError] = useState(null)

  useEffect(() => {
    setGlobalErrorHandler(({ message, status, isNetwork }) => {
      if (status >= 500 || isNetwork) {
        setError(message)
      }
    })
    return () => setGlobalErrorHandler(null)
  }, [])

  const dismiss = () => setError(null)

  return (
    <>
      {error && (
        <div className="api-error-banner" role="alert">
          <span className="api-error-banner__text">{error}</span>
          <button
            type="button"
            className="api-error-banner__close"
            onClick={dismiss}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}
      <div style={{ paddingTop: error ? '3rem' : 0 }}>{children}</div>
    </>
  )
}
