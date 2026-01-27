# Solución al Error 401 en el Login

Si no puedes ingresar con ninguna credencial, sigue estos pasos:

## Solución Rápida

### Opción 1: Ejecutar script de reparación (Recomendado)

```bash
cd BACKEND
npm run fix:users
```

Este script:
- Verifica que los roles existan
- Crea o actualiza los usuarios necesarios
- Activa usuarios inactivos
- Resetea las contraseñas a `123456`

### Opción 2: Reiniciar el backend

El backend ejecuta automáticamente `runSeeds()` al iniciar, que ahora también actualiza usuarios existentes:

```bash
cd BACKEND
# Detener el servidor si está corriendo (Ctrl+C)
npm run dev
```

## Credenciales por Defecto

Después de ejecutar el script, usa estas credenciales:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `jefe` | `123456` | Jefe de Mantenimiento |
| `operario1` | `123456` | Operario de Mantenimiento |
| `produccion` | `123456` | Operario de Producción |

## Verificación Manual en MySQL

Si prefieres verificar manualmente, ejecuta en MySQL Workbench:

```sql
USE sweetsol_mantenimiento;

-- Ver usuarios y su estado
SELECT u.id, u.usuario, u.email, u.nombre, u.activo, r.codigo AS role
FROM usuarios u
LEFT JOIN roles r ON r.id = u.rol_id
ORDER BY u.usuario;

-- Verificar que los usuarios estén activos
-- Si activo = 0, el usuario no puede hacer login
```

## Si el problema persiste

1. **Verifica que MySQL esté corriendo**
2. **Verifica el archivo `.env`** en la carpeta BACKEND:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=sweetsol_mantenimiento
   ```
3. **Verifica que la base de datos exista**:
   ```sql
   SHOW DATABASES;
   ```
4. **Verifica que las tablas existan**:
   ```sql
   USE sweetsol_mantenimiento;
   SHOW TABLES;
   ```

## Crear usuarios manualmente (si es necesario)

Si nada funciona, ejecuta esto en MySQL:

```sql
USE sweetsol_mantenimiento;

-- Obtener IDs de roles
SELECT id, codigo FROM roles;

-- Reemplaza los IDs según tu base de datos
-- Contraseña hasheada para "123456"
SET @pass = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- Insertar o actualizar usuarios
INSERT INTO usuarios (rol_id, usuario, email, password, nombre, activo) VALUES
(1, 'jefe', 'jefe@sweetsol.com', @pass, 'Jefe Mantenimiento', 1),
(2, 'operario1', 'op1@sweetsol.com', @pass, 'Operario Mantenimiento', 1),
(3, 'produccion', 'prod@sweetsol.com', @pass, 'Operario Producción', 1)
ON DUPLICATE KEY UPDATE
  rol_id = VALUES(rol_id),
  password = VALUES(password),
  activo = 1;
```

**Nota:** El hash de contraseña puede variar. Es mejor usar el script `fix:users` que genera el hash correctamente.

