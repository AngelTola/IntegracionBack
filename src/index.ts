import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { SSEService } from './services/sse.service';
import { NotificacionService } from './services/notificacion.service';
import { NotificacionController } from './controllers/notificacion.controller';
import { NotificacionJob } from './jobs/notificacion.job';
import { SSEController } from './controllers/sse.controller';
import { createNotificacionRoutes } from './routes/notificacion.routes';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.socket.setKeepAlive(true);
  req.socket.setTimeout(0);
  next();
});

app.use((req, res, next) => {
  if (req.path.includes('/api/notificaciones/sse')) {
    // Saltar compresión para SSE
    res.set('Content-Encoding', 'identity');
  }
  next();
});

// Usar la instancia única del servicio SSE
const sseService = SSEService.getInstance();
const notificacionService = new NotificacionService();

// controllers
const notificacionController = new NotificacionController(notificacionService);
const sseController = new SSEController(sseService);

// Configurar ping periódico para el SSE
setInterval(() => {
  sseService.enviarPing();
}, 30000); // 30 segundos

// Rutas
app.use('/api/notificaciones', createNotificacionRoutes(notificacionController, sseController));
app.get('/api/notificaciones/sse/:usuarioId', (req, res) => {
  sseController.conectar(req, res);
});

// End point para verificar la salud de la conexión de la API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

NotificacionJob.iniciar();

process.on('SIGTERM', () => {
  console.log('Cerrando servidor...');
  sseService.cleanup();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});