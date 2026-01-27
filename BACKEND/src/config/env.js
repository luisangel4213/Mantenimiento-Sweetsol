export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-cambiar',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  db: {
    host: ((process.env.DB_HOST || 'localhost').replace(/^\uFEFF/, '')).trim(),
    port: Number(process.env.DB_PORT) || 3306,
    user: ((process.env.DB_USER || 'root').replace(/^\uFEFF/, '')).trim(),
    password: ((process.env.DB_PASSWORD || '').replace(/^\uFEFF/, '')).trim(),
    database: ((process.env.DB_NAME || 'sweetsol_mantenimiento').replace(/^\uFEFF/, '')).trim(),
    charset: 'utf8mb4',
    connectionLimit: 10,
    queueLimit: 0,
  },
}
