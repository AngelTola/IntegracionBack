import { PrismaClient, Usuario } from '@prisma/client';
import { Request, Response } from "express";
import * as authService from "@/services/auth.service";
//Ingreso de token
import { generateToken } from '@/utils/generateToken';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { updateGoogleProfile as updateGoogleProfileService } from "../services/auth.service";

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response): Promise<void> => {
  const { nombre_completo, email, contraseña, fecha_nacimiento, telefono } =
    req.body;

  try {
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
       res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado." });
    }

    const newUser = await authService.createUser({
      nombre_completo,
      email,
      contraseña,
      fecha_nacimiento,
      telefono,
    });

     res
      .status(201)
      .json({
        message: "Usuario registrado exitosamente",
        user: { email: newUser.email },
      });
  } catch (error) {
    console.error(error);
     res.status(500).json({ message: "Error en el servidor" });
  }
};

export const updateGoogleProfile = async (req: Request, res: Response): Promise<void> => {
  const { nombre_completo, fecha_nacimiento } = req.body;
  const email = (req.user as { email: string }).email;
  //const email = req.user?.email;

  if (!email) {
     res.status(401).json({ message: "Usuario no autenticado" });
  }

  try {
    const updatedUser = await authService.updateGoogleProfile(email, nombre_completo, fecha_nacimiento,
      telefono);
    res.json({
      message: "Perfil actualizado correctamente",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error al actualizar perfil:", error);
    res.status(400).json({
      message:
        error.message || "No se pudo actualizar el perfil con Google",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await authService.findUserByEmail(email);

    if (!user) {
      res.status(401).json({ message: "Correo ingresado no se encuentra en el sistema." });
      return;
    }

    const isValid = await authService.validatePassword(password, user.contraseña ?? "");

    if (!isValid) {
      res.status(401).json({ message: "Los datos no son válidos" });
      return;
    }

    //Token
    const token = generateToken({
      id_usuario: user.id_usuario,
      email: user.email,
      nombre_completo: user.nombre_completo
    });

    res.json({
      message: "Login exitoso",
      token,
      user: {
        email: user.email,
        nombre_completo: user.nombre_completo
      }
    });
    //Cambios por si no funciona lo que implemente
    //return res.json({ message: "Login exitoso", user: { email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};


export const me = async (req: Request, res: Response): Promise<void> => {
  const { id_usuario } = req.user as { id_usuario: number };

  try {
    const user = await prisma.usuario.findUnique({
      where: { id_usuario },
      select: {
        id_usuario: true,
        nombre_completo: true,
        email: true,
        telefono: true,
        fecha_nacimiento: true,
        foto_perfil: true,

        ediciones_nombre: true,
        ediciones_telefono: true,
        ediciones_fecha: true,
        driverBool: true,
        host: true,
      },
    });

    if (!user) {
       res.status(404).json({ message: 'Usuario no encontrado' });
    }

     res.json({ user }); // 🔥 Ahora manda todos los datos al frontend
  } catch (error) {
    console.error('Error en /me:', error);
     res.status(500).json({ message: 'Error en el servidor' });
  }
};


export const updateUserField = async (req: Request, res: Response) => {
  const { campo, valor }: { campo: CampoEditable; valor: string } = req.body;
  const { id_usuario } = req.user as { id_usuario: number };

  if (!campo || !valor) {
     res.status(400).json({ message: 'Campo y valor son obligatorios.' });
  }

  const camposPermitidos = ['nombre_completo', 'telefono', 'fecha_nacimiento'] as const;
  type CampoEditable = typeof camposPermitidos[number];
  if (!camposPermitidos.includes(campo)) {
     res.status(400).json({ message: 'Campo no permitido.' });
  }

  const campoContadorMap: Record<CampoEditable, keyof Usuario> = {
    nombre_completo: 'ediciones_nombre',
    telefono: 'ediciones_telefono',
    fecha_nacimiento: 'ediciones_fecha',
  };
  const campoContador = campoContadorMap[campo];

  try {
    const user = await prisma.usuario.findUnique({
      where: { id_usuario },
      select: {
        [campo]: true,
        [campoContador]: true,
      },
    }) as any;

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user[campoContador] >= 3) {
       res.status(403).json({ message: 'Has alcanzado el límite de 3 ediciones para este campo. Para más cambios, contacta al soporte.' });
    }

    const valorActual = user[campo];
    const nuevoValor = campo === 'telefono' ? parseInt(valor, 10) : campo === 'fecha_nacimiento' ? new Date(valor) : valor;

    if (valorActual?.toString() === nuevoValor?.toString()) {
      res.status(200).json({
        message: 'No hubo cambios en el valor.',
        edicionesRestantes: 3 - user[campoContador]
      });
    }

    // Validaciones personalizadas
    if (campo === 'nombre_completo') {
      if (typeof valor !== 'string' || valor.length < 3 || valor.length > 50) {
        res.status(400).json({ message: 'El nombre debe tener entre 3 y 50 caracteres.' });
      }
      const soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
      if (!soloLetrasRegex.test(valor)) {
         res.status(400).json({ message: 'El nombre solo puede contener letras y espacios.' });
      }
      if (/\s{2,}/.test(valor)) {
         res.status(400).json({ message: 'El nombre no debe tener más de un espacio consecutivo.' });
      }
      if (/^\s|\s$/.test(valor)) {
         res.status(400).json({ message: 'El nombre no debe comenzar ni terminar con espacios.' });
      }
    }

    if (campo === 'telefono') {
      const telefonoStr = valor.toString();
      if (!/^[0-9]*$/.test(telefonoStr)) {
        res.status(400).json({ message: 'Formato inválido, ingrese solo números.' });
      }
      if (!/^[0-9]{8}$/.test(telefonoStr)) {
         res.status(400).json({ message: 'El teléfono debe ser un número de 8 dígitos.' });
      }
      if (!/^[67]/.test(telefonoStr)) {
         res.status(400).json({ message: 'El teléfono debe comenzar con 6 o 7.' });
    }

    if (campo === 'fecha_nacimiento') {
      const fechaValida = Date.parse(valor);
      if (isNaN(fechaValida)) {
        res.status(400).json({ message: 'Fecha inválida.' });
      }
    }

    const updatedUser = await prisma.usuario.update({
      where: { id_usuario },
      data: {
        [campo]: nuevoValor,
        [campoContador]: { increment: 1 },
      },
    });

    const edicionesRestantes = 2 - user[campoContador];
    let infoExtra = '';
    if (edicionesRestantes === 1) {
      infoExtra = 'Último intento: esta es tu última oportunidad para editar este campo.';
    } else if (edicionesRestantes === 0) {
      infoExtra = 'Has alcanzado el límite de 3 ediciones para este campo. Para más cambios, contacta al soporte.';
    }

    res.json({
      message: `$${
        campo === 'nombre_completo' ? 'Nombre' :
        campo === 'telefono' ? 'Teléfono' :
        'Fecha de nacimiento'
      } actualizado correctamente`,
      edicionesRestantes,
      infoExtra,
      user: {
        id_usuario: updatedUser.id_usuario,
        [campo]: updatedUser[campo],
        [campoContador]: updatedUser[campoContador],
      },
    });
  } catch (error) {
    console.error('Error al actualizar campo:', error);
     res.status(500).json({ message: 'Error al actualizar el campo.' });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  const id_usuario = Number(req.params.id_usuario); // Aseguramos que sea número

  if (isNaN(id_usuario)) {
    res.status(400).json({ message: 'ID de usuario inválido' });
    return;
  }

  try {
    const user = await authService.getUserById(id_usuario); // Usamos el servicio

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.status(200).json({
      id_usuario: user.id_usuario,
      nombre_completo: user.nombre_completo,
      email: user.email,
      telefono: user.telefono,
      fecha_nacimiento: user.fecha_nacimiento,
    });
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const deleteIncompleteUserController = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
     res.status(400).json({ message: "Falta el email" });
  }

  try {
    const user = await prisma.usuario.findUnique({ where: { email } });

    if (!user) {
       res.status(404).json({ message: "Usuario no encontrado" });
       return;
    }

    if (user.verificado) {
       res.status(400).json({ message: "El usuario ya fue verificado, no se puede eliminar" });
    }

    await prisma.usuario.delete({ where: { email } });

     res.status(200).json({ message: "Usuario eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar usuario incompleto:", error);
     res.status(500).json({ message: "Error interno del servidor" });
  }
}; 
export const checkPhoneExists = async (req: Request, res: Response): Promise<void> => {
  const { telefono } = req.body;

  if (!telefono) {
     res.status(400).json({ message: "Teléfono no proporcionado" });
  }

  try {
    const user = await authService.findUserByPhone(telefono);
    if (user) {
       res.json({ exists: true });
       return;
    }
     res.json({ exists: false });
  } catch (error) {
    console.error(error);
     res.status(500).json({ message: "Error en el servidor" });
  }
};