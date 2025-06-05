import { PrismaClient } from "@prisma/client";
import { differenceInDays } from 'date-fns';

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

export const obtenerDetalleReserva = async (idReserva: number) => {
  const reserva = await prisma.reserva.findUnique({
    where: { idReserva },
    include: {
      auto: {
        include: {
          propietario: true,
          imagenes: { take: 1 },
        },
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
    },
  });

  if (!reserva) {
    throw new Error('Reserva no encontrada');
  }

  const { auto, fechaInicio, fechaFin, idReserva: id, registroPagos } = reserva;

  const diasReserva = differenceInDays(fechaFin, fechaInicio);
  const tarifa = Number(auto.precioRentaDiario);
  const montoGarantia = Number(auto.montoGarantia);
  const montoTotal = tarifa * diasReserva;
  const totalConGarantia = montoTotal + montoGarantia;

  const resultado = {
    idReserva: id,
    marca: auto.marca,
    modelo: auto.modelo,
    placa: auto.placa,
    descripcion: auto.descripcion,
    propietario: auto.propietario.nombreCompleto,
    combustible: auto.combustible,
    asientos: auto.asientos,
    capacidadMaletero: auto.capacidadMaletero,
    fechaInicio,
    fechaFin,
    diasReserva,
    tarifa,
    montoGarantia,
    totalReserva: montoTotal,
    totalConGarantia,
    imagen: auto.imagenes[0]?.direccionImagen || null,
  };

  return resultado;
};
