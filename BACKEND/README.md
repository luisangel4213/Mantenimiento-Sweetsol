# Backend - Sistema de Mantenimiento Industrial

Backend Node.js + Express con MySQL. Arquitectura por capas.

## Estructura

```
src/
├── config/         # Variables de entorno (env.js)
├── db.js           # Pool MySQL (mysql2), query, getConnection, testConnection
├── models/         # User, Rol, Estacion, Maquina, OrdenMantenimiento, Evidencia, Informe (MySQL)
├── services/       # Lógica de negocio
├── controllers/    # Manejo de req/res
├── routes/         # Definición de rutas
├── constants/      # roles (ROLES, ROLES_LIST)
├── middleware/     # auth, authorize, multer, errorHandler
├── app.js
└── index.js        # Entrada

database/
├── schema.sql         # DDL + datos iniciales (roles, estación)
├── fix-mysql-user.sql # Corrige root en MySQL 8 si falla la conexión
└── runSeeds.js        # Seeds: usuarios, máquinas (se ejecuta al arrancar si tablas vacías)
scripts/
└── init-env.js        # npm run init:env → crea .env desde env.example
```

## MySQL: primer uso

1. Crear la base de datos:
   ```sql
   CREATE DATABASE sweetsol_mantenimiento CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Aplicar el esquema:
   ```bash
   mysql -u root -p sweetsol_mantenimiento < database/schema.sql
   ```
   (o ejecutar el contenido de `database/schema.sql` desde tu cliente MySQL).

3. Configurar `.env` (copiar `env.example`) con `DB_*`.

4. Al arrancar (`npm run dev` o `npm start`), el backend:
   - Comprueba la conexión con `testConnection()`
   - Ejecuta `runSeeds()`: si `usuarios` o `maquinas` están vacías, inserta usuarios de prueba y 2 máquinas de ejemplo.

### Si aparece «usuario o contraseña incorrectos»

1. **Crear o revisar `.env`**: `npm run init:env` (copia `env.example` a `.env` si no existe).
2. **MySQL 8**: a veces el plugin por defecto impide conectar. Ejecute (desde la carpeta `BACKEND`):
   ```bash
   mysql -u root -p < database/fix-mysql-user.sql
   ```
   Escriba la contraseña actual de `root`. El script cambia a `mysql_native_password` y deja `root` sin contraseña. En `.env` use `DB_PASSWORD=` (vacío).
3. **XAMPP/WAMP**: suele ser `DB_USER=root` y `DB_PASSWORD=` (vacío). Si `mysql` no está en el PATH, use la ruta completa, p. ej. `C:\xampp\mysql\bin\mysql -u root -p < database\fix-mysql-user.sql`.

## Variables de entorno

Copia `env.example` a `.env` y ajusta:

| Variable       | Descripción                    | Por defecto              |
|----------------|--------------------------------|--------------------------|
| PORT           | Puerto del servidor            | 3000                     |
| NODE_ENV       | development / production       | development              |
| JWT_SECRET     | Secreto para firmar JWT        | (obligatorio en prod)    |
| JWT_EXPIRES_IN | Caducidad del token (ej. 7d)   | 7d                       |
| API_BASE_URL   | URL base (evidencias, CORS)    | http://localhost:3000    |
| UPLOAD_DIR     | Carpeta de archivos subidos    | ./uploads                 |
| DB_HOST        | MySQL: host                    | localhost                |
| DB_PORT        | MySQL: puerto                  | 3306                     |
| DB_USER        | MySQL: usuario                 | root                     |
| DB_PASSWORD    | MySQL: contraseña              | (vacío)                  |
| DB_NAME        | MySQL: base de datos           | sweetsol_mantenimiento   |

## MySQL (db.js)

- **`query(sql, params)`** — Ejecuta una consulta. Devuelve `[rows, fields]`.
- **`getConnection()`** — Conexión del pool para transacciones. `connection.release()` al terminar.
- **`testConnection()`** — `SELECT 1`. Se usa al arrancar.

## Instalación y ejecución

```bash
npm install
cp env.example .env
# Crear DB y ejecutar database/schema.sql (ver "MySQL: primer uso")
npm run dev   # desarrollo
npm start     # producción
```

## Autenticación JWT

- **Login**: `POST /api/auth/login` con `{ usuario, password }`. Contraseñas con **bcrypt**. Respuesta: `{ token, user }`.
- **Token**: JWT con `sub` (id) y `role`. `auth` verifica `Authorization: Bearer <token>` y asigna `req.user`.
- **`authorize(...roles)`**: tras `auth`. 403 si `req.user.role` no está en los roles indicados.
- **Roles**: `JEFE_MANTENIMIENTO`, `OPERARIO_MANTENIMIENTO`, `OPERARIO_PRODUCCION`.

## API

- **POST /api/auth/login**  
  Body: `{ usuario, password }`  
  Respuesta: `{ token, user: { id, usuario, email, nombre, role } }`

- **GET /api/auth/me**  
  Requiere `Authorization: Bearer <token>`.

- **GET /api/mantenimiento** (consultar historial / listado)  
  Query: `?estado=&equipoId=&asignadoA=&creadoPor=&desde=&hasta=`. `desde`/`hasta`: fecha de creación (ej. `YYYY-MM-DD` o `YYYY-MM-DD HH:mm:ss`). Requiere auth.

- **POST /api/mantenimiento** (crear orden)  
  Body: `{ titulo, descripcion?, equipoId?, prioridad? }`. Requiere auth.

- **GET /api/mantenimiento/:id**  
  Detalle de la orden (con evidencias).

- **PUT /api/mantenimiento/:id**  
  Actualizar campos de la orden.

- **POST /api/mantenimiento/:id/asignar** (asignar orden)  
  Body: `{ asignadoA: number | null }`. 409 si la orden está completada o cancelada.

- **POST /api/mantenimiento/:id/iniciar** (iniciar orden)  
  Sin body. Estado → `en_progreso`, `fecha_inicio` = NOW. Si no tiene asignado, se asigna al usuario del token. 409 si no está en `pendiente`.

- **POST /api/mantenimiento/:id/finalizar** (finalizar orden)  
  Body: `{ trabajoRealizado?: string }`. Estado → `completada`, `fecha_cierre` = NOW. 409 si no está en `en_progreso`.

- **DELETE /api/mantenimiento/:id**

- **GET /api/mantenimiento/:id/informe/datos** (datos para PDF y Excel)  
  Devuelve JSON estructurado: `orden` (enriquecida con equipoNombre, estacionNombre, creadoPorNombre, asignadoANombre, evidencias), `informe` (observaciones, firmaUrl, generadoPor, fechaGeneracion o `null`), `paraPDF` y `paraExcel` (vistas listas para exportar). 404 si la orden no existe.

- **GET /api/mantenimiento/:id/informe/datos** (datos para PDF y Excel)  
  Devuelve JSON estructurado: `orden` (enriquecida con equipoNombre, estacionNombre, creadoPorNombre, asignadoANombre, evidencias), `informe` (observaciones, firmaUrl, generadoPor, fechaGeneracion o `null`), `paraPDF` y `paraExcel` (vistas listas para exportar). 404 si la orden no existe.

- **GET /api/mantenimiento/:id/informe**  
  Obtiene el informe técnico de la orden (404 si no existe).

- **POST /api/mantenimiento/:id/informe**  
  Body: `{ observaciones?, firma_ruta? }`. Crea el informe (generado_por = usuario del token). 409 si ya existe.

- **POST /api/mantenimiento/:id/evidencias** (subida de imágenes)  
  `Content-Type: multipart/form-data`, campo `evidencias` (múltiple). Solo imágenes: JPEG, PNG, GIF, WebP. Máx. 5 MB por archivo, 10 archivos. Se validan extensión, MIME y nombre. Se guardan en `UPLOAD_DIR/ordenes/{id}/`. 409 si la orden está cancelada.

- **GET/POST /api/equipos**  
  GET: `?area=&criticidad=`. **authorize**: JEFE_MANTENIMIENTO, OPERARIO_MANTENIMIENTO.

- **GET/PUT/DELETE /api/equipos/:id**

## Usuarios de prueba (seeds)

| Usuario    | Contraseña | Rol                    |
|------------|------------|------------------------|
| jefe       | 123456     | JEFE_MANTENIMIENTO     |
## Datos para informes (PDF y Excel)

**GET /api/mantenimiento/:id/informe/datos** devuelve un JSON con todo lo necesario para generar PDF o Excel en el frontend:

| Clave      | Descripción |
|------------|-------------|
| `orden`    | Orden con `id`, `titulo`, `descripcion`, `trabajoRealizado`, `estado`, `prioridad`, `fechaInicio`, `fechaCierre`, `equipoId`, `equipoNombre`, `estacionNombre`, `creadoPor`, `creadoPorNombre`, `asignadoA`, `asignadoANombre`, `evidencias` (`[{ url, nombre }]`). |
| `informe`  | Si existe: `observaciones`, `firmaUrl`, `generadoPor`, `fechaGeneracion`. Si no: `null`. |
| `paraPDF`  | `{ orden: { id, titulo, descripcion, trabajoRealizado, evidencias }, firmaUrl, generadoPor }` — listo para `exportarInformePDF`. |
| `paraExcel`| `{ orden, firmaUrl, generadoPor, observaciones }` — listo para `exportarInformeExcel`. |

El frontend puede usar `paraPDF.orden` con `paraPDF.firmaUrl` (o la firma del canvas) y `paraPDF.generadoPor` en `exportarInformePDF`, e igual con `paraExcel` para Excel.

| operario1  | 123456     | OPERARIO_MANTENIMIENTO |
| produccion | 123456     | OPERARIO_PRODUCCION    |

## Evidencias (subida de imágenes)

- **Asociación con orden**: cada imagen se guarda en `UPLOAD_DIR/ordenes/{ordenId}/` y se vincula en la tabla `evidencias` con `orden_id`. Se valida que la orden exista y no esté cancelada **antes** de escribir en disco.
- **Validación de archivos**: solo JPEG, PNG, GIF y WebP; extensión debe coincidir con el MIME; nombre sin `../` ni `/`; máx. 5 MB por archivo y 10 archivos; campo del form: `evidencias`.
- **Guardado seguro**: nombres de fichero `{hex}-{timestamp}{ext}` (sin datos del usuario); rutas relativas en BD (`ordenes/{id}/{nombre}`); al borrar una orden se elimina la carpeta `ordenes/{id}`.
- Se sirven en `GET /uploads/ordenes/{ordenId}/{filename}` (o `/uploads/{ruta}` según lo almacenado en `archivo_ruta`).
