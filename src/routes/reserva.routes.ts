//SIMULACION DE RUTAS DE RESERVA PARA USO DE LAS NOTIFICACIONES
import { Router } from 'express';
import { ReservaController } from '../controllers/reserva.controller';
import { SSEController } from '../controllers/sse.controller'; // Importar SSEController

export const createReservaRoutes = (reservaController: ReservaController, sseController: SSEController) => {
  const router = Router();

  // Cambiar el estado de una reserva
  router.put(
    '/cambiar-estado-reserva/:reservaId',
    (req, res) => reservaController.cambiarEstadoReserva(req, res)
  );

  // Ruta para SSE
  router.get('/sse/:usuarioId', (req, res) => {
    sseController.conectar(req, res); // Usar SSEController para conectar el cliente
  });

  return router;
};