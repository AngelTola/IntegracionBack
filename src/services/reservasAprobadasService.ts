import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const obtenerReservasAprobadas = async () => {
  return await prisma.reserva.findMany({
    where: {
      estado: "APROBADA",
    },
    include: {
      auto: {
        include: {
          ubicacion: true,
          propietario: {
            select: { nombreCompleto: true, email: true },
          },
          imagenes: true,
        },
      },
      cliente: {
        select: { nombreCompleto: true, email: true },
      },
    },
  });
};

export const obtenerReservaPorId = async (idReserva: number) => {
  return await prisma.reserva.findUnique({
    where: { idReserva },
    include: {
      auto: {
        include: {
          ubicacion: true,
          propietario: {
            select: { nombreCompleto: true, email: true },
          },
          imagenes: true,
        },
      },
      cliente: {
        select: { nombreCompleto: true, email: true },
      },
      registroPagos: {
        include: {
          pagos: {
            include: {
              garantia: true,
            },
          },
        },
      },
      comentario: true,
      calificacionUsuario: true,
    },
  });
};