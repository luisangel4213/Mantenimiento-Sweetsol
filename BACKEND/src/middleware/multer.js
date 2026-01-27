import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { env } from '../config/index.js'

// Solo imágenes (sin PDF ni otros tipos)
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const EXT_TO_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

const BASE_DIR = path.resolve(env.uploadDir)
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB por imagen
const MAX_FILES = 10

// Asegurar que exista el directorio base
if (!fs.existsSync(BASE_DIR)) {
  fs.mkdirSync(BASE_DIR, { recursive: true })
}

/**
 * Valida que el nombre original no tenga path traversal ni caracteres peligrosos.
 */
function isOriginalNameSafe(name) {
  if (!name || typeof name !== 'string') return false
  if (name.length > 200) return false
  if (/[\/\\]/.test(name) || /\.\./.test(name)) return false
  return true
}

/**
 * Multer para evidencias (imágenes) asociadas a una orden.
 * Requiere que req.params.id sea el id de la orden (validar antes con validarOrdenEvidencias).
 * Guarda en: UPLOAD_DIR/ordenes/{ordenId}/{random}-{timestamp}{ext}
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ordenId = req.params?.id
    if (!ordenId || !/^\d+$/.test(String(ordenId))) {
      return cb(new Error('ID de orden inválido'), null)
    }
    const dir = path.join(BASE_DIR, 'ordenes', String(ordenId))
    try {
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    } catch (err) {
      cb(err, null)
    }
  },
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase()
    const safeExt = ALLOWED_EXT.includes(ext) ? ext : '.jpg'
    const random = crypto.randomBytes(8).toString('hex')
    const name = `${random}-${Date.now()}${safeExt}`
    cb(null, name)
  },
})

function fileFilter(req, file, cb) {
  const mime = (file.mimetype || '').split(';')[0].trim().toLowerCase()
  const ext = (path.extname(file.originalname) || '').toLowerCase()

  if (!isOriginalNameSafe(file.originalname)) {
    const e = new Error('Nombre de archivo no permitido')
    e.status = 400
    return cb(e, false)
  }
  if (!ALLOWED_EXT.includes(ext)) {
    const e = new Error('Solo se permiten imágenes: JPEG, PNG, GIF o WebP')
    e.status = 400
    return cb(e, false)
  }
  if (!ALLOWED_MIMES.includes(mime)) {
    const e = new Error('Tipo MIME no permitido. Solo imágenes: JPEG, PNG, GIF o WebP')
    e.status = 400
    return cb(e, false)
  }
  if (EXT_TO_MIME[ext] !== mime) {
    const e = new Error('La extensión del archivo no coincide con su tipo')
    e.status = 400
    return cb(e, false)
  }
  cb(null, true)
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter,
})

/**
 * Middleware: subida de imágenes de evidencia para una orden.
 * Campo del form: "evidencias" (múltiple, máx. 10, 5 MB cada una).
 * Debe ir después de validarOrdenEvidencias para que req.params.id exista y la orden sea válida.
 */
export const uploadEvidencias = upload.array('evidencias', MAX_FILES)

/** Límites para documentación */
export const uploadLimits = { maxFileSize: MAX_FILE_SIZE, maxFiles: MAX_FILES, allowed: ALLOWED_EXT }
