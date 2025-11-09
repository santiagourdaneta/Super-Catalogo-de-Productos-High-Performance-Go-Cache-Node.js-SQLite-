// back/src/routes/productRoutes.ts

import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import axios from 'axios';
import { Config } from '../config';
import rateLimit from 'express-rate-limit';

const productRouter = Router();

// Rate limiter for POST /api/products
const productPostLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 10, // limit each IP to 10 requests per windowMs
    message: { message: "Demasiadas solicitudes para crear producto desde esta IP, por favor espere un momento." },
});

// Rate limiter for GET /api/products/search
const productGetLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 60, // limit each IP to 60 requests per windowMs
    message: { message: "Demasiadas solicitudes de búsqueda de productos desde esta IP, por favor espere un momento." },
});

// --- 1. ESQUEMA DE VALIDACIÓN (Seguridad y Tipado Estricto) ---

// Esquema para validar los parámetros de paginación en la URL
const paginationSchema = z.object({
    page: z.string().default('1').transform(val => parseInt(val)).pipe(z.number().min(1)),
    limit: z.string().default('10').transform(val => parseInt(val)).pipe(z.number().min(1).max(100)),
});

// Esquema para validar la creación de un nuevo producto (Escritura)
const newProductSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
    price: z.number().positive("El precio debe ser un número positivo."),
    stock: z.number().int().min(0, "El stock no puede ser negativo."),
});

// --- 2. RUTA DE LECTURA (GET): Priorizar Cache Go ---

/**
 * GET /api/products/search
 * Lógica de Alto Rendimiento: Intenta obtener datos del Cache Go (8080) primero.
 * Si falla o hay un Cache Miss, cae a la Base de Datos (SQLite).
 */
productRouter.get('/search', productGetLimiter, async (req, res) => {
    try {
        // Validación de entrada con Zod
        const { page, limit } = paginationSchema.parse(req.query);

        // 1. INTENTO DE LECTURA DESDE CACHE GO (Velocidad de la luz)
        try {
            // Se usa un endpoint que simula la búsqueda por página en el Cache Go
            const cacheResponse = await axios.get(
                `${Config.cacheService.url}/api/v1/cache/products/page/${page}`,
                { timeout: Config.cacheService.timeout } // Máximo 50ms de latencia
            );
            
            console.log(`[CACHE HIT] Sirviendo página ${page} desde Go Cache.`);
            return res.json({ ...cacheResponse.data, source: 'cache-go' });

        } catch (cacheError: any) {
            // El error puede ser un timeout, una conexión fallida, o Cache Miss (404)
            console.warn(`[CACHE MISS/FAIL] Error de Cache Go. Cayendo a SQLite: ${cacheError.message}`);
        }
        
        // 2. LECTURA DESDE SQLITE (Sólo como respaldo)
        const offset = (page - 1) * limit;
        const dbInstance = db.getDb();
        
        // Obtener productos
        const products = await dbInstance.all(
            `SELECT id, name, price,stock FROM products LIMIT ? OFFSET ?`, 
            [limit, offset]
        );
        
        // Obtener total para la paginación
        const totalResult = await dbInstance.get(`SELECT COUNT(*) as total FROM products`);
        const total = totalResult ? totalResult.total : 0;
        
        // Simulación de "Read-Through": Cargar resultados en el Cache Go para la próxima vez
        // NOTE: En un sistema real, esta carga debería ser asíncrona y robusta.
         try {
            await axios.post(`${Config.cacheService.url}/api/v1/cache/save`, { products: products, page: page });
         } catch(e) { /* ignore cache write failure */ }

        return res.json({
            resultados: products,
            total: total,
            page,
            limit,
            source: 'sqlite-db'
        });

    } catch (error) {
        // Manejo de errores de validación de Zod
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Error de validación de entrada.', errors: error.errors });
        }
        console.error('Error interno del servidor:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// --- 3. RUTA DE ESCRITURA (POST): Garantizar Consistencia por HTTP ---

/**
 * POST /api/products
 * Lógica de Consistencia: Escribe en SQLite y luego invalida el Cache Go directamente
 * para asegurar que la próxima lectura sea fresca.
 */
productRouter.post('/', productPostLimiter, async (req, res) => {
    try {
        // Validación de entrada estricta antes de tocar la DB
        const validatedProduct = newProductSchema.parse(req.body);
        const { name, price, stock } = validatedProduct;

        const dbInstance = db.getDb();
        
        // 1. ESCRITURA EN SQLITE
        const result = await dbInstance.run(
            `INSERT INTO products (name, price, stock) VALUES (?, ?, ?)`, 
            [name, price, stock]
        );
        const newId = result.lastID;

        // 2. INVALIDACIÓN DIRECTA DEL CACHE GO (Reemplazo de Kafka)
        try {
            await axios.post(
                `${Config.cacheService.url}/api/v1/cache/invalidate`, 
                { id: newId }
            );
            console.log(`[CACHE GO INVALIDATION OK] Notificación HTTP enviada para ID: ${newId}`);
        } catch (httpError) {
            // Advertencia crítica: La consistencia podría fallar si Go Cache está inactivo.
            console.warn('⚠️ FALLO CRÍTICO: No se pudo invalidar Cache Go. Los datos pueden ser inconsistentes.');
            // Podríamos implementar un sistema de reintento aquí
        }

        res.status(201).json({ 
            message: 'Producto creado. Cache invalidado (por HTTP directo).', 
            id: newId,
            product: validatedProduct 
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Error de validación al crear producto.', errors: error.errors });
        }
        console.error('Error al crear producto:', error);
        res.status(500).json({ message: 'Error interno al procesar la creación.' });
    }
});


export { productRouter };