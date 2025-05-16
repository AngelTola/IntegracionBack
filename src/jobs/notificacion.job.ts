import prisma from '../config/database';
import {
  notificarRentaConcluida,
  notificarRentaCancelada,
  notificarReservaConfirmada,
  NotificacionService
} from '../services/notificacion.service';
import { SSEService } from '../services/sse.service';

export class NotificacionJob {
  private static ejecucionFinalizadas = false;
  private static ejecucionCanceladas = false;
  private static ejecucionConfirmadas = false;
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

  /** Revisa reservas confirmadas y crea notificaciones */
  private static async revisarReservasConfirmadas() {
    if (NotificacionJob.ejecucionConfirmadas) {
      console.log('Reservas Confirmadas: ejecución en curso, se omite esta ronda.');
      return;
    }
    NotificacionJob.ejecucionConfirmadas = true;

    try {
      // Obtener la fecha de hace 24 horas
      const fechaLimite = new Date();
      fechaLimite.setHours(fechaLimite.getHours() - 24);

      const reservasConfirmadas = await prisma.reserva.findMany({
        where: {
          estado: 'CONFIRMADA',
          fechaSolicitud: {
            gte: fechaLimite // Solo reservas confirmadas en las últimas 24 horas
          }
        },
        include: {
          cliente: {
            include: {
              notificaciones: {
                where: {
                  tipo: 'RESERVA_CONFIRMADA',
                  entidadId: undefined,
                },
              },
            },
          },
        },
      });

      // Filtrar las reservas que nunca han tenido una notificación de confirmación
      const sinNotificar = reservasConfirmadas.filter(
        (r) => r.cliente.notificaciones.length === 0
      );

      // Crear la notificación para las reservas no notificadas
      for (const reserva of sinNotificar) {
        await notificarReservaConfirmada(reserva.idReserva);
      }
    } catch (error) {
      console.error('Error revisando reservas confirmadas:', error);
    } finally {
      NotificacionJob.ejecucionConfirmadas = false;
    }
  }

  /** Inicia el cron job que periódicamente revisa ambas listas */
  public static iniciar() {
    this.interval = setInterval(() => {
      NotificacionJob.revisarRentasFinalizadas();
      NotificacionJob.revisarRentasCanceladas();
      NotificacionJob.revisarReservasConfirmadas();
    }, 2000); // cada 2 segundos
  }

  /** Detiene el cron job */
  public static detener() {
    clearInterval(this.interval);
    console.log('El cron job ha sido detenido.');
  }
}
