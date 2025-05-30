import prisma from '../config/database';
import { NotificacionDTO, NotificacionFiltro } from '../types/notificacion.types';
import { PrioridadNotificacion } from '@prisma/client';
import { SSEService } from './sse.service';

export class NotificacionService {
    private sseService: SSEService;

    constructor() {
        this.sseService = SSEService.getInstance();
    }

    async crearNotificacion(notificacionData: NotificacionDTO) {
        try {
            const data = {
                ...notificacionData,
                prioridad: notificacionData.prioridad || PrioridadNotificacion.MEDIA,
            };
    
            const nuevaNotificacion = await prisma.notificacion.create({
                data
            });
    
            try {
                await this.sseService.enviarNotificacion({
                    evento: 'NUEVA_NOTIFICACION',
                    data: nuevaNotificacion,
                    usuarioId: notificacionData.usuarioId
                });
            } catch (sseError) {
                console.error('Error al enviar notificación via SSE:', sseError);
            }
    
            return nuevaNotificacion;
        } catch (error) {
            console.error('Error al crear notificación:', error);
            throw new Error('No se pudo crear la notificación');
        }
    }    

    async obtenerNotificaciones(filtros: NotificacionFiltro) {
        try {
          const where: any = {
            haSidoBorrada: false 
          };
      
          if (filtros.usuarioId)   where.usuarioId   = filtros.usuarioId;
          if (filtros.tipo)        where.tipo        = filtros.tipo;
          if (filtros.leido !== undefined) where.leido = filtros.leido;
          if (filtros.prioridad)   where.prioridad   = filtros.prioridad;
          if (filtros.tipoEntidad) where.tipoEntidad = filtros.tipoEntidad;
      
          if (filtros.desde || filtros.hasta) {
            where.creadoEn = {};
            if (filtros.desde) where.creadoEn.gte = filtros.desde;
            if (filtros.hasta) where.creadoEn.lte = filtros.hasta;
          }
      
          const take = filtros.limit  || 10;
          const skip = filtros.offset || 0;
      
          // 1) Traemos las notificaciones “planas”
          const [rawNotificaciones, total] = await Promise.all([
            prisma.notificacion.findMany({
              where,
              orderBy: { creadoEn: 'desc' },
              take,
              skip,
            }),
            prisma.notificacion.count({ where })
          ]);
      
          // 2) Por cada notificación, chequeamos entidadId + tipoEntidad
          //    y vamos a la tabla correspondiente para obtener imagenAuto
          const notificacionesConImagen = await Promise.all(
            rawNotificaciones.map(async (n) => {
              let imagenAuto: string | null = null;
              const idEnt = n.entidadId;
              const tipoEnt = n.tipoEntidad?.toLowerCase();
      
              if (idEnt && tipoEnt) {
                switch (tipoEnt) {
                  case 'renta': {
                    // renta → reserva → auto → imágenes
                    const renta = await prisma.renta.findUnique({
                      where: { id: idEnt },
                      include: {
                        reserva: {
                          include: {
                            auto: { select: { imagenes: true } }
                          }
                        }
                      }
                    });
                    imagenAuto = renta?.reserva?.auto?.imagenes ?? null;
                    break;
                  }
                  case 'reserva': {
                    // reserva → auto → imágenes
                    const reserva = await prisma.reserva.findUnique({
                      where: { idReserva: idEnt },
                      include: { auto: { select: { imagenes: true } } }
                    });
                    imagenAuto = reserva?.auto?.imagenes ?? null;
                    break;
                  }
                  case 'calificacion': {
                    // calificacion → renta → reserva → auto → imágenes
                    const calif = await prisma.calificacion.findUnique({
                      where: { id: idEnt },
                      include: {
                        renta: {
                          include: {
                            reserva: {
                              include: {
                                auto: { select: { imagenes: true } }
                              }
                            }
                          }
                        }
                      }
                    });
                    imagenAuto = calif?.renta?.reserva?.auto?.imagenes ?? null;
                    break;
                  }
                  default:
                    imagenAuto = null;
                }
              }
      
              return {
                ...n,
                imagenAuto
              };
            })
          );
      
          return {
            notificaciones: notificacionesConImagen,
            total,
            page:  Math.floor(skip / take) + 1,
            limit: take
          };
        } catch (error) {
          console.error('Error al obtener notificaciones:', error);
          throw new Error('No se pudieron obtener las notificaciones');
        }
    }         

    async obtenerDetalleNotificacion(id: string, usuarioId: string) {
        try {
            const notificacion = await prisma.notificacion.findUnique({
                where: { id },
            });
    
            if (!notificacion) {
                throw new Error('Notificación no encontrada');
            }
    
            if (notificacion.usuarioId !== usuarioId) {
                throw new Error('No tienes permiso para ver esta notificación');
            }
            
            if (notificacion.haSidoBorrada) {
                throw new Error('Esta notificación ha sido eliminada');
            }
    
            // Ahora, obtener la imagen del auto asociada a esta notificación
            let imagenAuto: string | null = null;
            const idEnt = notificacion.entidadId;
            const tipoEnt = notificacion.tipoEntidad?.toLowerCase();
    
            if (idEnt && tipoEnt) {
                switch (tipoEnt) {
                    case 'renta': {
                        // renta → reserva → auto → imágenes
                        const renta = await prisma.renta.findUnique({
                            where: { id: idEnt },
                            include: {
                                reserva: {
                                    include: {
                                        auto: { select: { imagenes: true } },
                                    },
                                },
                            },
                        });
                        imagenAuto = renta?.reserva?.auto?.imagenes ?? null;
                        break;
                    }
                    case 'reserva': {
                        // reserva → auto → imágenes
                        const reserva = await prisma.reserva.findUnique({
                            where: { idReserva: idEnt },
                            include: { auto: { select: { imagenes: true } } },
                        });
                        imagenAuto = reserva?.auto?.imagenes ?? null;
                        break;
                    }
                    case 'calificacion': {
                        // calificacion → renta → reserva → auto → imágenes
                        const calif = await prisma.calificacion.findUnique({
                            where: { id: idEnt },
                            include: {
                                renta: {
                                    include: {
                                        reserva: {
                                            include: {
                                                auto: { select: { imagenes: true } },
                                            },
                                        },
                                    },
                                },
                            },
                        });
                        imagenAuto = calif?.renta?.reserva?.auto?.imagenes ?? null;
                        break;
                    }
                    default:
                        imagenAuto = null;
                }
            }
    
            // Retorna la notificación con la imagen del auto
            return {
                ...notificacion,
                imagenAuto,
            };
        } catch (error) {
            console.error('Error al obtener detalle de notificación:', error);
            throw error;
        }
    }    

    async marcarComoLeida(id: string, usuarioId: string) {
        try {
            const notificacion = await prisma.notificacion.findUnique({
                where: { id }
            });

            if (!notificacion) {
                throw new Error('Notificación no encontrada');
            }

            if (notificacion.usuarioId !== usuarioId) {
                throw new Error('No tienes permiso para actualizar esta notificación');
            }
            
            if (notificacion.haSidoBorrada) {
                throw new Error('Esta notificación ha sido eliminada');
            }

            const actualizada = await prisma.notificacion.update({
                where: { id },
                data: {
                    leido: true,
                    leidoEn: new Date()
                }
            });

            this.sseService.enviarNotificacion({
                evento: 'NOTIFICACION_LEIDA',
                data: actualizada,
                usuarioId
            });

            return actualizada;
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            throw new Error('No se pudo actualizar la notificación');
        }
    }

    async eliminarNotificacion(id: string, usuarioId: string) {
        try {
            const notificacion = await prisma.notificacion.findUnique({
                where: { id }
            });

            if (!notificacion) {
                throw new Error('Notificación no encontrada');
            }

            if (notificacion.usuarioId !== usuarioId) {
                throw new Error('No tienes permiso para eliminar esta notificación');
            }
            
            // Usando soft delete en lugar de borrar físicamente
            const eliminada = await prisma.notificacion.update({
                where: { id },
                data: { 
                    haSidoBorrada: true
                }
            });

            this.sseService.enviarNotificacion({
                evento: 'NOTIFICACION_ELIMINADA',
                data: { id },
                usuarioId
            });

            return { id, eliminada: true };
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
            throw error;
        }
    }

    async obtenerConteoNoLeidas(usuarioId: string) {
        try {
            const count = await prisma.notificacion.count({
                where: {
                    usuarioId,
                    leido: false,
                    haSidoBorrada: false 
                }
            });

            return { count, totalNoLeidas: count };
        } catch (error) {
            console.error('Error al obtener conteo de notificaciones:', error);
            throw new Error('No se pudo obtener el conteo de notificaciones');
        }
    }

    async notificarDepositoGarantia(reservaId: string): Promise<boolean> {
        try {
            const reserva = await prisma.reserva.findUnique({
                where: { idReserva: reservaId },
                include: { cliente: true, auto: true }
            });

            if (!reserva) {
                console.error(`La reserva ${reservaId} no existe.`);
                return false;
            }

            // Verifica si ya existe una notificación para este depósito de garantía
            const notificacionExistente = await prisma.notificacion.findFirst({
                where: {
                    usuarioId: reserva.idCliente,
                    entidadId: reserva.idReserva,
                    tipo: 'DEPOSITO_CONFIRMADO', //cambiar
                    haSidoBorrada: false
                }
            });

            if (notificacionExistente) return false;

            let mensaje = `El depósito al vehículo ${reserva.auto.modelo} ${reserva.auto.marca} con placa ${reserva.auto.placa} se ha realizado con exito.\nAtte: REDIBO`;

            await this.crearNotificacion({
                usuarioId: reserva.idCliente,
                titulo: 'Depósito exitoso',
                mensaje,
                tipo: 'DEPOSITO_CONFIRMADO',
                prioridad: 'ALTA',
                entidadId: reserva.idReserva,
                tipoEntidad: 'Reserva',
            });

            return true;
        } catch (error) {
            console.error('Error al notificar depósito de garantía:', error);
            return false;
        }
    }

    async notificarDepositoGarantiaPropietario(reservaId: string): Promise<boolean> {
        try{
            const reserva = await prisma.reserva.findUnique({
                where: {idReserva: reservaId},
                include: {
                    auto: {
                        include: {
                            propietario: true
                        }
                    },
                    cliente: true
                }
            });

            if(!reserva || !reserva.auto?.propietario){
                console.error(`La reserva ${reservaId} o el propietario no existen.`);
                return false;
            }

            const notificacionExistente = await prisma.notificacion.findFirst({
                where: {
                    usuarioId: reserva.auto.propietario.id,
                    entidadId: reserva.idReserva,
                    tipo: "DEPOSITO_CONFIRMADO",
                    haSidoBorrada: false
                }
            });

            if(notificacionExistente) return false;

            const mensaje = `El usuario ${reserva.cliente.nombre} ${reserva.cliente.apellido} ha realizado el deposito para la reserva del vehiculo ${reserva.auto.modelo} ${reserva.auto.marca} con placa ${reserva.auto.placa}. \nAtte: REDIBO.`;
            await this.crearNotificacion({
                usuarioId: reserva.auto.propietario.id,
                titulo: 'Depósito Recibido',
                mensaje,
                tipo: 'DEPOSITO_CONFIRMADO',
                prioridad: 'ALTA',
                entidadId: reserva.idReserva,
                tipoEntidad: 'Reserva',

            });

            return true;
        } catch(error){
            console.error('Error al notificar el deposito de la garantia al propietario: ', error);
            return false;
        }
    }
}

export async function obtenerNoLeidas(userId: string) {
    return prisma.notificacion.findMany({
      where: {
        usuarioId: userId,
        leido: false,
        haSidoBorrada: false 
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });
}

/**
 * Genera una notificación cuando una renta ha concluido.
 * @param rentaId ID de la renta finalizada
 */
export async function notificarRentaConcluida(rentaId: string): Promise<boolean> {
    const notificacionService = new NotificacionService();
    
    const renta = await prisma.renta.findUnique({
      where: { id: rentaId },
      include: {
        auto: true,
        cliente: true,
      },
    });
  
    if (renta && renta.fechaFin < new Date()) {
      const notificacionExistente = await prisma.notificacion.findFirst({
        where: {
          usuarioId: renta.cliente.id,
          entidadId: renta.id,
          tipo: 'ALQUILER_FINALIZADO',
          haSidoBorrada: false
        },
      });
  
      if (notificacionExistente) {
        return false;
      }
  
      const mensaje = `Se le informa que su renta del vehículo ${renta.auto.modelo} del modelo ${renta.auto.marca} y con placa ${renta.auto.placa} ha concluido, muchas gracias por usar nuestro servicio de renta\natte: REDIBO`;
  
      await notificacionService.crearNotificacion({
        usuarioId: renta.cliente.id,
        titulo: 'Tiempo de Renta Concluido',
        mensaje,
        tipo: 'ALQUILER_FINALIZADO',
        prioridad: 'MEDIA',
        entidadId: renta.id,
        tipoEntidad: 'Renta',
      });
      
      return true;
    } else {
      return false;
    }
}

/**
 * Genera una notificación cuando una renta es cancelada.
 * @param rentaId ID de la renta cancelada
 */
export async function notificarRentaCancelada(rentaId: string): Promise<boolean> {
    const notificacionService = new NotificacionService();
  
    try {
        const renta = await prisma.renta.findUnique({
            where: { id: rentaId },
            include: {
                auto: {
                    include: {
                        propietario: true,
                    },
                },
                cliente: true,
            },
        });
    
        if (!renta) {
            console.error(`La renta ${rentaId} no existe.`);
            return false;
        }
    
        const propietario = renta.auto.propietario;
        if (!propietario) {
            console.error(`El vehículo ${renta.auto.id} no tiene propietario asignado.`);
            return false;
        }
    
        const notificacionExistente = await prisma.notificacion.findFirst({
            where: {
                usuarioId: propietario.id,
                entidadId: renta.id,
                tipo: 'RESERVA_CANCELADA',
                haSidoBorrada: false
            },
        });

        if (notificacionExistente) {
            return false;
        }
    
        const mensaje = 
            `Se le informa que la renta del vehículo ${renta.auto.modelo} ` +
            `(${renta.auto.marca}, placa ${renta.auto.placa}) ha sido cancelada.\n` +
            `Atte: REDIBO`;
    
        const notificacion = await notificacionService.crearNotificacion({
            usuarioId: propietario.id,
            titulo: 'Renta Cancelada',
            mensaje,
            tipo: 'RESERVA_CANCELADA',
            prioridad: 'ALTA',
            entidadId: renta.id,
            tipoEntidad: 'Renta',
        });

        console.log(`Notificación creada exitosamente para el usuario ${propietario.id}`);
        return true;
    } catch (error) {
        console.error('Error al notificar renta cancelada:', error);
        return false;
    }
}

/**
 * Genera una notificación cuando un vehículo recibe una calificación o comentario.
 * @param calificacionId ID de la calificación realizada
 */
export async function notificarNuevaCalificacion(rentaId: string): Promise<boolean> {
    const notificacionService = new NotificacionService();
  
    try {
        // Obtener la calificación por rentaId en lugar de id
        const calificacion = await prisma.calificacion.findUnique({
            where: { rentaId: rentaId },
            include: {
                renta: {
                    include: {
                        auto: {
                            include: {
                                propietario: true
                            }
                        },
                        cliente: true
                    }
                }
            }
        });
    
        if (!calificacion) {
            console.error(`No existe calificación para la renta ${rentaId}.`);
            return false;
        }
    
        const propietario = calificacion.renta.auto.propietario;
        if (!propietario) {
            console.error(`El vehículo ${calificacion.renta.auto.id} no tiene propietario asignado.`);
            return false;
        }

        console.log(`Enviando notificación de nueva calificación al propietario: ${propietario.id}`);
    
        // Verificar si ya existe una notificación para esta calificación
        const notificacionExistente = await prisma.notificacion.findFirst({
            where: {
                usuarioId: propietario.id,
                entidadId: calificacion.id, // Usamos el id de la calificación
                tipo: 'VEHICULO_CALIFICADO',
                haSidoBorrada: false
            },
        });

        if (notificacionExistente) {
            console.log(`Ya existe una notificación para la calificación ${calificacion.id}`);
            return false;
        }
    
        // Crear el mensaje de la notificación
        let mensaje = `Su vehículo ${calificacion.renta.auto.modelo} ` +
            `(${calificacion.renta.auto.marca}, placa ${calificacion.renta.auto.placa}) ha recibido ` +
            `una calificación de ${calificacion.puntuacion} estrellas`;
        
        if (calificacion.comentario) {
            mensaje += ` con el siguiente comentario: "${calificacion.comentario}"\n`;
        } else {
            mensaje += ".\n";
        }
        
        mensaje += `Calificado por: ${calificacion.renta.cliente.nombre} ${calificacion.renta.cliente.apellido}\n` +
            `Atte: REDIBO`;
    
        // Crear la notificación
        const notificacion = await notificacionService.crearNotificacion({
            usuarioId: propietario.id,
            titulo: 'Calificación Recibida',
            mensaje,
            tipo: 'VEHICULO_CALIFICADO',
            prioridad: 'MEDIA',
            entidadId: calificacion.id, // Usamos el id de la calificación
            tipoEntidad: 'Calificacion',
        });

        console.log(`Notificación de calificación creada exitosamente para el usuario ${propietario.id}`);
        return true;
    } catch (error) {
        console.error('Error al notificar nueva calificación:', error);
        return false;
    }
}

/**
 * Genera una notificación cuando una reserva ha sido confirmada (parcial o totalmente).
 * @param reservaId ID de la reserva confirmada
 */
export async function notificarReservaConfirmada(reservaId: string): Promise<boolean> {
    const notificacionService = new NotificacionService();

    try {
        const reserva = await prisma.reserva.findUnique({
            where: { idReserva: reservaId },
            include: { cliente: true, auto: true }
        });

        if (!reserva || reserva.estado !== 'CONFIRMADA') {
            return false;
        }

        const notificacionExistente = await prisma.notificacion.findFirst({
            where: {
                usuarioId: reserva.idCliente,
                entidadId: reserva.idReserva,
                tipo: 'RESERVA_CONFIRMADA',
                haSidoBorrada: false
            }
        });

        if (notificacionExistente) return false;

        const montoPagado = reserva.montoPagado.equals(reserva.montoTotal) ? "100%" : `50% (${reserva.montoPagado})`;
        let mensaje = `Su reserva del vehículo ${reserva.auto.modelo} ${reserva.auto.marca} (placa ${reserva.auto.placa}) ha sido confirmada con un pago del ${montoPagado}.`;
        
        if (!reserva.estaPagada && reserva.fechaLimitePago) {
            const fechaLimite = new Date(reserva.fechaLimitePago).toLocaleDateString('es-ES');
            mensaje += ` Complete el pago de ${reserva.montoTotal.sub(reserva.montoPagado)} antes del <strong>${fechaLimite}</strong>.`;
        }
        
        mensaje += `\nAtte: REDIBO`;

        await notificacionService.crearNotificacion({
            usuarioId: reserva.idCliente,
            titulo: 'Reserva Confirmada',
            mensaje,
            tipo: 'RESERVA_CONFIRMADA',
            prioridad: 'ALTA',
            entidadId: reserva.idReserva,
            tipoEntidad: 'Reserva',
        });

        return true;
    } catch (error) {
        console.error('Error al notificar reserva confirmada:', error);
        return false;
    }
}

/**
 * Notifica al cliente cuando su reserva es cancelada por falta de pago restante.
 * @param reservaId ID de la reserva cancelada
 */
export async function notificarReservaCancelada(reservaId: string): Promise<boolean> {
    const notificacionService = new NotificacionService();

    try {
        const reserva = await prisma.reserva.findUnique({
            where: { idReserva: reservaId },
            include: { cliente: true, auto: true }
        });

        if (!reserva) {
            console.error(`La reserva ${reservaId} no existe.`);
            return false;
        }

        // Verifica si ya existe una notificación para esta cancelación
        const notificacionExistente = await prisma.notificacion.findFirst({
            where: {
                usuarioId: reserva.idCliente,
                entidadId: reserva.idReserva,
                tipo: 'RESERVA_CANCELADA',
                haSidoBorrada: false
            }
        });

        if (notificacionExistente || reserva.estaPagada) return false;

        let mensaje = `Su reserva del vehículo ${reserva.auto.modelo} ${reserva.auto.marca} (placa ${reserva.auto.placa}) ha sido cancelada por no completar el pago restante.`;
        if (reserva.fechaLimitePago) {
            const fechaLimite = new Date(reserva.fechaLimitePago).toLocaleDateString('es-ES');
            mensaje += ` La fecha límite de pago era el <strong>${fechaLimite}</strong>.`;
        }
        mensaje += `\nAtte: REDIBO`;

        await notificacionService.crearNotificacion({
            usuarioId: reserva.idCliente,
            titulo: 'Reserva Cancelada',
            mensaje,
            tipo: 'RESERVA_CANCELADA',
            prioridad: 'ALTA',
            entidadId: reserva.idReserva,
            tipoEntidad: 'Reserva',
        });

        return true;
    } catch (error) {
        console.error('Error al notificar reserva cancelada por falta de pago:', error);
        return false;
    }
}