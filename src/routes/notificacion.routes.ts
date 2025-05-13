import { Router } from 'express';
import { NotificacionController, generarNotificacionRentaConcluida, generarNotificacionRentaCancelada, generarNotificacionNuevaCalificacion, generarNotificacionReservaConfirmada } from '../controllers/notificacion.controller';
import { cambiarEstadoReserva } from '../controllers/notificacion.controller';
import { SSEController } from '../controllers/sse.controller';
import { SSEService } from '../services/sse.service';
import { NotificacionService } from '../services/notificacion.service';

// Usar la instancia única del servicio SSE
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

  // generar notificación de renta finalizada
  router.post(
    '/generar-renta-concluida/:rentaId',
    generarNotificacionRentaConcluida
  );

  // generar notificacion de renta cancelada
  router.post(
    '/generar-renta-cancelada/:rentaId',
    generarNotificacionRentaCancelada
  );

  // generar notificación de nueva calificación para un vehículo
  router.post(
    '/generar-notificacion-calificacion/:rentaId', 
    generarNotificacionNuevaCalificacion
  );

  router.post(
    '/generar-reserva-confirmada/:reservaId',
    generarNotificacionReservaConfirmada
  );

  // obtener notificaciones para el dropdown (> 3)
  router.get(
    '/dropdown-notificaciones/:usuarioId',
    (req, res) => notificacionController.obtenerNotificacionesDropdown(req, res)
  );

  router.put(
    '/cambiar-estado-reserva/:reservaId', 
    cambiarEstadoReserva);

  return router;
};