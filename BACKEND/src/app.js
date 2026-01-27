import express from 'express'
import cors from 'cors'
import path from 'path'
import routes from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { env } from './config/index.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api', routes)
app.use('/uploads', express.static(path.resolve(env.uploadDir)))

app.use(errorHandler)

export default app
