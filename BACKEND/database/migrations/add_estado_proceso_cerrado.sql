-- ============================================================
-- Migración: Añadir estado "Proceso Cerrado" a órdenes de mantenimiento
-- ============================================================
-- Ejecutar en MySQL Workbench si la base de datos ya existe
-- y necesita el nuevo valor en el ENUM de estado.
-- ============================================================

USE `sweetsol_mantenimiento`;

ALTER TABLE `ordenes_mantenimiento`
  MODIFY COLUMN `estado` ENUM('pendiente','en_progreso','completada','proceso_cerrado','cancelada') NOT NULL DEFAULT 'pendiente';
