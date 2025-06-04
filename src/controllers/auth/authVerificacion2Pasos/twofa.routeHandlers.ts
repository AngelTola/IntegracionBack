// ✅ ARCHIVO: src/controllers/authVerificacion2Pasos/twofa.routeHandlers.ts
import { Request, Response } from 'express';
import { enviarCodigo2FA, verificarCodigo2FA, verifyLoginCode } from './twofa.controller';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export const handleDesactivar2FA = async (req: Request, res: Response) => {
  try {
    const { idUsuario } = req.user as { idUsuario: number };
    await prisma.usuario.update({
      where: { idUsuario },
      data: { verificacionDosPasos: false },
    });
    res.status(200).json({ message: 'Verificación desactivada con éxito' });
  } catch (error) {
    console.error('Error al desactivar 2FA:', error);
    res.status(500).json({ message: 'Error interno al desactivar 2FA' });
  }
};

export const handleVerifyLoginCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idUsuario } = req.user as { idUsuario: number; temp2FA?: boolean };
    const { codigo } = req.body;
    
    if (!(req.user as any)?.temp2FA) {
      res.status(401).json({ message: 'Token inválido' });
      return;
    }
    
    const result = await verifyLoginCode(idUsuario, codigo);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error al verificar código' });
  }
};