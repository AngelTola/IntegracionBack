import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

export const getDriversByRenter = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as JwtPayload)?.id_usuario;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

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

    const result = drivers.map((d) => ({
      nombreCompleto: d.driver.usuario.nombreCompleto,
      telefono: d.driver.usuario.telefono,
      email: d.driver.usuario.email,
      fotoPerfil: d.driver.usuario.fotoPerfil,
    }));

    res.status(200).json({ drivers: result });
  } catch (error) {
    console.error('Error al obtener drivers:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
