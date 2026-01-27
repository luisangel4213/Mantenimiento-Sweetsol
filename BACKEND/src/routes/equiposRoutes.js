import { Router } from 'express'
import * as ctrl from '../controllers/equiposController.js'
import { auth, authorize } from '../middleware/index.js'
import { ROLES } from '../constants/index.js'

const router = Router()

router.use(auth)
router.use(authorize(ROLES.JEFE_MANTENIMIENTO, ROLES.OPERARIO_MANTENIMIENTO))

router.get('/estaciones', ctrl.getEstaciones)
router.get('/', ctrl.getEquipos)
router.get('/:id', ctrl.getEquipoById)
router.post('/', ctrl.createEquipo)
router.put('/:id', ctrl.updateEquipo)
router.delete('/:id', ctrl.deleteEquipo)

export default router
