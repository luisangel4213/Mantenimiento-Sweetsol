import { Router } from 'express'
import { auth } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { ROLES } from '../constants/roles.js'
import * as userController from '../controllers/userController.js'

const router = Router()

// Todas las rutas requieren autenticación y ser jefe de mantenimiento (o super usuario)
router.use(auth)
router.use(authorize(ROLES.JEFE_MANTENIMIENTO))

// Rutas para gestionar operarios (Jefe y Super Usuario)
router.get('/operarios', userController.listarOperarios)
router.post('/operarios', userController.crearOperario)

// Rutas solo para Super Usuario (listar todos, crear con rol, actualizar, eliminar)
router.get('/todos', userController.listarUsuarios)
router.post('/', userController.crearUsuario)
router.put('/:id', userController.actualizarUsuario)
router.delete('/:id', userController.eliminarUsuario)

export default router

