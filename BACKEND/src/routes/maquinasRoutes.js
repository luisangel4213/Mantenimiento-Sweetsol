import { Router } from 'express'
import * as ctrl from '../controllers/maquinasController.js'
import { auth, authorize } from '../middleware/index.js'
import { ROLES } from '../constants/index.js'

const router = Router()

// Solo accesible para usuarios autenticados con rol JEFE_MANTENIMIENTO
router.use(auth)
router.use(authorize(ROLES.JEFE_MANTENIMIENTO))

// Historial de mantenimiento por máquina
router.get('/:id/historial', ctrl.getHistorial)

export default router

