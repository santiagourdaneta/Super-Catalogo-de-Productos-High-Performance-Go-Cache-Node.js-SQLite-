// back/src/config.ts
import dotenv from 'dotenv';
dotenv.config();

export const Config = {
    // Servicio de Cache de Alto Rendimiento (Go)
    cacheService: {
        url: 'http://127.0.0.1:8080',
        timeout: 50 // ms (Debe ser súper rápido)
    },

    // Servidor Express
    server: {
        port: process.env.PORT || 3000,
        apiURL: 'http://localhost:3000/api'
    },

    // 🔒 Secretos locales (del archivo .env)
    secrets: {
        dbKey: process.env.DB_KEY || 'default_db_key',
        jwtSecret: process.env.JWT_SECRET_KEY || 'default_jwt_secret'
    }
};