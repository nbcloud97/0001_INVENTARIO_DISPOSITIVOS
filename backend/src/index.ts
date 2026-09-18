import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { apiRouter } from './routes/api';
import { swaggerDocument } from './docs/swaggerSpec';
import { AuthService } from './services/authService';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de orígenes permitidos en CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'];

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (como curl, mobile apps o requests del mismo servidor)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // En dev permite orígenes dinámicos
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Documentación interactiva de la API con Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Router
app.use('/api/v1', apiRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'inventario-dispositivos-backend',
    timestamp: new Date().toISOString(),
  });
});

// Middleware centralizado de gestión de errores
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
  console.log(`📚 Documentación Swagger API lista en http://localhost:${PORT}/api/docs`);
  await AuthService.ensureDefaultAdmin();
});
