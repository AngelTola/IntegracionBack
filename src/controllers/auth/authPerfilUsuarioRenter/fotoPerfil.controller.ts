import { Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { cloudinary } from '../../../config/cloudinary';
import type { UploadApiResponse } from 'cloudinary';

const prisma = new PrismaClient();
const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const uploadProfilePhoto = async (req: Request, res: Response): Promise<void> => {
  const { idUsuario } = req.user as { idUsuario: number };

  if (!req.file) {
     res.status(400).json({ message: 'No se subió ninguna imagen.' });
  }

  try {
    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `Redibo/FotosPerfil/${idUsuario}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Error subiendo a Cloudinary'));
          resolve(result);
        }
      );
      stream.end((req.file as Express.Multer.File).buffer);
    });

    await prisma.usuario.update({
      where: { idUsuario },
      data: { fotoPerfil: result.secure_url },
    });

     res.json({ message: 'Foto actualizada exitosamente.', fotoPerfil: result.secure_url });
  } catch (error) {
    console.error('Error al subir a Cloudinary:', error);
     res.status(500).json({ message: 'Error al subir la imagen' });
  }
};

export const deleteProfilePhoto = async (req: Request, res: Response): Promise<void> => {
  const { idUsuario } = req.user as { idUsuario: number };

  try {
    const user = await prisma.usuario.findUnique({
      where: { idUsuario },
      select: { fotoPerfil: true }
    });

    if (!user?.fotoPerfil) {
       res.status(400).json({ message: 'No hay foto para eliminar.' });
       return;
    }

    const segments = user.fotoPerfil.split('/');
    const publicId = segments.slice(-2).join('/').split('.')[0]; // Extrae el ID

    await cloudinary.uploader.destroy(publicId);

    await prisma.usuario.update({
      where: { idUsuario },
      data: { fotoPerfil: null },
    });

     res.json({ message: 'Foto eliminada exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar la foto:', error);
     res.status(500).json({ message: 'Error al eliminar la foto.' });
  }
};