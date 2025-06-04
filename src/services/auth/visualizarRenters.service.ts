//src/services/auth/visualizarRenters.service.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const obtenerRentersDeDriver = async (idUsuario: number) => {
  const driver = await prisma.driver.findUnique({
    where: { idUsuario },
  });

  if (!driver) {
    throw new Error("Driver no encontrado");
  }

  const relaciones = await prisma.usuarioDriver.findMany({
    where: { idDriver: idUsuario },
    include: {
      usuario: true,
    },
  });

  return relaciones.map((relacion) => ({
    fecha_suscripcion: relacion.fechaAsignacion,
    nombre: relacion.usuario.nombreCompleto,
    telefono: relacion.usuario.telefono || "",
    email: relacion.usuario.email,
  }));
};
