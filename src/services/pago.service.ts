//
import { PrismaClient } from "@prisma/client";
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
        imagen: resto.imagenes,
        usuario: { connect: { idUsuario } },
      },
    }),
    prisma.usuario.update({
      where: { idUsuario },
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

