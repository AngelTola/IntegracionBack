import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Registra un nuevo driver y asigna una lista de renters.
 * @param data Datos del driver + lista de IDs de renters
 */
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

  // Verificar si el usuario ya tiene teléfono registrado
  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario },
    select: { telefono: true }
  });

  const telefonoFinal = usuario?.telefono ? String(usuario.telefono) : telefono;

  return await prisma.$transaction([
    // 1. Crear al driver
    prisma.driver.create({
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
    }),

    // 2. Si no tenía teléfono, actualizarlo ahora
    ...(usuario?.telefono
      ? [] // ya tiene, no actualizamos
      : [
          prisma.usuario.update({
            where: { idUsuario },
            data: { telefono: String(telefono) }
          })
        ]),

    // 3. Marcar al usuario como driver (driverBool = true)
    prisma.usuario.update({
      where: { idUsuario },
      data: { driverBool: true }
    }),

    // 4. Asignar renters
    ...rentersIds.map((renterId) =>
      prisma.usuario.update({
        where: { idUsuario: renterId },
        data: {
          assignedToDriver: idUsuario
        }
      })
    )
  ]);
};
 

