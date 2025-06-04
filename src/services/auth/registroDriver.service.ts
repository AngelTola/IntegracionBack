//src/services/auth/registroDriver.service.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const registrarDriverCompleto = async (data: {
  idUsuario: number;
  sexo: string;
  telefono: string;
  licencia: string;
  tipoLicencia: string;
  fechaEmision: Date;
  fechaExpiracion: Date;
  anversoUrl: string;
  reversoUrl: string;
  rentersIds: number[];
}) => {
  const {
    idUsuario,
    sexo,
    telefono,
    licencia,
    tipoLicencia,
    fechaEmision,
    fechaExpiracion,
    anversoUrl,
    reversoUrl,
    rentersIds
  } = data;

  if (!rentersIds || rentersIds.length === 0) {
    throw new Error('Debes asignar al menos un renter al driver.');
  }

  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario },
    select: { telefono: true }
  });

  const telefonoFinal = usuario?.telefono ? String(usuario.telefono) : telefono;

  return await prisma.$transaction(async (tx) => {
    // 1. Crear al driver y obtener su ID real
    const driver = await tx.driver.create({
      data: {
        idUsuario,
        sexo,
        telefono: telefonoFinal,
        licencia,
        tipoLicencia,
        fechaEmision,
        fechaExpiracion,
        anversoUrl,
        reversoUrl
      }
    });

    // 2. Actualizar teléfono si no tenía
    if (!usuario?.telefono) {
      await tx.usuario.update({
        where: { idUsuario },
        data: { telefono: String(telefono) }
      });
    }

    // 3. Marcar al usuario como driver
    await tx.usuario.update({
      where: { idUsuario },
      data: { driverBool: true }
    });

    // 4. Validar que todos los renterIds existen
    const renters = await tx.usuario.findMany({
      where: {
        idUsuario: { in: rentersIds },
      }
    });

    if (renters.length !== rentersIds.length) {
      throw new Error("Uno o más renters no existen en la base de datos.");
    }

    // 5. Registrar relaciones en UsuarioDriver
    await tx.usuarioDriver.createMany({
      data: rentersIds.map(renterId => ({
        idUsuario: renterId,
        idDriver: driver.idDriver,
        fechaAsignacion: new Date()
      })),
      skipDuplicates: true
    });
  });
};