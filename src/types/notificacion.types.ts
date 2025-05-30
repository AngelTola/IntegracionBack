import { TipoDeNotificacion, PrioridadNotificacion } from "@prisma/client";

// Data Transfer Object, estructura exacta para crear una nueva notificacion en el sistema
export interface NotificacionDTO {
    titulo: string;
    mensaje: string;
    tipo: TipoDeNotificacion;
    prioridad?: PrioridadNotificacion;
    entidadId?: string;
    tipoEntidad?: string;
    usuarioId: string;
}

// Campos opcionales para los criterios por los que pueden ser filtradas las notificaciones
export interface NotificacionFiltro {
    usuarioId?: string;
    tipo?: TipoDeNotificacion;
    leido?: boolean;
    prioridad?: PrioridadNotificacion;
    desde?: Date;
    hasta?: Date;
    tipoEntidad?: string;
    limit?: number;
    offset?: number;
}
