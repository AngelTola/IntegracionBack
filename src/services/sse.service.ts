import { Request, Response } from 'express';

export class SSEService {
    private clients: Map<string, Map<string, Response>> = new Map();
    private pingInterval: NodeJS.Timeout;
  
    constructor() {
      console.log('Servicio SSE inicializado');
      // Enviar ping cada 30 segundos para mantener conexiones activas
      this.pingInterval = setInterval(() => this.enviarPing(), 30000);
    }
  
    conectarCliente(usuarioId: string, clientId: string, req: Request, res: Response): void {
        // Configurar encabezados para evitar problemas de conectividad
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Para Nginx
        res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir CORS
        
        // Configurar tiempo de espera del socket a un valor alto
        req.socket.setTimeout(0);
        
        // Enviar evento inicial para confirmar conexión
        res.write(`event: conectado\ndata: {"id":"${clientId}"}\n\n`);
    
        // Guardar la conexión del cliente
        if (!this.clients.has(usuarioId)) {
          this.clients.set(usuarioId, new Map());
        }
        this.clients.get(usuarioId)?.set(clientId, res);
        
        console.log(`Cliente conectado: ${clientId} de usuario ${usuarioId}`);
    
        // Cerrar conexión cuando el cliente se desconecte
        req.on('close', () => {
          this.desconectarCliente(usuarioId, clientId);
        });
        
        req.on('error', () => {
          this.desconectarCliente(usuarioId, clientId);
        });
      }
  
    desconectarCliente(usuarioId: string, clientId: string): void {
      const clientesUsuario = this.clients.get(usuarioId);
      if (clientesUsuario?.has(clientId)) {
        clientesUsuario.delete(clientId);
        console.log(`Cliente desconectado: ${clientId} de usuario ${usuarioId}`);
        
        if (clientesUsuario.size === 0) {
          this.clients.delete(usuarioId);
        }
      }
    }
  
    enviarNotificacion({ evento, data, usuarioId }: { evento: string, data: any, usuarioId: string }): void {
        const clientesUsuario = this.clients.get(usuarioId);
        
        if (!clientesUsuario || clientesUsuario.size === 0) {
          return; 
        }
    
        const mensaje = `event: ${evento}\ndata: ${JSON.stringify(data)}\n\n`;
        
        clientesUsuario.forEach((res, clientId) => {
          try {
            res.write(mensaje);
            // Asegurarse de que los datos se envíen inmediatamente
            if (typeof (res as any).flush === 'function') {
              (res as any).flush();
            }
          } catch (error) {
            console.error(`Error al enviar notificación al cliente ${clientId}: ${error}`);
            this.desconectarCliente(usuarioId, clientId);
          }
        });
      }
  
    // Método para enviar un ping periódico para mantener la conexión viva
    enviarPing(): void {
        let totalClientes = 0;
        
        this.clients.forEach((clientesUsuario, usuarioId) => {
          clientesUsuario.forEach((res, clientId) => {
            try {
              // Usar un comentario como heartbeat
              res.write(':\n\n');
              totalClientes++;
            } catch (error) {
              console.error(`Error al enviar ping al cliente ${clientId}: ${error}`);
              this.desconectarCliente(usuarioId, clientId);
            }
          });
        });
        
        if (totalClientes > 0) {
          console.log(`Ping enviado a ${totalClientes} conexiones activas`);
        }
      }
      
    cleanup(): void {
      clearInterval(this.pingInterval);
    }
}