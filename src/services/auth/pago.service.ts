//src/services/auth/pago.service.ts
import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

export const registrarHostCompleto = async (data: {
  idPropietario: number;
  placa: string;
  soat: string;
  imagenes: string[];
  tipo: "TARJETA_DEBITO" | "QR" | "EFECTIVO";
  numeroTarjeta?: string;
  fechaExpiracion?: string;
  titular?: string;
  imagenQr?: string;
  detallesMetodoPago?: string;
}) => {
  const { idPropietario, ...resto } = data;

  return await prisma.$transaction([
    prisma.auto.create({
      data: {
        placa: resto.placa,
        soat: resto.soat,
        imagenes: {
          create: resto.imagenes.map((img) => ({ direccionImagen: img })),
        },
        propietario: { connect: { idUsuario: idPropietario } },
        ubicacion: { connect: { idUbicacion: 1 } }, // Asegúrate de que existe
        marca: "Por definir",
        modelo: "Por definir",
        tipo: "Por definir",
        año: 2024,
        color: "Por definir",
        precioRentaDiario: new Prisma.Decimal(0),
        montoGarantia: new Prisma.Decimal(0),
        transmision: "MANUAL",
        combustible: "GASOLINA",
        capacidadMaletero: 0,
        asientos: 5,
        estado: "ACTIVO",
      },
    }),
    prisma.usuario.update({
      where: { idUsuario: idPropietario },
      data: {
        metodoPago: resto.tipo,
        numeroTarjeta: resto.numeroTarjeta,
        fechaExpiracion: resto.fechaExpiracion,
        titular: resto.titular,
        imagenQr: resto.imagenQr,
        detallesMetodoPago: resto.detallesMetodoPago,
        host: true,
      },
    }),
  ]);
};


