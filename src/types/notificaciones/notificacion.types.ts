//src/types/
import { PrioridadNotificacion } from "@prisma/client";

// Data Transfer Object, estructura exacta para crear una nueva notificacion en el sistema
export interface NotificacionDTO {
    titulo: string;
    mensaje: string;
    tipo: string;
    prioridad?: PrioridadNotificacion;
    idEntidad?: string;
    tipoEntidad?: string;
    idUsuario: number;
}

// Campos opcionales para los criterios por los que pueden ser filtradas las notificaciones
export interface NotificacionFiltro {
    idUsuario?: number;
    tipo?: string;
    leido?: boolean;
    prioridad?: PrioridadNotificacion;
    desde?: Date;
    hasta?: Date;
    tipoEntidad?: string;
    limit?: number;
    offset?: number;
}
