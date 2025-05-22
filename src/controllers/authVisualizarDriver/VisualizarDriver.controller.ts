import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/authDriverMiddleware"; // 👈 Asegúrate de usar la ruta correcta

const prisma = new PrismaClient();

export const getDriverProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const id_usuario = req.user?.id_usuario;

  if (!id_usuario) {
    res.status(401).json({ message: "No autorizado: token inválido o ausente" });
    return;
  }

  try {
    const driver = await prisma.driver.findUnique({
      where: { id_usuario },
      include: { usuario: true },
    });

    if (!driver) {
      res.status(404).json({ message: "Driver no encontrado" });
      return;
    }

    res.json(driver);
  } catch (error) {
    console.error("Error al obtener perfil del driver:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};
