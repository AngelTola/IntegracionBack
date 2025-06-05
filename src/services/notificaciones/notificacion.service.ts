//src/services/notificaciones/notificacion.service.ts
import prisma from '../../config/database';
import { NotificacionDTO, NotificacionFiltro } from '../../types/notificaciones/notificacion.types';
import { PrioridadNotificacion } from '@prisma/client';
import { SSEService } from './sse.service';

// ============================================================================
// 1. INTERFACES Y TIPOS
// ============================================================================

export interface EventoNotificacion {
  type: string;
  idUsuario: number;
  idEntidad?: string;
  tipoEntidad?: string;
  data: Record<string, any>;
  prioridad?: PrioridadNotificacion;
}

export interface TemplateNotificacion {
  titulo: string;
  mensaje: string;
  prioridad: PrioridadNotificacion;
}

// ============================================================================
// 2. REGISTRY DE TEMPLATES
// ============================================================================

export class NotificationTemplateRegistry {
  private templates: Map<string, (data: any) => TemplateNotificacion> = new Map();

  constructor() {
    this.registrarTemplatesBase();
  }

  private registrarTemplatesBase() {
    // Reservas
    this.templates.set('RESERVA_CONFIRMADA', (data) => ({
      titulo: 'Reserva Confirmada',
      mensaje: `Tu reserva para el ${data.auto?.marca || 'vehículo'} ${data.auto?.modelo || ''} ha sido confirmada para el ${data.fechaInicio || 'fecha programada'}`,
      prioridad: PrioridadNotificacion.ALTA
    }));

    this.templates.set('RESERVA_CANCELADA', (data) => ({
      titulo: 'Reserva Cancelada',
      mensaje: `Tu reserva #${data.idReserva || data.id} ha sido cancelada. ${data.motivo || 'Contacta con soporte para más información.'}`,
      prioridad: PrioridadNotificacion.MEDIA
    }));

    this.templates.set('RESERVA_MODIFICADA', (data) => ({
      titulo: 'Reserva Modificada',
      mensaje: `Tu reserva #${data.idReserva || data.id} ha sido modificada. Nuevas fechas: ${data.fechaInicio || ''} - ${data.fechaFin || ''}`,
      prioridad: PrioridadNotificacion.MEDIA
    }));

    // Rentas
    this.templates.set('ALQUILER_FINALIZADO', (data) => ({
      titulo: 'Alquiler Finalizado',
      mensaje: `Tu alquiler del ${data.auto?.marca || 'vehículo'} ${data.auto?.modelo || ''} ha finalizado exitosamente. ¡Gracias por usar nuestro servicio!`,
      prioridad: PrioridadNotificacion.MEDIA
    }));

    this.templates.set('ALQUILER_CANCELADO', (data) => ({
      titulo: 'Alquiler Cancelado',
      mensaje: `Tu alquiler ha sido cancelado. ${data.motivo ? `Motivo: ${data.motivo}` : 'Contacta con soporte para más detalles.'}`,
      prioridad: PrioridadNotificacion.ALTA
    }));

    // Calificaciones
    this.templates.set('VEHICULO_CALIFICADO', (data) => ({
      titulo: 'Vehículo Calificado',
      mensaje: `Tu vehículo ${data.auto?.marca || ''} ${data.auto?.modelo || ''} ha sido calificado con ${data.calificacion || data.puntuacion} estrellas`,
      prioridad: PrioridadNotificacion.BAJA
    }));

    this.templates.set('NUEVA_CALIFICACION', (data) => ({
      titulo: 'Nueva Calificación Recibida',
      mensaje: `Has recibido una nueva calificación de ${data.calificacion || data.puntuacion} estrellas. ${data.comentario ? `Comentario: "${data.comentario}"` : ''}`,
      prioridad: PrioridadNotificacion.BAJA
    }));

    // Pagos/Depósitos
    this.templates.set('DEPOSITO_CONFIRMADO', (data) => ({
      titulo: 'Depósito Confirmado',
      mensaje: `Tu depósito de $${data.monto || data.cantidad} ha sido confirmado para la reserva #${data.reservaId || data.idReserva}`,
      prioridad: PrioridadNotificacion.ALTA
    }));

    this.templates.set('DEPOSITO_RECIBIDO', (data) => ({
      titulo: 'Depósito Recibido',
      mensaje: `Has recibido un depósito de $${data.monto || data.cantidad} por la reserva #${data.reservaId || data.idReserva}`,
      prioridad: PrioridadNotificacion.MEDIA
    }));

    // Para casos no contemplados
    this.templates.set('NOTIFICACION_GENERICA', (data) => ({
      titulo: data.titulo || 'Notificación',
      mensaje: data.mensaje || 'Tienes una nueva notificación',
      prioridad: data.prioridad || PrioridadNotificacion.MEDIA
    }));
  }

  // Método para que otros servicios registren sus templates
  registrarTemplate(tipo: string, template: (data: any) => TemplateNotificacion) {
    this.templates.set(tipo, template);
  }

  obtenerTemplate(tipo: string): ((data: any) => TemplateNotificacion) | undefined {
    return this.templates.get(tipo);
  }

  obtenerTiposDisponibles(): string[] {
    return Array.from(this.templates.keys());
  }
}

// ============================================================================
// 3. NOTIFICATION ADAPTER
// ============================================================================

export class NotificationAdapter {
  private templateRegistry: NotificationTemplateRegistry;
  private notificationService: NotificacionService;

  constructor(notificationService: NotificacionService) {
    this.templateRegistry = new NotificationTemplateRegistry();
    this.notificationService = notificationService;
  }

  // Método principal que usan todos los servicios
  async procesarEvento(evento: EventoNotificacion): Promise<any> {
    try {
      const template = this.templateRegistry.obtenerTemplate(evento.type);
      
      if (!template) {
        console.warn(`Template no encontrado para evento: ${evento.type}. Usando template genérico.`);
        const genericTemplate = this.templateRegistry.obtenerTemplate('NOTIFICACION_GENERICA');
        if (!genericTemplate) {
          throw new Error(`No se pudo procesar la notificación de tipo: ${evento.type}`);
        }
        const notificacionData = genericTemplate(evento.data);
        
        const notificacionDTO = {
          idUsuario: evento.idUsuario,
          titulo: notificacionData.titulo,
          mensaje: notificacionData.mensaje,
          tipo: evento.type,
          prioridad: evento.prioridad || notificacionData.prioridad,
          idEntidad: evento.idEntidad,
          tipoEntidad: evento.tipoEntidad
        };

        return await this.notificationService.crearNotificacion(notificacionDTO);
      }

      const notificacionData = template(evento.data);

      const notificacionDTO = {
        idUsuario: evento.idUsuario,
        titulo: notificacionData.titulo,
        mensaje: notificacionData.mensaje,
        tipo: evento.type,
        prioridad: evento.prioridad || notificacionData.prioridad,
        idEntidad: evento.idEntidad,
        tipoEntidad: evento.tipoEntidad
      };

      return await this.notificationService.crearNotificacion(notificacionDTO);
    } catch (error) {
      console.error('Error al procesar evento de notificación:', error);
      throw error;
    }
  }

  // Método para que servicios registren templates dinámicamente
  registrarNuevoTipo(tipo: string, template: (data: any) => TemplateNotificacion) {
    this.templateRegistry.registrarTemplate(tipo, template);
  }

  // Helper methods para eventos comunes
  async notificarReserva(accion: 'CONFIRMADA' | 'CANCELADA' | 'MODIFICADA', reserva: any) {
    return this.procesarEvento({
      type: `RESERVA_${accion}`,
      idUsuario: reserva.idUsuario,
      idEntidad: reserva.idReserva?.toString(),
      tipoEntidad: 'reserva',
      data: reserva
    });
  }

  async notificarRenta(accion: 'FINALIZADO' | 'CANCELADO', renta: any) {
    return this.procesarEvento({
      type: `ALQUILER_${accion}`,
      idUsuario: renta.idUsuario,
      idEntidad: renta.idRenta?.toString(),
      tipoEntidad: 'renta',
      data: renta
    });
  }

  async notificarCalificacion(calificacion: any) {
    return this.procesarEvento({
      type: 'NUEVA_CALIFICACION',
      idUsuario: calificacion.idUsuario,
      idEntidad: calificacion.idCalificacion?.toString(),
      tipoEntidad: 'calificacion',
      data: calificacion
    });
  }

  async notificarDeposito(accion: 'CONFIRMADO' | 'RECIBIDO', deposito: any) {
    return this.procesarEvento({
      type: `DEPOSITO_${accion}`,
      idUsuario: deposito.idUsuario,
      idEntidad: deposito.id?.toString(),
      tipoEntidad: 'deposito',
      data: deposito
    });
  }
}

// ============================================================================
// 4. SERVICIO NOTIFICACIONES 
// ============================================================================

export class NotificacionService {
    private sseService: SSEService;
    private adapter?: NotificationAdapter;

    constructor() {
        this.sseService = SSEService.getInstance();
        setTimeout(() => {
            this.adapter = new NotificationAdapter(this);
        }, 0);
    }

    // ========== MÉTODO NUEVO PARA USAR EL SISTEMA DE TEMPLATES ========== 
    async procesarEvento(evento: EventoNotificacion) {
        if (!this.adapter) {
            throw new Error('Adapter no inicializado. Usa crearNotificacion() directamente.');
        }
        return this.adapter.procesarEvento(evento);
    }

    // Método para obtener el adapter (útil para registrar nuevos templates)
    getAdapter(): NotificationAdapter {
        if (!this.adapter) {
            this.adapter = new NotificationAdapter(this);
        }
        return this.adapter;
    }

    // ========== TUS MÉTODOS ORIGINALES (sin cambios) ========== 
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
      
          if (filtros.idUsuario)   where.idUsuario   = filtros.idUsuario;
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
      
          // 1) Traemos las notificaciones "planas"
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
                      where: { id: idEnt },
                      include: {
                        reserva: {
                          include: {
                            auto: { select: { imagenes: true } }
                          }
                        }
                      }
                    });
                    imagenAuto = renta?.reserva?.auto?.imagenes?.[0]?.direccionImagen ?? null;
                    break;
                  }
                  case 'reserva': {
                    // reserva → auto → imágenes
                    const reserva = await prisma.reserva.findUnique({
                      where: { idReserva: parseInt(idEnt) },
                      include: { auto: { select: { imagenes: true } } }
                    });
                    imagenAuto = reserva?.auto?.imagenes?.[0]?.direccionImagen ?? null;
                    break;
                  }
                  case 'calificacion': {
                    // calificacion → renta → reserva → auto → imágenes
                    const calif = await prisma.calificacionUsuario.findUnique({
                      where: { idCalificacion: parseInt(idEnt) },
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
                    imagenAuto = calif?.renta?.reserva?.auto?.imagenes?.[0]?.direccionImagen ?? null;
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
                            where: { id: idEnt },
                            include: {
                                reserva: {
                                    include: {
                                        auto: { select: { imagenes: true } },
                                    },
                                },
                            },
                        });
                        imagenAuto = renta?.reserva?.auto?.imagenes?.[0]?.direccionImagen ?? null;
                        break;
                    }
                    case 'reserva': {
                        // reserva → auto → imágenes
                        const reserva = await prisma.reserva.findUnique({
                            where: { idReserva: parseInt(idEnt) },
                            include: { auto: { select: { imagenes: true } } },
                        });
                        imagenAuto = reserva?.auto?.imagenes?.[0]?.direccionImagen ?? null;
                        break;
                    }
                    case 'calificacion': {
                        // calificacion → renta → reserva → auto → imágenes
                        const calif = await prisma.calificacionUsuario.findUnique({
                            where: { idCalificacion: parseInt(idEnt) },
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
                        imagenAuto = calif?.renta?.reserva?.auto?.imagenes?.[0]?.direccionImagen  ?? null;
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

// ============================================================================
// 5. SINGLETON MANAGER PARA FÁCIL ACCESO GLOBAL
// ============================================================================

export class NotificationManager {
  private static instance: NotificationManager;
  private notificationService: NotificacionService;

  private constructor() {
    this.notificationService = new NotificacionService();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  getService(): NotificacionService {
    return this.notificationService;
  }

  getAdapter(): NotificationAdapter {
    return this.notificationService.getAdapter();
  }

  // Métodos de conveniencia
  async notificar(evento: EventoNotificacion) {
    return this.notificationService.procesarEvento(evento);
  }

  // Registro de nuevos templates
  registrarTemplate(tipo: string, template: (data: any) => TemplateNotificacion) {
    this.getAdapter().registrarNuevoTipo(tipo, template);
  }
}