import fs from 'fs'
import path from 'path'

const dir = process.cwd()
const envPath = path.join(dir, '.env')
const examplePath = path.join(dir, 'env.example')

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath)
    console.log('.env creado desde env.example. Revise DB_USER y DB_PASSWORD.')
  } else {
    console.error('No se encontró env.example en', dir)
    process.exit(1)
  }
} else {
  console.log('.env ya existe.')
}
