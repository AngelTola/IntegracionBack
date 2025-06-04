import { Request, Response } from 'express';
import { NotificacionService } from '../../services/notificaciones/notificacion.service';
import { PrioridadNotificacion } from '@prisma/client';
import { RequestUtils } from '../../utils/notificaciones/request.noti.utils';

export class NotificacionController {
  private notificacionService: NotificacionService;

  constructor(notificacionService: NotificacionService) {
    this.notificacionService = notificacionService;
  }

  async obtenerPanelNotificaciones(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId, error } = RequestUtils.extractAndValidateUsuarioId(req, 'params');
      
      if (error) {
        res.status(400).json({ error });
        return;
      }

      const { tipo, prioridad, tipoEntidad, limit, offset } = req.query;

      const filtros: any = { idUsuario: usuarioId };

      const tipoStr = RequestUtils.parseToString(tipo);
      const prioridadStr = RequestUtils.parseToString(prioridad);
      const tipoEntidadStr = RequestUtils.parseToString(tipoEntidad);
      const limitNum = RequestUtils.parseToNumber(limit);
      const offsetNum = RequestUtils.parseToNumber(offset);

      if (tipoStr) filtros.tipo = tipoStr;
      if (prioridadStr) filtros.prioridad = prioridadStr as PrioridadNotificacion;
      if (tipoEntidadStr) filtros.tipoEntidad = tipoEntidadStr;
      if (limitNum !== null) filtros.limit = limitNum;
      if (offsetNum !== null) filtros.offset = offsetNum;

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
      const { usuarioId, error } = RequestUtils.extractAndValidateUsuarioId(req, 'params'); // ✅ CORREGIDO

      if (error) {
        res.status(400).json({ error });
        return;
      }

      const notificacion = await this.notificacionService.obtenerDetalleNotificacion(id, usuarioId!);
      res.json(notificacion);
    } catch (error: any) {
      console.error('Error al obtener detalle de notificación:', error);
      const statusCode = error.message.includes('Notificación no encontrada') ? 404 :
                        error.message.includes('No tienes permiso') ? 403 : 500;
      res.status(statusCode).json({ 
        error: error.message || 'Error al obtener el detalle de la notificación' 
      });
    }
  }

  async marcarComoLeida(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { usuarioId, error } = RequestUtils.extractAndValidateUsuarioId(req, 'params');
      
      if (error) {
        res.status(400).json({ error });
        return;
      }
  
      const notificacion = await this.notificacionService.marcarComoLeida(id, usuarioId!);
      res.json(notificacion);
    } catch (error: any) {
      console.error('Error al marcar notificación como leída:', error);
      const statusCode = error.message.includes('Notificación no encontrada') ? 404 :
                        error.message.includes('No tienes permiso') ? 403 : 500;
      res.status(statusCode).json({ 
        error: error.message || 'Error al actualizar la notificación' 
      });
    }
  }
  
  async eliminarNotificacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { usuarioId, error } = RequestUtils.extractAndValidateUsuarioId(req, 'params'); // ✅ CORREGIDO

      if (error) {
        res.status(400).json({ error });
        return;
      }

      const resultado = await this.notificacionService.eliminarNotificacion(id, usuarioId!);
      res.json(resultado);
    } catch (error: any) {
      console.error('Error al eliminar notificación:', error);
      const statusCode = error.message.includes('Notificación no encontrada') ? 404 :
                        error.message.includes('No tienes permiso') ? 403 : 500;
      res.status(statusCode).json({ 
        error: error.message || 'Error al eliminar la notificación' 
      });
    }
  }

  async obtenerConteoNoLeidas(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId, error } = RequestUtils.extractAndValidateUsuarioId(req, 'params');
      
      if (error) {
        res.status(400).json({ error });
        return;
      }

      const resultado = await this.notificacionService.obtenerConteoNoLeidas(usuarioId!);
      res.json(resultado);
    } catch (error: any) {
      console.error('Error al obtener conteo de notificaciones:', error);
      res.status(500).json({ 
        error: error.message || 'Error al obtener el conteo de notificaciones' 
      });
    }
  }

  async obtenerNotificacionesDropdown(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId, error } = RequestUtils.extractAndValidateUsuarioId(req, 'params');
      
      if (error) {
        res.status(400).json({ error });
        return;
      }
      
      const filtros = {
        idUsuario: usuarioId!, 
        limit: 4,
        offset: 0
      };

      const notificaciones = await this.notificacionService.obtenerNotificaciones(filtros);
      const totalNoLeidas = await this.notificacionService.obtenerConteoNoLeidas(usuarioId!);
      
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