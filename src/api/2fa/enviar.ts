// api/2fa/enviar.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { enviarCodigo2FA } from '../../controllers/auth/authVerificacion2Pasos/twofa.controller';

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      idUsuario: number;
      email: string;
    };

    const response = await enviarCodigo2FA(decoded.idUsuario, decoded.email);
    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error al procesar /2fa/enviar:', error);
    return res.status(401).json({ message: 'Token inválido o error interno' });
  }
}