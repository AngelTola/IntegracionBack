import { Request, Response } from 'express';
import { SSEService } from '../services/sse.service';

export class SSEController {
  private sseService: SSEService;

  constructor(sseService: SSEService) {
    this.sseService = sseService;
  }

  conectar(req: Request, res: Response): void {
    const usuarioId = req.params.usuarioId;
    
    if (!usuarioId) {
      res.status(400).json({ error: 'Se requiere el usuarioId' });
      return;
    }

    this.sseService.conectarCliente(usuarioId, req, res);
  }
}