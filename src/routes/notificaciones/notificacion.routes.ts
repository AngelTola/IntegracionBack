import { Router } from 'express';
import { NotificacionController } from '../../controllers/notificaciones/notificacion.controller';
import { SSEController } from '../../controllers/notificaciones/sse.controller';
import { SSEService } from '../../services/notificaciones/sse.service';
import { NotificacionService } from '../../services/notificaciones/notificacion.service';

const sseService = SSEService.getInstance();
const notificacionService = new NotificacionService();
const notificacionController = new NotificacionController(notificacionService);
const sseController = new SSEController(sseService);

export const createNotificacionRoutes = () => {
  const router = Router();

  // Endpoint para conexión SSE
  router.get(
    '/sse/:usuarioId',
    (req, res) => sseController.conectar(req, res)
  );

  // Rutas existentes
  router.get(
    '/', 
    (req, res) => { res.status(200).json({ message: 'Notification API is running' });
  });

  // panel de notificaciones
  router.get(
    '/panel-notificaciones/:usuarioId',
    (req, res) => notificacionController.obtenerPanelNotificaciones(req, res)
  );

  // eliminar notificación
  router.delete(
    '/eliminar-notificacion/:id',
    (req, res) => notificacionController.eliminarNotificacion(req, res)
  );

  // detalle de una notificación
  router.get(
    '/detalle-notificacion/:id',
    (req, res) => notificacionController.obtenerDetalleNotificacion(req, res)
  );

  // marcar notificación como leída
  router.put(
    '/notificacion-leida/:id/:usuarioId',
    (req, res) => notificacionController.marcarComoLeida(req, res)
  );

  //obtener conteo de notificaciones no leidas
  router.get(
    '/notificaciones-no-leidas/:usuarioId',
    (req, res) => notificacionController.obtenerConteoNoLeidas(req, res)
  );
  return router;
};