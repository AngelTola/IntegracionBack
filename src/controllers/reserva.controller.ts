//SIMULACION DE LOS CONTROLES DE RESERVA PARA USO DE LAS NOTIFICACIONES
import { Request, Response } from 'express';
import { ReservaService } from '../services/reserva.service';
import { EstadoReserva } from '@prisma/client';

export class ReservaController {
  private reservaService: ReservaService;

  constructor(reservaService: ReservaService) {
    this.reservaService = reservaService;
  }

  // Cambiar el estado de una reserva
  async cambiarEstadoReserva(req: Request, res: Response): Promise<void> {
    try {
      const { reservaId } = req.params;
      const { nuevoEstado } = req.body;

      if (!nuevoEstado) {
        res.status(400).json({ error: 'El nuevo estado es requerido.' });
        return;
      }

      const reserva = await this.reservaService.cambiarEstadoReserva(reservaId, nuevoEstado as EstadoReserva);
      res.json(reserva);
    } catch (error: any) {
      console.error('Error al cambiar el estado de la reserva:', error);
      res.status(500).json({ error: error.message || 'Error al cambiar el estado de la reserva.' });
    }
  }
}