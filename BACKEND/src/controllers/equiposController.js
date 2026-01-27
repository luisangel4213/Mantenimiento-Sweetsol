import * as equiposService from '../services/equiposService.js'
import * as Estacion from '../models/Estacion.js'

export async function getEstaciones(req, res, next) {
  try {
    const estaciones = await Estacion.findAll()
    res.json(estaciones)
  } catch (e) {
    next(e)
  }
}

export async function getEquipos(req, res, next) {
  try {
    const { area, criticidad } = req.query
    const data = await equiposService.getEquipos({ area, criticidad })
    res.json(data)
  } catch (e) {
    next(e)
  }
}

export async function getEquipoById(req, res, next) {
  try {
    const data = await equiposService.getEquipoById(req.params.id)
    res.json(data)
  } catch (e) {
    next(e)
  }
}

export async function createEquipo(req, res, next) {
  try {
    const data = await equiposService.createEquipo(req.body)
    res.status(201).json(data)
  } catch (e) {
    next(e)
  }
}

export async function updateEquipo(req, res, next) {
  try {
    const data = await equiposService.updateEquipo(req.params.id, req.body)
    res.json(data)
  } catch (e) {
    next(e)
  }
}

export async function deleteEquipo(req, res, next) {
  try {
    await equiposService.deleteEquipo(req.params.id)
    res.status(204).send()
  } catch (e) {
    next(e)
  }
}
