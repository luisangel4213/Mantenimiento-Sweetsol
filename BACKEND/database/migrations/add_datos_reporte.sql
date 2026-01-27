-- ============================================================
-- Migración: Agregar columna datos_reporte a ordenes_mantenimiento
-- ============================================================
-- Ejecutar en MySQL Workbench si la base de datos ya existe
-- y necesita agregar la nueva columna.
-- ============================================================

USE `sweetsol_mantenimiento`;

ALTER TABLE `ordenes_mantenimiento`
  ADD COLUMN `datos_reporte` JSON NULL 
  COMMENT 'Datos estructurados del reporte completo de orden de trabajo'
  AFTER `trabajo_realizado`;

-- ============================================================
-- La columna datos_reporte almacenará un objeto JSON con:
-- - tipoOrden, ubicacionTecnica, emplazamiento, grupoPlanificador, responsablePtoTriba, responsable1
-- - operacionesPlaneadas (array)
-- - operacionesNoPlaneadas (array)
-- - repuestos (array)
-- - observaciones
-- - ejecutanteNombre, ejecutanteFecha, solicitanteNombre, solicitanteFecha, encargadoFecha
-- - firmas (objeto con ejecutante, solicitante, encargado como base64)
-- ============================================================
