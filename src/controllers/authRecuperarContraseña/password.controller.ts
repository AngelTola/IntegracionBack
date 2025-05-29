// password.controller.ts
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { RequestHandler } from 'express';
import { codeverifyController, verifyCode } from './verifyCodeController';
import { getEmail } from './resetPasswordController';


const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rediboautos@gmail.com',
    pass: 'btsf fxaf nrdc hrms',
  },
  tls: {
    rejectUnauthorized: false, // Esto ignora el error del certificado autofirmado
  }
});


export const recoverPassword: RequestHandler = async (req, res) => {
  const { email } = req.body;
  // Verificar que el email ha llegado al controlador
  console.log('🧪 Correo recibido en password.controller:', email);
  
  try {
    const user = await prisma.usuario.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json({ message: 'El correo no está registrado en Redibo' });
      return;
    }
    // Check if the user is blocked
    if (user.bloqueado && user.fechaBloqueado && new Date() < user.fechaBloqueado) {
      console.log(`El usuario ha sido bloquedao hasta: ${user.fechaBloqueado.toISOString()}.`);
      res.status(400).json({ message:`El usuario ha sido bloquedao hasta: ${user.fechaBloqueado.toISOString()}.` });
      return;
    }
    // Si el usuario tenía bloqueo, pero ya expiró:
    if (user.bloqueado && user.fechaBloqueado && new Date() >= user.fechaBloqueado) {
      console.log('🔓 Bloqueo expirado. Restaurando estado del usuario...');

      await prisma.usuario.update({
        where: { email: user.email },
        data: {
          bloqueado: false,
          fechaBloqueado: null,
          intentosFallidos: 0,
        },
      });

      // 💡 Opcional: también podés actualizar el objeto `user` en memoria si lo seguís usando abajo
      user.bloqueado = false;
      user.fechaBloqueado = null;
      user.intentosFallidos = 0;
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.usuario.update({
      where: { email },
      data: { codigoVerificacion: verificationCode },
    });
    // Consulta para obtener el código de verificación desde la base de datos
    const updatedUser = await prisma.usuario.findUnique({
      where: { email },
      select: { codigoVerificacion: true }, // Solo obtenemos el código de verificación
    });

    // Mostramos el código de verificación en la consola
    console.log('✅ Código de verificación actualizado:', updatedUser?.codigoVerificacion);

    await transporter.sendMail({
      from: 'rediboautos@gmail.com',
      to: email,
      subject: 'Recuperación de contraseña',
      text: `Tu código de recuperación es: ${verificationCode}`,
    });
    codeverifyController({ emailBD: email, codeBD: verificationCode });
    //res.json({ message: 'Datos enviados a controller2', verificationCode });
    getEmail(email); // Guardar el correo en la variable global
    res.json({ message: 'Datos enviados a controller 2 y controller3', verificationCode, email });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

