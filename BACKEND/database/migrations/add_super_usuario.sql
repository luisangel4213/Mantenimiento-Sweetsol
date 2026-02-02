-- ============================================================
-- Migración: Rol Super Usuario y usuario Superior
-- ============================================================
-- Ejecutar en MySQL Workbench si la base de datos ya existe
-- y necesita el rol SUPER_USUARIO y el usuario Superior.
-- Luego ejecute en el backend: npm run fix:users
-- ============================================================

USE `sweetsol_mantenimiento`;

-- Insertar rol SUPER_USUARIO si no existe
INSERT IGNORE INTO `roles` (`codigo`, `nombre`) VALUES
  ('SUPER_USUARIO', 'Super Usuario');

-- ============================================================
-- El usuario "Superior" se crea con: npm run fix:users
-- Credenciales: Usuario: superior | Contraseña: 123456
-- ============================================================
