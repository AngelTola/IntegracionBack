// services/Notificacion.job.ts
import cron from 'node-cron';
import prisma from '../config/database';
import { notificarRentaConcluida } from '../services/notificacion.service';

export class NotificacionJob {

    private static ejecucionEnCurso = false;

    private static async revisarRentasFinalizadas() {
        if (NotificacionJob.ejecucionEnCurso) {
            console.log('El cron job ya está en ejecución, se omite esta ronda.');
            return;
        }

        try {
            NotificacionJob.ejecucionEnCurso = true;

            // Buscar todas las rentas finalizadas
            const rentasFinalizadas = await prisma.renta.findMany({
                where: {
                    estatus: 'FINALIZADA',
                    fechaFin: { lt: new Date() }
                },
                include: {
                    cliente: {
                        include: {
                            notificaciones: {
                                where: {
                                    tipo: 'ALQUILER_FINALIZADO',
                                    leido: false
                                }
                            }
                        }
                    }
                }
            });

            const rentasSinNotificacion = rentasFinalizadas.filter(renta => renta.cliente.notificaciones.length === 0);

            for (const renta of rentasSinNotificacion) {
                await notificarRentaConcluida(renta.id);
            }
        } catch (error) {
            console.error('Error revisando rentas finalizadas:', error);
        } finally {
            NotificacionJob.ejecucionEnCurso = false;
        }
    }

    public static iniciar() {
        cron.schedule('*/2 * * * *', NotificacionJob.revisarRentasFinalizadas);
    }
}
