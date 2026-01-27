import { Router } from 'express'
import authRoutes from './authRoutes.js'
import mantenimientoRoutes from './mantenimientoRoutes.js'
import equiposRoutes from './equiposRoutes.js'
import userRoutes from './userRoutes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/mantenimiento', mantenimientoRoutes)
router.use('/equipos', equiposRoutes)
router.use('/usuarios', userRoutes)

export default router
