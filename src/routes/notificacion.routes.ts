import { Router } from 'express';
import { NotificacionController, generarNotificacionRentaConcluida } from '../controllers/notificacion.controller';
import { SSEController } from '../controllers/sse.controller';

export const createNotificacionRoutes = (
  notificacionController: NotificacionController,
  sseController: SSEController
) => {
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

  // generar notificación de renta finalizada
  router.post(
    '/generar-renta-concluida/:rentaId',
    generarNotificacionRentaConcluida
  );

  // obtener notificaciones para el dropdown (> 4)
  router.get(
    '/dropdown-notificaciones/:usuarioId',
    (req, res) => notificacionController.obtenerNotificacionesDropdown(req, res)
  );

  return router;
};