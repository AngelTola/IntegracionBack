import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const obtenerRentersDeDriver = async (idUsuario: number) => {

  const driver = await prisma.driver.findUnique({
    where: { idUsuario },
  });

  if (!driver) {
    throw new Error("Driver no encontrado");
  }

  const renters = await prisma.usuario.findMany({
    where: {
      assignedToDriver: idUsuario,
    },
  });

  return renters.map((renter) => ({
    fecha_suscripcion: renter.fechaRegistro, 
    nombre: renter.nombreCompleto,
    telefono: renter.telefono || "",
    email: renter.email,
  }));
};
