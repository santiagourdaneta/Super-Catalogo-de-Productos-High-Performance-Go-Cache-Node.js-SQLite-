// back/src/seeder.ts

import { db } from './db';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const PRODUCTS_COUNT = 10000; // La meta de 10,000 productos.

interface ProductData {
    name: string;
    price: number;
    stock: number;
}

/**
 * Genera un mock array de 10,000 productos.
 */
function generateMockProducts(count: number): ProductData[] {
    const products: ProductData[] = [];
    for (let i = 1; i <= count; i++) {
        products.push({
            name: `Producto de Catálogo Rápido #${i}`,
            price: parseFloat((Math.random() * 50 + 10).toFixed(2)), // Precio entre 10 y 60
            stock: Math.floor(Math.random() * 100) // Stock entre 0 y 99
        });
    }
    return products;
}

/**
 * Función principal para la Inserción Masiva (Batch Insertion).
 * Utiliza una única transacción para lograr alta velocidad.
 */
async function seedDatabase() {
    console.log(`🚀 Iniciando proceso de Seeding para ${PRODUCTS_COUNT} productos...`);
    const startTime = process.hrtime.bigint();

    try {
        // Inicializar la conexión a SQLite (usa la función ya existente)
        await db.init();
        const dbInstance = db.getDb();

        // Limpiar la tabla de productos existente (opcional, pero recomendado para seeding)
        await dbInstance.run('DELETE FROM products');
        console.log('Tabla de productos limpiada.');

        const products = generateMockProducts(PRODUCTS_COUNT);

        // --- OPTIMIZACIÓN CRÍTICA: Transacción Única ---
        await dbInstance.run('BEGIN TRANSACTION');

        // Preparar la Sentencia para reutilización
        const stmt = await dbInstance.prepare(
            'INSERT INTO products (name, price, stock) VALUES (?, ?, ?)'
        );

        // Ejecutar las 10,000 inserciones dentro de la transacción
        for (const product of products) {
            await stmt.run(product.name, product.price, product.stock);
        }

        // Finalizar la Sentencia y hacer el COMMIT de toda la operación
        await stmt.finalize();
        await dbInstance.run('COMMIT');

        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1000000;
        
        console.log(`✅ ¡Éxito! Se insertaron ${PRODUCTS_COUNT} productos en ${durationMs.toFixed(2)} ms.`);

    } catch (error) {
        console.error('❌ Error fatal durante el Seeding. Haciendo ROLLBACK.', error);
        // Intentar revertir la transacción en caso de error
        try {
            const dbInstance = db.getDb();
            await dbInstance.run('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error durante el ROLLBACK:', rollbackError);
        }
    } finally {
        // Cerrar la conexión (IMPORTANTE)
        console.log('Finalizando la conexión a la DB.');
        const dbInstance = db.getDb() as Awaited<ReturnType<typeof open>> & { close: () => Promise<void> };
        await dbInstance.close();
    }
}

seedDatabase();