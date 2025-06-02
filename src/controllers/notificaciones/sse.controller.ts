import { Request, Response } from 'express';
import { SSEService } from '../../services/notificaciones/sse.service';
import { RequestUtils } from '../../utils/notificaciones/request.noti.utils';

export class SSEController {
  private sseService: SSEService;

  constructor(sseService?: SSEService) {
    this.sseService = sseService || SSEService.getInstance();
  }

  conectar = (req: Request, res: Response): void => {
    try {
      const { usuarioId, error } = RequestUtils.extractAndValidateUsuarioId(req, 'params');
      
      if (error) {
        res.status(400).json({ error });
        return;
      }

      if (!usuarioId) {
        res.status(400).json({ error: 'ID de usuario requerido' });
        return;
      }

      console.log(`Iniciando conexión SSE para usuario ${usuarioId}`);
      this.sseService.conectarCliente(usuarioId, req, res);
      
    } catch (error) {
      console.error('Error al conectar cliente SSE:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  obtenerEstadisticas = (req: Request, res: Response): void => {
    try {
      const estadisticas = {
        clientesConectados: this.sseService.listarClientesConectados(),
        timestamp: new Date().toISOString()
      };
      
      res.json(estadisticas);
    } catch (error) {
      console.error('Error al obtener estadísticas SSE:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  desconectarCliente = (req: Request, res: Response): void => {
    try {
      const { usuarioId, error } = RequestUtils.extractAndValidateUsuarioId(req, 'params');
      
      if (error) {
        res.status(400).json({ error });
        return;
      }

      if (!usuarioId) {
        res.status(400).json({ error: 'ID de usuario requerido' });
        return;
      }

      this.sseService.desconectarCliente(usuarioId);
      res.json({ mensaje: `Usuario ${usuarioId} desconectado exitosamente` });
      
    } catch (error) {
      console.error('Error al desconectar cliente:', error);
      res.status(500).json({ error: 'Error al desconectar cliente' });
    }
  }
}