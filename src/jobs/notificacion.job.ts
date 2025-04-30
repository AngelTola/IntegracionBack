import prisma from '../config/database';
import {
  notificarRentaConcluida,
  notificarRentaCancelada,
  NotificacionService,
} from '../services/notificacion.service';
import { SSEService } from '../services/sse.service';

export class NotificacionJob {
  private static ejecucionFinalizadas = false;
  private static ejecucionCanceladas = false;
  private static interval: NodeJS.Timeout;

  // Instancia única del servicio de notificaciones
  private static notificacionService = new NotificacionService();

  /** Revisa rentas finalizadas y crea notificaciones */
  private static async revisarRentasFinalizadas() {
    if (NotificacionJob.ejecucionFinalizadas) {
      console.log('Rentas Finalizadas: ejecución en curso, se omite esta ronda.');
      return;
    }
    NotificacionJob.ejecucionFinalizadas = true;

    try {
      const rentasFinalizadas = await prisma.renta.findMany({
        where: {
          estatus: 'FINALIZADA',
          fechaFin: { lt: new Date() },
        },
        include: {
          cliente: {
            include: {
              notificaciones: {
                where: {
                  tipo: 'ALQUILER_FINALIZADO',
                  leido: false,
                },
              },
            },
          },
        },
      });

      const sinNotificar = rentasFinalizadas.filter(
        (r) => r.cliente.notificaciones.length === 0
      );

      for (const renta of sinNotificar) {
        await notificarRentaConcluida(renta.id);
      }
    } catch (error) {
      console.error('Error revisando rentas finalizadas:', error);
    } finally {
      NotificacionJob.ejecucionFinalizadas = false;
    }
  }

  /** Revisa rentas canceladas y crea notificaciones */
  private static async revisarRentasCanceladas() {
    if (NotificacionJob.ejecucionCanceladas) {
      console.log('Rentas Canceladas: ejecución en curso, se omite esta ronda.');
      return;
    }
    NotificacionJob.ejecucionCanceladas = true;

    try {
      const rentasCanceladas = await prisma.renta.findMany({
        where: { estatus: 'CANCELADA' },
        include: {
          cliente: {
            include: {
              notificaciones: {
                where: {
                  tipo: 'RESERVA_CANCELADA',
                  leido: false,
                },
              },
            },
          },
        },
      });

      const sinNotificar = rentasCanceladas.filter(
        (r) => r.cliente.notificaciones.length === 0
      );

      for (const renta of sinNotificar) {
        await notificarRentaCancelada(renta.id);
      }
    } catch (error) {
      console.error('Error revisando rentas canceladas:', error);
    } finally {
      NotificacionJob.ejecucionCanceladas = false;
    }
  }

  /** Inicia el cron job que periódicamente revisa ambas listas */
  public static iniciar() {
    this.interval = setInterval(() => {
      NotificacionJob.revisarRentasFinalizadas();
      NotificacionJob.revisarRentasCanceladas();
    }, 2000); // cada 2 segundos
  }

  /** Detiene el cron job */
  public static detener() {
    clearInterval(this.interval);
    console.log('El cron job ha sido detenido.');
  }
}
