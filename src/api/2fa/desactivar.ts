// api/2fa/desactivar.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { idUsuario: number };

    await prisma.usuario.update({
      where: { idUsuario: decoded.idUsuario },
      data: { verificacionDosPasos: false },
    });

    return res.status(200).json({ message: 'Verificación desactivada con éxito' });
  } catch (error) {
    console.error('❌ Error al procesar /2fa/desactivar:', error);
    return res.status(401).json({ message: 'Token inválido o error interno' });
  }
}