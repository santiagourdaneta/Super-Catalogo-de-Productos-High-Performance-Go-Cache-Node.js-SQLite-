# 🚀 Súper-Catálogo de Productos: High-Performance

Este proyecto es una implementación de un sistema de catálogo de productos de alto rendimiento utilizando una arquitectura distribuida que prioriza la velocidad de respuesta (latencia) mediante el uso de un servicio de Caching en memoria (Go) como capa frontal para las consultas.

El flujo de datos sigue el patrón **Cache-Aside/Fallback**: si el Cache Service falla o el dato no se encuentra (**Cache Miss**), el sistema recurre inmediatamente a la Base de Datos (SQLite) para garantizar la disponibilidad.

## 🎯 Arquitectura del Sistema

La solución está dividida en tres servicios principales y una base de datos local:

| Servicio | Lenguaje/Framework | Puerto | Propósito |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vue.js 3 + Bulma CSS | `5173` | Interfaz de usuario para visualizar el catálogo y consumir la API. |
| **Backend API** | Node.js (Express) + TypeScript | `3000` | Punto de entrada. Implementa la lógica de **Cache/Fallback** y el control de acceso (JWT). |
| **Cache Service** | Go (Golang) | `8080` | Servicio de caching en memoria. Contiene la lógica para almacenar, buscar y expirar productos. |
| **Base de Datos** | SQLite | N/A | Almacenamiento persistente de los 10,000+ productos. |

## 🛠️ Guía de Inicio Rápido (Quick Start)

Para ejecutar el proyecto, debes levantar los tres servicios en **tres terminales separadas** y en el orden correcto.

### Prerequisitos

* Node.js (v18+)
* Go (v1.20+)
* SQLite
* Tener las dependencias instaladas en cada carpeta (`npm install` en `front/` y `back/`).

### 1. Iniciar la Base de Datos y API (Backend)

Navega a la carpeta `back/` y ejecuta el script de desarrollo. Esto inicializará la base de datos SQLite y pondrá en marcha el servidor Node.js/Express.

```bash
cd back/
npm run dev

(Verás mensajes de CACHE MISS o timeout hasta que el Cache Service se inicie).

2. Iniciar el Cache Service (Go)
Abre una segunda terminal, navega a la carpeta cache-service/ y ejecuta el servicio Go.

cd cache-service/
go run main.go

(Esto resolverá los timeout en el backend y el sistema estará listo para recibir solicitudes de caché).

3. Iniciar el Frontend (Vue/Bulma)
Abre una tercera terminal, navega a la carpeta front/ y ejecuta el frontend.

cd front/
npm run dev

El catálogo estará visible en http://localhost:5173/.

⚙️ Scripts de Desarrollo
Backend (back/)

Comando	Descripción
npm run dev	Inicia el servidor Node.js/Express con ts-node-dev (vigilancia de archivos).
ts-node src/seeder.ts	Inserta 10,000 productos de prueba en SQLite en una sola transacción optimizada.

💡 Puntos Clave del Desarrollo
Inserción Rápida: La siembra (seeding) de 10,000 productos se realiza en una sola transacción SQLite, logrando tiempos de milisegundos.

Fallback de API: El productRoutes.ts del backend siempre intenta obtener la data del Cache Go (http://127.0.0.1:8080) primero. Si el Go Service retorna 404 (Cache Miss) o falla/timeout, la ejecución cae a SQLite.

Diseño Moderno: El frontend utiliza Vue.js 3 y el framework Bulma CSS para un diseño limpio y responsive.

Seguridad (En Pausa): Las rutas API están configuradas para usar authMiddleware con JWT, aunque está comentado/desactivado en el desarrollo para facilitar las pruebas.