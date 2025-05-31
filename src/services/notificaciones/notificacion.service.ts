import prisma from '../../config/database';
import { NotificacionDTO, NotificacionFiltro } from '../../types/notificaciones/notificacion.types';
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
                    idUsuario: notificacionData.idUsuario
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
      
          if (filtros.idUsuario)   where.usuarioId   = filtros.idUsuario;
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
              const idEnt = n.idEntidad;
              const tipoEnt = n.tipoEntidad?.toLowerCase();
      
              if (idEnt && tipoEnt) {
                switch (tipoEnt) {
                  case 'renta': {
                    // renta → reserva → auto → imágenes
                    const renta = await prisma.renta.findUnique({
                      where: { idRenta: idEnt },
                      include: {
                        reserva: {
                          include: {
                            auto: { select: { imagenes: true } }
                          }
                        }
                      }
                    });
                    imagenAuto = renta?.reserva?.auto?.imagenes?.[0].direccionImagen ?? null;
                    break;
                  }
                  case 'reserva': {
                    // reserva → auto → imágenes
                    const reserva = await prisma.reserva.findUnique({
                      where: { idReserva: parseInt(idEnt) },
                      include: { auto: { select: { imagenes: true } } }
                    });
                    imagenAuto = reserva?.auto?.imagenes?.[0].direccionImagen ?? null;
                    break;
                  }
                  case 'calificacion': {
                    // calificacion → renta → reserva → auto → imágenes
                    const calif = await prisma.calificacion.findUnique({
                      where: { idCalificacion: idEnt },
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
                    imagenAuto = calif?.renta?.reserva?.auto?.imagenes?.[0].direccionImagen ?? null;
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

    async obtenerDetalleNotificacion(id: string, idUsuario: number) {
        try {
            const notificacion = await prisma.notificacion.findUnique({
                where: { idNotificacion: id },
            });
    
            if (!notificacion) {
                throw new Error('Notificación no encontrada');
            }
    
            if (notificacion.idUsuario !== idUsuario) {
                throw new Error('No tienes permiso para ver esta notificación');
            }
            
            if (notificacion.haSidoBorrada) {
                throw new Error('Esta notificación ha sido eliminada');
            }
    
            // Ahora, obtener la imagen del auto asociada a esta notificación
            let imagenAuto: string | null = null;
            const idEnt = notificacion.idEntidad;
            const tipoEnt = notificacion.tipoEntidad?.toLowerCase();
    
            if (idEnt && tipoEnt) {
                switch (tipoEnt) {
                    case 'renta': {
                        // renta → reserva → auto → imágenes
                        const renta = await prisma.renta.findUnique({
                            where: { idRenta: idEnt },
                            include: {
                                reserva: {
                                    include: {
                                        auto: { select: { imagenes: true } },
                                    },
                                },
                            },
                        });
                        imagenAuto = renta?.reserva?.auto?.imagenes?.[0].direccionImagen ?? null;
                        break;
                    }
                    case 'reserva': {
                        // reserva → auto → imágenes
                        const reserva = await prisma.reserva.findUnique({
                            where: { idReserva: parseInt(idEnt) },
                            include: { auto: { select: { imagenes: true } } },
                        });
                        imagenAuto = reserva?.auto?.imagenes?.[0].direccionImagen ?? null;
                        break;
                    }
                    case 'calificacion': {
                        // calificacion → renta → reserva → auto → imágenes
                        const calif = await prisma.calificacion.findUnique({
                            where: { idCalificacion: idEnt },
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
                        imagenAuto = calif?.renta?.reserva?.auto?.imagenes?.[0].direccionImagen  ?? null;
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

    async marcarComoLeida(id: string, idUsuario: number) {
        try {
            const notificacion = await prisma.notificacion.findUnique({
                where: { idNotificacion: id }
            });

            if (!notificacion) {
                throw new Error('Notificación no encontrada');
            }

            if (notificacion.idUsuario !== idUsuario) {
                throw new Error('No tienes permiso para actualizar esta notificación');
            }
            
            if (notificacion.haSidoBorrada) {
                throw new Error('Esta notificación ha sido eliminada');
            }

            const actualizada = await prisma.notificacion.update({
                where: { idNotificacion: id },
                data: {
                    leido: true,
                    leidoEn: new Date()
                }
            });

            this.sseService.enviarNotificacion({
                evento: 'NOTIFICACION_LEIDA',
                data: actualizada,
                idUsuario
            });

            return actualizada;
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            throw new Error('No se pudo actualizar la notificación');
        }
    }

    async eliminarNotificacion(id: string, idUsuario: number) {
        try {
            const notificacion = await prisma.notificacion.findUnique({
                where: { idNotificacion: id }
            });

            if (!notificacion) {
                throw new Error('Notificación no encontrada');
            }

            if (notificacion.idUsuario !== idUsuario) {
                throw new Error('No tienes permiso para eliminar esta notificación');
            }
            
            // soft delete 
            const eliminada = await prisma.notificacion.update({
                where: { idNotificacion: id },
                data: { 
                    haSidoBorrada: true
                }
            });

            this.sseService.enviarNotificacion({
                evento: 'NOTIFICACION_ELIMINADA',
                data: { id },
                idUsuario
            });

            return { id, eliminada: true };
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
            throw error;
        }
    }

    async obtenerConteoNoLeidas(idUsuario: number) {
        try {
            const count = await prisma.notificacion.count({
                where: {
                    idUsuario,
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

    async obtenerNoLeidas(userId: number) {
    return prisma.notificacion.findMany({
      where: {
        idUsuario: userId,
        leido: false,
        haSidoBorrada: false 
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });
    }
}