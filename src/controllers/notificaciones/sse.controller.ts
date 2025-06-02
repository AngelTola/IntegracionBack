import { Request, Response } from 'express';
import { SSEService } from '../../services/notificaciones/sse.service';
import { JWTUtils } from '../../utils/notificaciones/jwt.utils';

export class SSEController {
  private sseService: SSEService;

  constructor(sseService?: SSEService) {
    this.sseService = sseService || SSEService.getInstance();
  }

  conectar = (req: Request, res: Response): void => {
    try {
      // CAMBIO PRINCIPAL: Extraer idUsuario del JWT
      const { idUsuario, userInfo, error } = JWTUtils.extractAndValidateUser(req);
      
      if (error) {
        res.status(401).json({ error });
        return;
      }

      if (!idUsuario || !userInfo) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      console.log(`Iniciando conexión SSE para usuario autenticado: ${userInfo.nombreCompleto} (ID: ${idUsuario})`);
      
      // Usar idUsuario del JWT (garantizado como válido)
      this.sseService.conectarCliente(idUsuario, req, res);
      
    } catch (error) {
      console.error('Error al conectar cliente SSE:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  obtenerEstadisticas = (req: Request, res: Response): void => {
    try {
      // También proteger estadísticas con JWT
      const { idUsuario, userInfo, error } = JWTUtils.extractAndValidateUser(req);
      
      if (error) {
        res.status(401).json({ error });
        return;
      }

      const estadisticas = {
        clientesConectados: this.sseService.listarClientesConectados(),
        timestamp: new Date().toISOString(),
        usuarioActual: {
          id: idUsuario,
          nombre: userInfo?.nombreCompleto,
          email: userInfo?.email
        }
      };
      
      res.json(estadisticas);
    } catch (error) {
      console.error('Error al obtener estadísticas SSE:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  desconectarCliente = (req: Request, res: Response): void => {
    try {
      // Solo puede desconectarse a sí mismo (basado en JWT)
      const { idUsuario, userInfo, error } = JWTUtils.extractAndValidateUser(req);
      
      if (error) {
        res.status(401).json({ error });
        return;
      }

      if (!idUsuario) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      this.sseService.desconectarCliente(idUsuario);
      res.json({ 
        mensaje: `Usuario ${userInfo?.nombreCompleto} (${idUsuario}) desconectado exitosamente` 
      });
      
    } catch (error) {
      console.error('Error al desconectar cliente:', error);
      res.status(500).json({ error: 'Error al desconectar cliente' });
    }
  }
}