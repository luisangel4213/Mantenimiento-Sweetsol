import { Router } from 'express'
import * as ctrl from '../controllers/mantenimientoController.js'
import { auth } from '../middleware/auth.js'
import { validarOrdenEvidencias } from '../middleware/validarOrdenEvidencias.js'
import { uploadEvidencias as multerEvidencias } from '../middleware/multer.js'

const router = Router()

router.use(auth)

router.get('/', ctrl.getOrdenes)
router.post('/', ctrl.createOrden)
router.get('/:id/informe/datos', ctrl.getDatosInforme)
router.get('/:id/informe', ctrl.getInforme)
router.post('/:id/informe', ctrl.createInforme)
router.post('/:id/asignar', ctrl.asignarOrden)
router.post('/:id/iniciar', ctrl.iniciarOrden)
router.post('/:id/finalizar', ctrl.finalizarOrden)
router.get('/:id', ctrl.getOrdenById)
router.put('/:id', ctrl.updateOrden)
router.delete('/:id', ctrl.deleteOrden)
router.post('/:id/evidencias', validarOrdenEvidencias, multerEvidencias, ctrl.uploadEvidencias)

export default router
