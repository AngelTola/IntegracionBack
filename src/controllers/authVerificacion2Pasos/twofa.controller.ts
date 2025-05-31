import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const enviarCodigo2FA = async (idUsuario: number, email: string) => {
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  const expiracion = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.usuario.update({
    where: { idUsuario },
    data: {
      codigo2FA: codigo,
      codigo2FAExpira: expiracion,
    },
  });

  await transporter.sendMail({
    from: `"Redibo" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Tu código de verificación en dos pasos',
    text: `Tu código es: ${codigo}. Expira en 5 minutos.`,
  });

  return { message: 'Código enviado correctamente' };
};

export const verificarCodigo2FA = async (idUsuario: number, codigo: string) => {
  const user = await prisma.usuario.findUnique({ where: { idUsuario } });

  if (!user || !user.codigo2FA || !user.codigo2FAExpira) {
    throw new Error('No hay un código válido para este usuario');
  }

  if (user.codigo2FA !== codigo) {
    throw new Error('Código incorrecto');
  }

  if (new Date() > user.codigo2FAExpira) {
    throw new Error('Código expirado');
  }

  await prisma.usuario.update({
    where: { idUsuario },
    data: {
      codigo2FA: null,
      codigo2FAExpira: null,
      verificacionDosPasos: true,
    },
  });

  return { message: 'Verificación exitosa' };
};