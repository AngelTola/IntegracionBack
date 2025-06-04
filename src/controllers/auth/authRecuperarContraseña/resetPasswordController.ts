import { PrismaClient } from '@prisma/client';
import { RequestHandler } from 'express';
import bcrypt from 'bcryptjs'; // 👈 IMPORTANTE

const prisma = new PrismaClient();
let userEmailBD = '';

export const getEmail = async (emailBD: string): Promise<any> => {
  userEmailBD = emailBD;
  console.log('Datos resetPassword:', emailBD);
};

export const resetPassword: RequestHandler = async (req, res) => {
  const { newPassword } = req.body;

  console.log('📩 Llega al backend:', { newPassword });

  if (!newPassword) {
    res.status(400).json({ message: 'Faltan campos requeridos' });
    return;
  }

  try {
    const foundUser = await prisma.usuario.findFirst({
      where: { email: userEmailBD },
    });

    if (!foundUser) {
      console.log('El email no se encontró en la BD:', userEmailBD);
      res.status(400).json({ message: 'Error del sistema' });
      return;
    }

    // 🔐 Encriptar la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.usuario.update({
      where: { email: foundUser.email },
      data: {
        contraseña: hashedPassword,
      },
    });

    console.log('✅ Contraseña actualizada para:', foundUser.email);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('❌ Error en resetPassword:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
