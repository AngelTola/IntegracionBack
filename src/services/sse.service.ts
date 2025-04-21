import { Request, Response } from 'express';

export class SSEService {
    private clients: Map<string, Map<string, Response>> = new Map();
  
    constructor() {
      console.log('Servicio SSE inicializado');
    }
  
    conectarCliente(usuarioId: string, clientId: string, req: Request, res: Response): void {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Escribir un comentario inicial para mantener la conexión
        res.write(':\n\n');
    
        // Guardar la conexión del cliente
        if (!this.clients.has(usuarioId)) {
          this.clients.set(usuarioId, new Map());
        }
        this.clients.get(usuarioId)?.set(clientId, res);
    
        // Cerrar conexión cuando el cliente se desconecte
        req.on('close', () => {
          this.desconectarCliente(usuarioId, clientId);
        });
      }
  
    desconectarCliente(usuarioId: string, clientId: string): void {
      this.clients.get(usuarioId)?.delete(clientId);
      if (this.clients.get(usuarioId)?.size === 0) {
        this.clients.delete(usuarioId);
      }
      console.log(`Cliente desconectado: ${clientId} de usuario ${usuarioId}`);
    }
  
    enviarNotificacion({ evento, data, usuarioId }: { evento: string, data: any, usuarioId: string }): void {
        const clientesUsuario = this.clients.get(usuarioId);
        
        if (!clientesUsuario || clientesUsuario.size === 0) {
          return; 
        }
    
        const mensaje = `event: ${evento}\ndata: ${JSON.stringify(data)}\n\n`;
        
        clientesUsuario.forEach((res) => {
          try {
            res.write(mensaje);
          } catch (error) {
            console.error(`Error al enviar notificación al cliente: ${error}`);
          }
        });
      }
  
    // Método para enviar un ping periódico para mantener la conexión viva
    enviarPing(): void {
        this.clients.forEach((clientesUsuario, usuarioId) => {
          clientesUsuario.forEach((res, clientId) => {
            try {
              res.write(':\n\n'); // Comentario para mantener viva la conexión
            } catch (error) {
              this.desconectarCliente(usuarioId, clientId);
            }
          });
        });
      }
    }
    