import { Router } from 'express'
import * as ctrl from '../controllers/authController.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.post('/login', ctrl.login)
router.get('/me', auth, ctrl.me)
router.get('/operarios', auth, ctrl.getOperarios)

export default router
