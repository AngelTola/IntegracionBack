import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const findUserByEmail = async (email: string) => {
  return prisma.usuario.findUnique({ where: { email } });
};

export const createUser = async (data: {
  nombre_completo: string;
  email: string;
  contraseña: string;
  fecha_nacimiento: string;
  telefono?: number | null;
}) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.contraseña, salt);

  return prisma.usuario.create({
    data: {
      nombre_completo: data.nombre_completo,
      email: data.email,
      contraseña: hashedPassword,
      fecha_nacimiento: new Date(data.fecha_nacimiento),
      telefono: data.telefono ?? null,
      registrado_con: "email",
      verificado: false,
      host: false,
      //driver: false,
    },
  });
};

export const updateGoogleProfile = async (
  email: string,
  nombre_completo: string,
  fecha_nacimiento: string,
  telefono?: string // ✅ nuevo campo opcional
) => {

  const existingUser = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existingUser && existingUser.registrado_con === "email") {
    throw new Error("Este correo ya está registrado con email");
  }

  const updatedUser = await prisma.usuario.update({
    where: { email },
    data: {
      nombre_completo,
      fecha_nacimiento: new Date(fecha_nacimiento),
      telefono: telefono ? parseInt(telefono) : undefined, // ✅ lo guarda
    },
  });

  return updatedUser;
};

export const validatePassword = async (
  inputPassword: string,
  hashedPassword: string
) => {
  return bcrypt.compare(inputPassword, hashedPassword);
};

export const getUserById = async (id_usuario: number) => {
  return await prisma.usuario.findUnique({
    where: { id_usuario }, // Asegúrate que en Prisma el campo se llame id_usuario
    select: { // Evita traer la contraseña u otros campos sensibles
      id_usuario: true,
      nombre_completo: true,
      email: true,
      telefono: true,
      fecha_nacimiento: true,
    },
  });
};
export const createUserWithGoogle = async (email: string, name: string) => {
  return prisma.usuario.create({
    data: {
      email,
      nombre_completo: name,
      registrado_con: "google",
      verificado: true,
    },
  });
};

export const findOrCreateGoogleUser = async (email: string, name: string) => {
  console.log("📨 Buscando usuario por email:", email);
  const existingUser = await prisma.usuario.findUnique({ where: { email } });

  if (existingUser) {
    console.log("👤 Usuario encontrado:", {
      email: existingUser.email,
      registrado_con: existingUser.registrado_con,
    });
    if (existingUser.registrado_con === "email") {
      console.warn("⚠️ Ya registrado manualmente, lanzando error especial");
      const error: any = new Error("Este correo ya está registrado con email.");
      error.name = "EmailAlreadyRegistered";
      throw error;
    }
    console.log("✅ Usuario ya registrado con Google, retornando");
    return { user: existingUser, isNew: false };
  }

  console.log("🆕 Usuario no existe, creando uno nuevo con Google");
  const newUser = await prisma.usuario.create({
    data: {
      email,
      nombre_completo: name,
      registrado_con: "google",
      verificado: true,
    },
  });
};

export const findUserByPhone = async (telefono: number) => {
  return prisma.usuario.findFirst({ where: { telefono } });
};
