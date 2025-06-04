import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

export const getDriversByRenter = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as JwtPayload)?.idUsuario;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }
// Obtenemos los drivers asociados al usuario
    const drivers = await prisma.usuarioDriver.findMany({
      where: {
        idUsuario: userId,
      },
      include: {
        driver: {
          include: {
            usuario: {
              select: {
                nombreCompleto: true,
                telefono: true,
                email: true,
                fotoPerfil: true,
              },
            },
          },
        },
      },
    });

    // Adaptamos al formato que espera el frontend
    const result = drivers.map((relacion) => ({
      nombreCompleto: relacion.driver.usuario.nombreCompleto,
      telefono: relacion.driver.usuario.telefono,
      email: relacion.driver.usuario.email,
      fechaAsignacion: relacion.fechaAsignacion
    }));

    res.status(200).json({ drivers: result });
  } catch (error) {
    console.error('Error al obtener drivers:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
