import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Registra un nuevo driver y asigna una lista de renters.
 * @param data Datos del driver + lista de IDs de renters
 */
export const registrarDriverCompleto = async (data: {
  id_usuario: number;
  sexo: string;
  telefono: string;
  nro_licencia: string;
  categoria: string;
  fecha_emision: Date;
  fecha_vencimiento: Date;
  anversoUrl: string;
  reversoUrl: string;
  rentersIds: number[];
}) => {
  const {
    id_usuario,
    sexo,
    telefono,
    nro_licencia,
    categoria,
    fecha_emision,
    fecha_vencimiento,
    anversoUrl,
    reversoUrl,
    rentersIds
  } = data;

  if (!rentersIds || rentersIds.length === 0) {
    throw new Error('Debes asignar al menos un renter al driver.');
  }

  // Verificar si el usuario ya tiene teléfono registrado
  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario },
    select: { telefono: true }
  });

  const telefonoFinal = usuario?.telefono ? String(usuario.telefono) : telefono;

  return await prisma.$transaction([
    // 1. Crear al driver
    prisma.driver.create({
      data: {
        id_usuario,
        sexo,
        telefono: telefonoFinal,
        nro_licencia,
        categoria,
        fecha_emision,
        fecha_vencimiento,
        anversoUrl,
        reversoUrl
      }
    }),

    // 2. Si no tenía teléfono, actualizarlo ahora
    ...(usuario?.telefono
      ? [] // ya tiene, no actualizamos
      : [
          prisma.usuario.update({
            where: { id_usuario },
            data: { telefono: Number(telefono) }
          })
        ]),

    // 3. Marcar al usuario como driver (driverBool = true)
    prisma.usuario.update({
      where: { id_usuario },
      data: { driverBool: true }
    }),

    // 4. Asignar renters
    ...rentersIds.map((renterId) =>
      prisma.usuario.update({
        where: { id_usuario: renterId },
        data: {
          assignedToDriver: id_usuario
        }
      })
    )
  ]);
};
 

