/**
 * Extrae un mensaje de error amigable desde la respuesta de Axios / backend Node.js.
 * Soporta formatos habituales: message, error, msg.
 */
export function getLoginErrorMessage(err) {
  const data = err?.response?.data
  if (data && typeof data === 'object') {
    const msg = data.message ?? data.error ?? data.msg
    if (typeof msg === 'string' && msg.trim()) return msg.trim()
    if (Array.isArray(data.errors) && data.errors.length) {
      const first = data.errors[0]
      const s = typeof first === 'string' ? first : first?.msg ?? first?.message
      if (typeof s === 'string' && s.trim()) return s.trim()
    }
  }
  if (err?.message && typeof err.message === 'string') return err.message
  return 'Error al iniciar sesión. Comprueba usuario y contraseña.'
}
