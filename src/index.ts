import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { SSEService } from './services/sse.service';
import { NotificacionService } from './services/notificacion.service';
import { NotificacionController } from './controllers/notificacion.controller';
import { SSEController } from './controllers/sse.controller';
import { createNotificacionRoutes } from './routes/notificacion.routes';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// services
const sseService = new SSEService();
const notificacionService = new NotificacionService(sseService);

// controllers
const notificacionController = new NotificacionController(notificacionService);
const sseController = new SSEController(sseService);

// Configurar ping periódico para el SSE
setInterval(() => {
  sseService.enviarPing();
}, 30000); // 30 segundos

// Rutas
app.use('/api/notificaciones', createNotificacionRoutes(notificacionController, sseController));

// End point para verificar la salud de la conexión de la API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});