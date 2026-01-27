import { Router } from 'express'
import { auth } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { ROLES } from '../constants/roles.js'
import * as userController from '../controllers/userController.js'

const router = Router()

// Todas las rutas requieren autenticación y ser jefe de mantenimiento
router.use(auth)
router.use(authorize(ROLES.JEFE_MANTENIMIENTO))

// Rutas para gestionar operarios
router.post('/operarios', userController.crearOperario)
router.get('/operarios', userController.listarOperarios)

export default router

