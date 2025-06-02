import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import passwordRoutes from "./routes/auth/password.routes";
import authRoutes from "./routes/auth/auth.routes";
import session from "express-session";
import passport from "passport";
import "../src/config/googleAuth";
import authRegistroHostRoutes from "./routes/auth/registroHost.routes";
import authRegistroDriverRoutes from './routes/auth/registroDriver.routes';
import "./config/googleAuth";
import usuarioRoutes from './routes/auth/usuario.routes';
import visualizarDriverRoutes from "./routes/auth/visualizarDriver.routes";
import path from 'path';

// Imports notificaciones
import { SSEService } from './services/notificaciones/sse.service';
import { NotificacionService } from './services/notificaciones/notificacion.service';
import { NotificacionController } from './controllers/notificaciones/notificacion.controller';
import { SSEController } from './controllers/notificaciones/sse.controller';
import { createNotificacionRoutes } from './routes/notificaciones/notificacion.routes';
import { v4 as uuidv4 } from 'uuid';

// Cargar variables de entorno
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS robusto – que responde incluso si hay error
app.use((req: express.Request, res: express.Response, next: express.NextFunction): void => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
});

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para keep-alive (para notificaciones SSE)
app.use((req, res, next) => {
  req.socket.setKeepAlive(true);
  req.socket.setTimeout(0);
  next();
});

// Middleware para SSE (evitar compresión)
app.use((req, res, next) => {
  if (req.path.includes('/api/notificaciones/sse')) {
    // Saltar compresión para SSE
    res.set('Content-Encoding', 'identity');
  }
  next();
});

app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    next();
  },
  express.static(path.join(__dirname, "..", "uploads"))
);

app.use(
  session({
    secret: "mi_clave_secreta_segura", // cámbiala por algo más seguro
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // ⚠️ en producción debe ser true con HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static('uploads')); // Servir imágenes desde el servidor

// Configuración de servicios y controladores para notificaciones
const sseService = SSEService.getInstance();
const notificacionService = new NotificacionService();

// Controllers para notificaciones
const notificacionController = new NotificacionController(notificacionService);
const sseController = new SSEController(sseService);

// Configurar ping periódico para el SSE
setInterval(() => {
  sseService.enviarPing();
}, 30000); // 30 segundos

// Rutas originales
app.use("/api", authRoutes);
app.use("/api", passwordRoutes);
app.use("/api", authRegistroHostRoutes);
app.use('/api', authRegistroDriverRoutes);
app.use('/api', usuarioRoutes);
app.use('/api', visualizarDriverRoutes);

// Rutas de notificaciones
app.use('/api/notificaciones', createNotificacionRoutes());

// Endpoint SSE para notificaciones
app.get('/api/notificaciones/sse/:usuarioId', (req, res) => {
  sseController.conectar(req, res);
});

app.get("/", (req, res) => {
  res.send("¡Hola desde la página principal!");
});

// End point para verificar la salud de la conexión de la API
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Manejo de cierre del servidor
process.on('SIGTERM', () => {
  console.log('Cerrando servidor...');
  sseService.cleanup();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//guardadito
export default app;