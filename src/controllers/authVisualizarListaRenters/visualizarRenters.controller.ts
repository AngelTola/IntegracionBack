import { Request, Response } from "express";
import { obtenerRentersDeDriver } from "../../services/visualizarRenters.service";

export const getRentersAsignados = async (req: Request, res: Response) => {
  try {
    // El idUsuario debe venir del middleware de autenticación (JWT decodificado)
    const idUsuario = (req as any).user?.idUsuario;

    if (!idUsuario) {
      return res.status(401).json({ message: "Usuario no autenticado." });
    }

    const renters = await obtenerRentersDeDriver(idUsuario);
    return res.status(200).json(renters);
  } catch (error: any) {
    console.error("❌ Error al obtener renters asignados:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};
