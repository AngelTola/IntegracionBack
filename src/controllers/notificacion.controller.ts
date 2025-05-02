import { Request, Response } from 'express';
import { NotificacionService, notificarRentaConcluida, notificarRentaCancelada, notificarNuevaCalificacion, notificarReservaConfirmada } from '../services/notificacion.service';
import { TipoDeNotificacion, PrioridadNotificacion } from '@prisma/client';


export class NotificacionController {
  private notificacionService: NotificacionService;

  constructor(notificacionService: NotificacionService) {
    this.notificacionService = notificacionService;
  }

  async obtenerPanelNotificaciones(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId } = req.params;
      const { tipo, prioridad, tipoEntidad, limit, offset } = req.query;

      const filtros: any = { usuarioId };

      if (tipo) filtros.tipo = tipo as TipoDeNotificacion;
      if (prioridad) filtros.prioridad = prioridad as PrioridadNotificacion;
      if (tipoEntidad) filtros.tipoEntidad = tipoEntidad as string;

      if (limit) filtros.limit = parseInt(limit as string);
      if (offset) filtros.offset = parseInt(offset as string);

      const resultado = await this.notificacionService.obtenerNotificaciones(filtros);
      res.json(resultado);
    } catch (error: any) {
      console.error('Error al obtener panel de notificaciones:', error);
      res.status(500).json({
        error: error.message || 'Error al obtener el panel de notificaciones',
      });
    }
  }

  async obtenerDetalleNotificacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = req.query.usuarioId as string;

      if (!usuarioId) {
        res.status(400).json({ error: 'Se requiere el usuarioId' });
        return;
      }

      const notificacion = await this.notificacionService.obtenerDetalleNotificacion(id, usuarioId);
      res.json(notificacion);
    } catch (error: any) {
      console.error('Error al obtener detalle de notificación:', error);
      res
        .status(error.message.includes('Notificación no encontrada') ? 404 : 500)
        .json({ error: error.message || 'Error al obtener el detalle de la notificación' });
    }
  }

  async marcarComoLeida(req: Request, res: Response): Promise<void> {
    try {
      const { id, usuarioId } = req.params;
      
      if (!usuarioId) {
        res.status(400).json({ error: 'Se requiere el usuarioId' });
        return;
      }
  
      const notificacion = await this.notificacionService.marcarComoLeida(id, usuarioId);
      res.json(notificacion);
    } catch (error: any) {
      console.error('Error al marcar notificación como leída:', error);
      res
        .status(error.message.includes('Notificación no encontrada') ? 404 : 500)
        .json({ error: error.message || 'Error al actualizar la notificación' });
    }
  }
  
  async eliminarNotificacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { usuarioId } = req.body;

      if (!usuarioId) {
        res.status(400).json({ error: 'Se requiere el usuarioId' });
        return;
      }

      const resultado = await this.notificacionService.eliminarNotificacion(id, usuarioId);
      res.json(resultado);
    } catch (error: any) {
      console.error('Error al eliminar notificación:', error);
      res
        .status(error.message.includes('Notificación no encontrada') ? 404 : 500)
        .json({ error: error.message || 'Error al eliminar la notificación' });
    }
  }

  async obtenerConteoNoLeidas(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId } = req.params;
      const resultado = await this.notificacionService.obtenerConteoNoLeidas(usuarioId);
      res.json(resultado);
    } catch (error: any) {
      console.error('Error al obtener conteo de notificaciones:', error);
      res
        .status(500)
        .json({ error: error.message || 'Error al obtener el conteo de notificaciones' });
    }
  }

  async obtenerNotificacionesDropdown(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId } = req.params;
      
      const filtros = {
        usuarioId,
        limit: 4,
        offset: 0,
        orderBy: {
          creadoEn: 'desc'
        }
      };

      const notificaciones = await this.notificacionService.obtenerNotificaciones(filtros);
      const totalNoLeidas = await this.notificacionService.obtenerConteoNoLeidas(usuarioId);
      
      res.json({
        notificaciones: notificaciones.notificaciones,
        totalNoLeidas: totalNoLeidas,
        hayMas: notificaciones.total > 4
      });
    } catch (error: any) {
      console.error('Error al obtener notificaciones para dropdown:', error);
      res.status(500).json({
        error: error.message || 'Error al obtener notificaciones para el dropdown'
      });
    }
  }
}

/**
 * Endpoint para generar notificación de renta finalizada
 */
export async function generarNotificacionRentaConcluida(req: Request, res: Response) {
  const { rentaId } = req.params;
  try {
    const creada = await notificarRentaConcluida(rentaId);

    if (creada) {
      res.json({ message: 'Notificación generada correctamente.' });
    } else {
      res.json({ message: 'La notificación ya existía o la renta aún no ha concluido.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al generar la notificación.' });
  }
}

/**
 * Endpoint para generar notificación de renta Cancelada
 */
export async function generarNotificacionRentaCancelada(req: Request, res: Response) {
  const { rentaId } = req.params;
  try {
    const creada = await notificarRentaCancelada(rentaId);
    
    if (creada) {
      res.json({ message: 'Notificación generada correctamente.' });
    } else {
      res.json({ message: 'La notificación ya existía o la renta aún no ha concluido.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al generar la notificación.' });
  }
}

/**
 * Endpoint para generar notificación de nueva calificación
 */
export async function generarNotificacionNuevaCalificacion(req: Request, res: Response) {
  const { rentaId } = req.params;  // Cambiado de calificacionId a rentaId
  try {
    const creada = await notificarNuevaCalificacion(rentaId);
    
    if (creada) {
      res.json({ message: 'Notificación de calificación generada correctamente.' });
    } else {
      res.json({ message: 'La notificación ya existía o no se encontró la calificación.' });
    }
  } catch (error) {
    console.error('Error al generar notificación de calificación:', error);
    res.status(500).json({ error: 'Error al generar la notificación de calificación.' });
  }
}

/**
 * Endpoint para generar notificación de reserva confirmada
 */
export async function generarNotificacionReservaConfirmada(req: Request, res: Response) {
  const { reservaId } = req.params;
  try {
    const creada = await notificarReservaConfirmada(reservaId);

    if (creada) {
      res.json({ message: 'Notificación generada correctamente.' });
    } else {
      res.json({ message: 'La notificación ya existía o la reserva no está confirmada.' });
    }
  } catch (error) {
    console.error('Error al generar la notificación de reserva confirmada:', error);
    res.status(500).json({ error: 'Error al generar la notificación de reserva confirmada.' });
  }
}

