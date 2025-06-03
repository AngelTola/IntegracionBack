import { PrismaClient } from '@prisma/client';
import { isWithinInterval } from 'date-fns';

const prisma = new PrismaClient();

interface FiltroVehiculo {
  texto?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  lat?: number;
  lng?: number;
  dkm?: number;
  precioMin?: number;
  precioMax?: number;
}

export const filtrarVehiculos = async (filtro: FiltroVehiculo) => {
  const {
    texto,
    fechaInicio,
    fechaFin,
    lat,
    lng,
    dkm = 5,
    precioMin,
    precioMax,
  } = filtro;

  if (fechaInicio && fechaFin && fechaInicio >= fechaFin) {
    const error: any = new Error('La fecha de inicio debe ser menor que la fecha de fin.');
    error.status = 400;
    throw error;
  }

  const autos = await prisma.auto.findMany({
    where: {
      estado: 'ACTIVO',
      precioRentaDiario: {
        ...(precioMin !== undefined ? { gte: precioMin } : {}),
        ...(precioMax !== undefined ? { lte: precioMax } : {}),
      },
      OR: texto
        ? [
            { modelo: { contains: texto, mode: 'insensitive' } },
            { marca: { contains: texto, mode: 'insensitive' } },
          ]
        : undefined,
    },
    include: {
      reservas: true,
      ubicacion: true,
      imagenes: {
        orderBy: { idImagen: 'desc' },
        take: 1
      },
    },
  });

  const filtrado = autos.filter((v) => {
    if (
      lat !== undefined &&
      lng !== undefined &&
      v.ubicacion.latitud !== null &&
      v.ubicacion.longitud !== null
    ) {
      const distancia = calcularDistancia(lat, lng, v.ubicacion.latitud, v.ubicacion.longitud);
      if (distancia > dkm) return false;
    }

    if (fechaInicio && fechaFin) {
      const reservado = v.reservas.some((r) => {
        return (
          isWithinInterval(fechaInicio, { start: r.fechaInicio, end: r.fechaFin }) ||
          isWithinInterval(fechaFin, { start: r.fechaInicio, end: r.fechaFin }) ||
          (fechaInicio <= r.fechaInicio && fechaFin >= r.fechaFin)
        );
      });
      if (reservado) return false;
    }

    return true;
  });

  const vehiculosFormateados = filtrado.map((v) => {
    const distancia = lat !== undefined && lng !== undefined
      ? calcularDistancia(lat, lng, v.ubicacion.latitud, v.ubicacion.longitud)
      : null;

    const imagenUrl = v.imagenes.length > 0 ? v.imagenes[0].direccionImagen : null;

    return {
      id: v.idAuto,
      nombre: `${v.marca} - ${v.modelo}`,
      descripcion: v.descripcion,
      precio: v.precioRentaDiario,
      calificacion: v.calificacionPromedio ?? null,
      latitud: v.ubicacion.latitud,
      longitud: v.ubicacion.longitud,
      anio: v.año,
      transmision: v.transmision,
      consumo: v.combustible,
      distancia: distancia !== null ? parseFloat(distancia.toFixed(2)) : null,
      imagenUrl: imagenUrl,
    };
  });

  return {
    cantidad: vehiculosFormateados.length,
    vehiculos: vehiculosFormateados,
  };
};

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}
