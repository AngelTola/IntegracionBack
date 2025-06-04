//src/routes/notificaciones/notificacion.routes.ts
import { Router } from 'express';
import { NotificacionController } from '../../controllers/notificaciones/notificacion.controller';
import { SSEController } from '../../controllers/notificaciones/sse.controller';
import { SSEService } from '../../services/notificaciones/sse.service';
import { NotificacionService } from '../../services/notificaciones/notificacion.service';
import { requireAuth } from '../../middlewares/auth/authMiddleware';

const sseService = SSEService.getInstance();
const notificacionService = new NotificacionService();
const notificacionController = new NotificacionController(notificacionService);
const sseController = new SSEController(sseService);

export const createNotificacionRoutes = () => {
  const router = Router();

  // SSE conexion
  router.get(
    '/sse/connect',
    (req, res) => sseController.conectar(req, res)
  );

  router.get(
    '/', 
    (req, res) => { res.status(200).json({ message: 'Notification API is running' }); }
  );

  // Panel notificaciones
  router.get(
    '/panel-notificaciones',
    requireAuth,
    (req, res) => notificacionController.obtenerPanelNotificaciones(req, res)
  );

  // Eliminar notificacion
  router.delete(
    '/eliminar-notificacion/:id',
    requireAuth,
    (req, res) => notificacionController.eliminarNotificacion(req, res)
  );

  // Detalle de notificacion
  router.get(
    '/detalle-notificacion/:id',
    requireAuth,
    (req, res) => notificacionController.obtenerDetalleNotificacion(req, res)
  );

  // Notificacion leida
  router.put(
    '/notificacion-leida/:id',
    requireAuth,
    (req, res) => notificacionController.marcarComoLeida(req, res)
  );

  // Obtener conteo no leidas
  router.get(
    '/notificaciones-no-leidas',
    requireAuth,
    (req, res) => notificacionController.obtenerConteoNoLeidas(req, res)
  );

  return router;
};