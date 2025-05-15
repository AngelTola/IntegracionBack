import { PrismaClient } from '@prisma/client';
import { Request, Response } from "express";
import * as authService from "@/services/auth.service";
import { generateToken } from '@/utils/generateToken';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { updateGoogleProfile as updateGoogleProfileService } from "../services/auth.service";

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  const { nombre_completo, email, contraseña, fecha_nacimiento, telefono } =
    req.body;

  try {
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      return res
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

    return res
      .status(201)
      .json({
        message: "Usuario registrado exitosamente",
        user: { email: newUser.email },
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

export const updateGoogleProfile = async (req: Request, res: Response) => {
  const { nombre_completo, fecha_nacimiento } = req.body;
  const email = (req.user as { email: string }).email;

  if (!email) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  try {
    const updatedUser = await authService.updateGoogleProfile(email, nombre_completo, fecha_nacimiento);
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

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await authService.findUserByEmail(email);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Correo ingresado no se encuentra en el sistema." });
    }

    const isValid = await authService.validatePassword(password, user.contraseña ?? "");

    if (!isValid) {
      return res.status(401).json({ message: "Los datos no son válidos" });
    }

    const token = generateToken({
      id_usuario: user.id_usuario,
      email: user.email,
      nombre_completo: user.nombre_completo
    });
    return res.json({
      message: "Login exitoso",
      token,
      user: {
        email: user.email,
        nombre_completo: user.nombre_completo
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const me = async (req: Request, res: Response) => {
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
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Error en /me:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Formato de imagen no válido. Usa PNG.'));
    }
    cb(null, true);
  }
});

export const uploadProfilePhoto = async (req: Request, res: Response) => {
  const { id_usuario } = req.user as { id_usuario: number };

  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ninguna imagen.' });
  }

  const imagePath = `/uploads/${req.file.filename}`;

  try {
    await prisma.usuario.update({
      where: { id_usuario },
      data: { foto_perfil: imagePath },
    });

    return res.json({
      message: 'Foto de perfil actualizada exitosamente.',
      foto_perfil: imagePath
    });
  } catch (error) {
    console.error('Error al guardar la foto de perfil:', error);
    return res.status(500).json({ message: 'Error al actualizar la foto de perfil.' });
  }
};
//eliminar foto de perfil
export const deleteProfilePhoto = async (req: Request, res: Response) => {
  const { id_usuario } = req.user as { id_usuario: number };

  try {
    const user = await prisma.usuario.findUnique({
      where: { id_usuario },
      select: { foto_perfil: true }
    });

    if (!user || !user.foto_perfil) {
      return res.status(400).json({ message: 'No hay foto para eliminar.' });
    }

    const filePath = path.join(__dirname, '../../', user.foto_perfil);

    // ✅ 1. Elimina la foto física si existe
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error eliminando el archivo:', err);
        // No hacemos fail solo por esto, seguimos.
      } else {
        console.log('✅ Foto eliminada del servidor:', filePath);
      }
    });

    // ✅ 2. Borra la referencia en la base de datos
    await prisma.usuario.update({
      where: { id_usuario },
      data: { foto_perfil: null },
    });

    return res.json({ message: 'Foto de perfil eliminada exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar la foto de perfil:', error);
    return res.status(500).json({ message: 'Error al eliminar la foto.' });
  }
};

export const updateUserField = async (req: Request, res: Response) => {
  const { campo, valor } = req.body;
  const { id_usuario } = req.user as { id_usuario: number };

  if (!campo || !valor) {
    return res.status(400).json({ message: 'Campo y valor son obligatorios.' });
  }

  const camposPermitidos = ['nombre_completo', 'telefono'];

  if (!camposPermitidos.includes(campo)) {
    return res.status(400).json({ message: 'Campo no permitido.' });
  }

  if (campo === 'nombre_completo') {
    if (typeof valor !== 'string' || valor.length < 3 || valor.length > 50) {
      return res.status(400).json({ message: "El nombre debe tener entre 3 y 50 caracteres." });
    }
    const soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    if (!soloLetrasRegex.test(valor)) {
      return res.status(400).json({ message: "El nombre solo puede contener letras y espacios." });
    }
    if (/\s{2,}/.test(valor)) {
      return res.status(400).json({ message: "El nombre no debe tener más de un espacio consecutivo." });
    }
    if (/^\s|\s$/.test(valor)) {
      return res.status(400).json({ message: "El nombre no debe comenzar ni terminar con espacios." });
    }
  }

  if (campo === 'telefono') {
    const telefonoStr = valor.toString();

    // ✅ Nueva validación añadida aquí
    if (!/^[0-9]*$/.test(telefonoStr)) {
      return res.status(400).json({ message: "Formato inválido, ingrese solo números." });
    }

    if (!/^[0-9]{8}$/.test(telefonoStr)) {
      return res.status(400).json({ message: "El teléfono debe ser un número de 8 dígitos." });
    }

    if (!/^[67]/.test(telefonoStr)) {
      return res.status(400).json({ message: "El teléfono debe comenzar con 6 o 7." });
    }
  }

  try {
    const updatedUser = await prisma.usuario.update({
      where: { id_usuario },
      data: {
        [campo]: campo === 'telefono' ? parseInt(valor, 10) : valor,
      },
    });

    return res.json({
      message: `${campo === 'nombre_completo' ? 'Nombre' : 'Teléfono'} actualizado correctamente`,
      user: {
        id_usuario: updatedUser.id_usuario,
        [campo]: (updatedUser as any)[campo],
      },
    });
  } catch (error) {
    console.error('Error al actualizar campo:', error);
    return res.status(500).json({ message: 'Error al actualizar el campo.' });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  const id_usuario = Number(req.params.id_usuario);

  if (isNaN(id_usuario)) {
    return res.status(400).json({ message: 'ID de usuario inválido' });
  }

  try {
    const user = await authService.getUserById(id_usuario);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      id_usuario: user.id_usuario,
      nombre_completo: user.nombre_completo,
      email: user.email,
      telefono: user.telefono,
      fecha_nacimiento: user.fecha_nacimiento,
    });
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const checkPhoneExists = async (req: Request, res: Response) => {
  const { telefono } = req.body;

  if (!telefono) {
    return res.status(400).json({ message: "Teléfono no proporcionado" });
  }

  try {
    const user = await authService.findUserByPhone(telefono);
    if (user) {
      return res.json({ exists: true });
    }
    return res.json({ exists: false });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};















/*import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

import bcrypt from 'bcryptjs'; // 👈 Importar bcrypt

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  const { nombre_completo, email, contraseña, fecha_nacimiento, telefono} = req.body;
  

  try {

    if (!nombre_completo || !email || !contraseña || !fecha_nacimiento) {
      return res.status(400).json({ message: "Todos los campos obligatorios deben estar completos." });
    }

    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "El correo electrónico ya está registrado." });
    }

    // 🔒 ENCRIPTAR LA CONTRASEÑA AQUÍ
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contraseña, salt);

    // 🔥 GUARDAR LA CONTRASEÑA ENCRIPTADA
    const newUser = await prisma.usuario.create({
      data: {
        nombre_completo,
        email,
        contraseña: hashedPassword, // 👈 Aquí guardamos la contraseña encriptada
        fecha_nacimiento: new Date(fecha_nacimiento),
        telefono: telefono ? Number(telefono) : null,
        registrado_con: "email",
        verificado: false,
        host: false,
        driver: false,
      },
    });

    return res.status(201).json({ message: "Usuario registrado exitosamente", user: { email: newUser.email } });
  }catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};*/