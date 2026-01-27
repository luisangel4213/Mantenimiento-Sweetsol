/**
 * Reglas de validación para el formulario de login.
 * Compatible con validación en frontend; el backend debe revalidar.
 */
export const LOGIN_RULES = {
  usuario: {
    minLength: 2,
    required: true,
  },
  password: {
    minLength: 6,
    required: true,
  },
}

const MSG = {
  usuario: {
    required: 'El usuario es obligatorio.',
    minLength: 'El usuario debe tener al menos 2 caracteres.',
  },
  password: {
    required: 'La contraseña es obligatoria.',
    minLength: 'La contraseña debe tener al menos 6 caracteres.',
  },
}

/**
 * @param {Object} values - { usuario: string, password: string }
 * @returns {{ usuario?: string, password?: string }}
 */
export function validateLogin(values) {
  const errors = {}
  const u = (values.usuario ?? '').trim()
  const p = values.password ?? ''

  if (LOGIN_RULES.usuario.required && !u) {
    errors.usuario = MSG.usuario.required
  } else if (u.length > 0 && u.length < LOGIN_RULES.usuario.minLength) {
    errors.usuario = MSG.usuario.minLength
  }

  if (LOGIN_RULES.password.required && !p) {
    errors.password = MSG.password.required
  } else if (p.length > 0 && p.length < LOGIN_RULES.password.minLength) {
    errors.password = MSG.password.minLength
  }

  return errors
}
