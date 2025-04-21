import { Request, Response } from 'express';
import { SSEService } from '../services/sse.service';
import { v4 as uuidv4 } from 'uuid'; 

export class SSEController {
  private sseService: SSEService;

  constructor(sseService: SSEService) {
    this.sseService = sseService;
  }

  conectar(req: Request, res: Response): void {
    const { usuarioId } = req.params;
    
    if (!usuarioId) {
      res.status(400).json({ error: 'Se requiere el usuarioId' });
      return;
    }

    const clientId = uuidv4();

    this.sseService.conectarCliente(usuarioId, clientId, req, res);
  }
}