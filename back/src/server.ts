// back/src/server.ts
import express from 'express';
import cors from 'cors';
import { db } from './db';
import { productRouter } from './routes/productRoutes';
import { Config } from './config';

const app = express();
const PORT = Config.server.port;

app.use(cors());
app.use(express.json());

// RUTAS
app.use('/api/products', productRouter);
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'Backend is running!', port: PORT });
});

// Inicializar DB (SQLite)
db.init();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});