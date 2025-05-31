// ✅ ARCHIVO: src/controllers/authVerificacion2Pasos/twofa.routeHandlers.ts
import { Request, Response } from 'express';
import { enviarCodigo2FA, verificarCodigo2FA } from './twofa.controller';

export const handleEnviarCodigo = async (req: Request, res: Response) => {
  try {
    const { idUsuario, email } = req.user as { idUsuario: number; email: string };
    const response = await enviarCodigo2FA(idUsuario, email);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al enviar código 2FA:', error);
    res.status(500).json({ message: 'Error interno' });
  }
};

export const handleVerificarCodigo = async (req: Request, res: Response) => {
  try {
    const { idUsuario } = req.user as { idUsuario: number };
    const { codigo } = req.body;
    const response = await verificarCodigo2FA(idUsuario, codigo);
    res.status(200).json(response);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al verificar código' });
  }
};