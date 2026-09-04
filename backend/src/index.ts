import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { apiRouter } from './routes/api';
import { swaggerDocument } from './docs/swaggerSpec';
import { AuthService } from './services/authService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());

// Documentación interactiva de la API con Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Router
app.use('/api/v1', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'inventario-dispositivos-backend', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
  console.log(`📚 Documentación Swagger API lista en http://localhost:${PORT}/api/docs`);
  await AuthService.ensureDefaultAdmin();
});
