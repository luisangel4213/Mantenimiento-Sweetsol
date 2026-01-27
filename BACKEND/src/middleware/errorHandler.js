import multer from 'multer'

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: 'El archivo excede el tamaño máximo permitido (5 MB)',
  LIMIT_FILE_COUNT: 'Se excedió el número máximo de archivos (10)',
  LIMIT_UNEXPECTED_FILE: 'Campo de archivo no esperado. Use el campo "evidencias"',
  LIMIT_PART_COUNT: 'Demasiadas partes en la petición',
  LIMIT_FIELD_KEY: 'Nombre de campo no permitido',
  LIMIT_FIELD_VALUE: 'Valor de campo no permitido',
  LIMIT_FIELD_COUNT: 'Demasiados campos',
}

export function errorHandler(err, req, res, next) {
  let status = err.status
  let message = err.message

  if (err instanceof multer.MulterError) {
    status = 400
    message = MULTER_MESSAGES[err.code] || `Error en la subida: ${err.code}`
  }
  if (status == null) status = 500
  if (!message) message = 'Error interno del servidor'

  if (status >= 500) {
    console.error('[ErrorHandler]', err)
    // En desarrollo, incluir más detalles del error
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorHandler] Stack:', err.stack)
      if (err.original) {
        console.error('[ErrorHandler] Error original:', err.original)
      }
    }
  }
  
  // En desarrollo, enviar más detalles del error
  const response = { message }
  if (status >= 500 && process.env.NODE_ENV === 'development' && err.original) {
    response.details = err.original.message
  }
  
  res.status(status).json(response)
}
