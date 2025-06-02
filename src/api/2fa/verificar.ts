// api/2fa/verificar.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { codigo } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { idUsuario: number };
    const user = await prisma.usuario.findUnique({ where: { idUsuario: decoded.idUsuario } });

    if (!user || !user.codigo2FA || !user.codigo2FAExpira) {
      return res.status(400).json({ message: 'No hay un código válido para este usuario' });
    }

    if (user.codigo2FA !== codigo) {
      return res.status(400).json({ message: 'Código incorrecto' });
    }

    if (new Date() > user.codigo2FAExpira) {
      return res.status(400).json({ message: 'Código expirado' });
    }

    // ✅ Éxito: opcionalmente, puedes limpiar el código
    await prisma.usuario.update({
      where: { idUsuario: decoded.idUsuario },
      data: { codigo2FA: null, codigo2FAExpira: null }
    });

    return res.status(200).json({ message: 'Verificación exitosa' });
  } catch (error) {
    console.error('Error al verificar el código 2FA:', error);
    return res.status(401).json({ message: 'Token inválido o error interno' });
  }
}