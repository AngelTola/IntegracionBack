import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const registrarHostCompleto = async (data: {
  id_usuario: number;
  placa: string;
  soat: string;
  imagenes: string[];
  tipo: "tarjeta" | "qr" | "efectivo";
  numero_tarjeta?: string;
  fecha_expiracion?: string;
  titular?: string;
  imagen_qr?: string;
  detalles_metodo_pago?: string;
}) => {
  const { id_usuario, ...resto } = data;

  return await prisma.$transaction([
    prisma.vehiculo.create({
      data: {
        placa: resto.placa,
        soat: resto.soat,
        imagenes: resto.imagenes,
        usuario: { connect: { id_usuario } },
      },
    }),
    prisma.usuario.update({
      where: { id_usuario },
      data: {
        metodo_pago_tipo: resto.tipo,
        numero_tarjeta: resto.numero_tarjeta,
        fecha_expiracion: resto.fecha_expiracion,
        titular: resto.titular,
        imagen_qr: resto.imagen_qr,
        detalles_metodo_pago: resto.detalles_metodo_pago,
        host: true,
      },
    }),
  ]);
};
