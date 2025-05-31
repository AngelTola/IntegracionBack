import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const obtenerRentersDeDriver = async (idUsuario: number) => {
  // Paso 1: Validar que este usuario sea un driver
  const driver = await prisma.driver.findUnique({
    where: { idUsuario },
  });

  if (!driver) {
    throw new Error("Driver no encontrado");
  }

  // Paso 2: Buscar todos los usuarios que tengan assignedToDriver igual al idUsuario del driver
  const renters = await prisma.usuario.findMany({
    where: {
      assignedToDriver: idUsuario, // <-- campo clave
    },
  });

  // Paso 3: Mapear los datos
  return renters.map((renter) => ({
    fecha_suscripcion: renter.fechaRegistro, // ✅ este campo existe en Usuario
    nombre: renter.nombreCompleto,
    telefono: renter.telefono || "",
    email: renter.email,
  }));
};
