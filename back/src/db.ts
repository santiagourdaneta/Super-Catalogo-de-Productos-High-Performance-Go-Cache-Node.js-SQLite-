// back/src/db.ts

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { Config } from './config'; 

// Ruta absoluta al archivo de la base de datos (un nivel arriba de 'back')
const DB_PATH = path.resolve(__dirname, '../../database.sqlite');
let dbInstance: Awaited<ReturnType<typeof open>> | null = null;

/**
 * Inicializa la conexión a la base de datos SQLite y crea la tabla 'products'.
 */
const init = async () => {
    try {
        const dbKey = Config.secrets.dbKey; // Clave del .env

        // 1. Abrir la conexión a la DB
        dbInstance = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });

        console.log(`Usando clave: ${dbKey.substring(0, 10)}... para DB (obtenida del .env).`);

        // 2. Crear tabla de productos si no existe
        await dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                stock INTEGER DEFAULT 0
            );
        `);
        // NOTA: Se eliminan las inserciones iniciales (SEEDING) de aquí.

        console.log('SQLite database initialized. Table structure verified.');
    } catch (error) {
        console.error('Error initializing SQLite:', error);
        // En caso de fallo de inicialización, lanzamos el error para detener el servidor.
        throw error;
    }
};

/**
 * Retorna la instancia de conexión a la DB.
 * Lanza un error si la DB no ha sido inicializada.
 */
const getDb = () => {
    if (!dbInstance) {
        throw new Error('Database not initialized. Call db.init() first.');
    }
    return dbInstance;
};

export const db = { init, getDb };