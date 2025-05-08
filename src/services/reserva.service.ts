//SIMULACION DE LOS SERVICIOS DE RESERVA PARA USO PRACTICO DE LAS NOTIFICACIONES.
import { PrismaClient, EstadoReserva, TipoDeNotificacion } from '@prisma/client';
import { NotificacionService } from './notificacion.service';
import { NotificacionDTO } from '../types/notificacion.types';

const prisma = new PrismaClient();

export class ReservaService {
  private notificacionService: NotificacionService;

  // Constructor para inyectar el servicio de notificaciones
  constructor(notificacionService: NotificacionService) {
    this.notificacionService = notificacionService;
  }

  // Cambiar el estado de una reserva y generar una notificación
  async cambiarEstadoReserva(reservaId: string, nuevoEstado: EstadoReserva) {
    // Obtener la reserva actual
    const reservaExistente = await prisma.reserva.findUnique({
      where: { idReserva: reservaId },
      include: { auto: true },
    });
  
    if (!reservaExistente) {
      throw new Error('Reserva no encontrada');
    }
  
    const estadoAnterior = reservaExistente.estado;
  
    // Verificar si el estado realmente cambió
    if (estadoAnterior === nuevoEstado) {
      return { mensaje: 'El estado no ha cambiado. No se generó notificación.' };
    }
  
    // Actualizar el estado
    const reservaActualizada = await prisma.reserva.update({
      where: { idReserva: reservaId },
      data: { estado: nuevoEstado },
      include: { auto: true }, // Aseguramos que siga teniendo acceso al auto
    });
  
    // Crear la notificación
    const notificacionData: NotificacionDTO = {
      usuarioId: reservaActualizada.auto.propietarioId,
      titulo: 'Reserva Modificada',
      mensaje: `El estado de la reserva para su vehículo ${reservaActualizada.auto.marca} ${reservaActualizada.auto.modelo} 
      con placa ${reservaActualizada.auto.placa} ha cambiado de estado ${estadoAnterior} a este nuevo estado ${nuevoEstado}.`,
      tipo: TipoDeNotificacion.RESERVA_MODIFICADA,
      prioridad: 'MEDIA',
      entidadId: reservaActualizada.idReserva,
      tipoEntidad: 'Reserva',
    };
  
    // Crear la nueva notificación
    await this.notificacionService.crearNotificacion(notificacionData);
  
    return { mensaje: 'Estado actualizado y notificación creada', reserva: reservaActualizada };
  }  
}