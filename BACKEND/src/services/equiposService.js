import * as Maquina from '../models/Maquina.js'

export async function getEquipos(filtros = {}) {
  return Maquina.findAll(filtros)
}

export async function getEquipoById(id) {
  const e = await Maquina.findById(id)
  if (!e) {
    const err = new Error('Equipo no encontrado')
    err.status = 404
    throw err
  }
  return e
}

export async function createEquipo(data) {
  return Maquina.create(data)
}

export async function updateEquipo(id, data) {
  const e = await Maquina.update(id, data)
  if (!e) {
    const err = new Error('Equipo no encontrado')
    err.status = 404
    throw err
  }
  return e
}

export async function deleteEquipo(id) {
  const ok = await Maquina.remove(id)
  if (!ok) {
    const err = new Error('Equipo no encontrado')
    err.status = 404
    throw err
  }
}
