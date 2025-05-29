import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const obtenerRentersDisponibles = async (req: Request, res: Response) => {
  try {
    const renters = await prisma.usuario.findMany({
      select: {
        idUsuario: true,
        nombreCompleto: true,
        email: true,
        telefono: true,
        fotoPerfil: true 
      }
    });

    res.json(renters);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};
