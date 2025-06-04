import { Request, Response } from "express";
import { obtenerRentersDeDriver } from "../../../services/auth/visualizarRenters.service";

export const getRentersAsignados = async (req: Request, res: Response): Promise<void> => {
  try {
    const idUsuario = (req as any).user?.idUsuario;

    if (!idUsuario) {
       res.status(401).json({ message: "Usuario no autenticado." });
    }

    const renters = await obtenerRentersDeDriver(idUsuario);
     res.status(200).json(renters);
  } catch (error: any) {
    console.error("❌ Error al obtener renters asignados:", error.message);
     res.status(500).json({ message: "Error interno del servidor." });
  }
};
