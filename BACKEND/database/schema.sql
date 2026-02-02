-- ============================================================
-- Schema: Sistema de Control de Mantenimiento Industrial
-- ============================================================
-- Ejecutar en MySQL Workbench: abra este archivo y pulse el rayo.
-- Crea la base sweetsol_mantenimiento, la selecciona y crea las tablas.
-- La base aparecerá en SCHEMAS (panel izquierdo) al finalizar.
-- ============================================================

CREATE DATABASE IF NOT EXISTS `sweetsol_mantenimiento`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `sweetsol_mantenimiento`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- roles
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `informes`;
DROP TABLE IF EXISTS `evidencias`;
DROP TABLE IF EXISTS `ordenes_mantenimiento`;
DROP TABLE IF EXISTS `maquinas`;
DROP TABLE IF EXISTS `estaciones`;
DROP TABLE IF EXISTS `usuarios`;
DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(50) NOT NULL COMMENT 'Ej: JEFE_MANTENIMIENTO, OPERARIO_MANTENIMIENTO',
  `nombre` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- usuarios (FK: roles)
-- ------------------------------------------------------------
CREATE TABLE `usuarios` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `rol_id` INT UNSIGNED NOT NULL,
  `usuario` VARCHAR(80) NOT NULL,
  `email` VARCHAR(120) NULL,
  `password` VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt',
  `nombre` VARCHAR(120) NOT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuarios_usuario` (`usuario`),
  UNIQUE KEY `uk_usuarios_email` (`email`),
  KEY `ix_usuarios_rol` (`rol_id`),
  CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- estaciones
-- ------------------------------------------------------------
CREATE TABLE `estaciones` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(120) NOT NULL,
  `codigo` VARCHAR(50) NULL,
  `descripcion` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_estaciones_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- maquinas (FK: estaciones)
-- ------------------------------------------------------------
CREATE TABLE `maquinas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `estacion_id` INT UNSIGNED NOT NULL,
  `nombre` VARCHAR(120) NOT NULL,
  `codigo` VARCHAR(50) NULL,
  `marca` VARCHAR(80) NULL,
  `modelo` VARCHAR(80) NULL,
  `criticidad` ENUM('alta','media','baja') NULL DEFAULT 'media',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_maquinas_codigo` (`codigo`),
  KEY `ix_maquinas_estacion` (`estacion_id`),
  CONSTRAINT `fk_maquinas_estacion` FOREIGN KEY (`estacion_id`) REFERENCES `estaciones` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ordenes_mantenimiento (FK: maquinas, usuarios asignado/creador)
-- ------------------------------------------------------------
CREATE TABLE `ordenes_mantenimiento` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `maquina_id` INT UNSIGNED NULL,
  `asignado_a` INT UNSIGNED NULL COMMENT 'Usuario operario asignado',
  `creado_por` INT UNSIGNED NULL,
  `titulo` VARCHAR(200) NOT NULL,
  `descripcion` TEXT NULL,
  `estado` ENUM('pendiente','en_progreso','completada','proceso_cerrado','cancelada') NOT NULL DEFAULT 'pendiente',
  `trabajo_realizado` TEXT NULL,
  `datos_reporte` JSON NULL COMMENT 'Datos estructurados del reporte completo de orden de trabajo',
  `prioridad` ENUM('alta','media','baja') NULL DEFAULT 'media',
  `fecha_inicio` DATETIME NULL,
  `fecha_cierre` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_ordenes_maquina` (`maquina_id`),
  KEY `ix_ordenes_asignado` (`asignado_a`),
  KEY `ix_ordenes_creado` (`creado_por`),
  KEY `ix_ordenes_estado` (`estado`),
  CONSTRAINT `fk_ordenes_maquina` FOREIGN KEY (`maquina_id`) REFERENCES `maquinas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ordenes_asignado` FOREIGN KEY (`asignado_a`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ordenes_creado` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- evidencias (FK: ordenes_mantenimiento)
-- ------------------------------------------------------------
CREATE TABLE `evidencias` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `orden_id` INT UNSIGNED NOT NULL,
  `archivo_ruta` VARCHAR(500) NOT NULL COMMENT 'Ruta relativa o URL del archivo',
  `nombre_original` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_evidencias_orden` (`orden_id`),
  CONSTRAINT `fk_evidencias_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_mantenimiento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- informes (FK: ordenes_mantenimiento, usuarios)
-- ------------------------------------------------------------
CREATE TABLE `informes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `orden_id` INT UNSIGNED NOT NULL,
  `generado_por` INT UNSIGNED NOT NULL,
  `firma_ruta` VARCHAR(500) NULL COMMENT 'Ruta de la imagen de firma',
  `observaciones` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_informes_orden` (`orden_id`),
  KEY `ix_informes_generado` (`generado_por`),
  CONSTRAINT `fk_informes_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_mantenimiento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_informes_generado` FOREIGN KEY (`generado_por`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- Datos iniciales: roles
-- ------------------------------------------------------------
INSERT INTO `roles` (`codigo`, `nombre`) VALUES
  ('JEFE_MANTENIMIENTO',   'Jefe de Mantenimiento'),
  ('OPERARIO_MANTENIMIENTO', 'Operario de Mantenimiento'),
  ('OPERARIO_PRODUCCION',  'Operario de Producción'),
  ('SUPER_USUARIO',        'Super Usuario');

-- ------------------------------------------------------------
-- Datos iniciales: estación por defecto (usuarios y máquinas: runSeeds o seeds)
-- ------------------------------------------------------------
INSERT INTO `estaciones` (`nombre`, `codigo`, `descripcion`) VALUES
  ('Planta', 'PLANTA', 'Estación principal');

-- ============================================================
-- Si el backend da "usuario o contraseña incorrectos" (MySQL 8):
-- En una NUEVA pestaña de Workbench ejecute (una sola vez):
--
--   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
--   FLUSH PRIVILEGES;
--
-- Luego en .env use:  DB_USER=root  y  DB_PASSWORD=  (vacío)
-- ============================================================
