import { Request, Response } from "express";
import { obtenerReservasAprobadas, obtenerReservaPorId  } from "../services/reservasAprobadasService";

export const listarReservasAprobadas = async (_req: Request, res: Response): Promise<any> => {
  try {
    const reservas = await obtenerReservasAprobadas();
    res.status(200).json(reservas);
  } catch (error) {
    console.error("Error al obtener reservas aprobadas:", error);
    res.status(500).json({ error: "Error al obtener reservas aprobadas" });
  }
};

export const mostrarReservaPorId = async (req: Request, res: Response): Promise<any> => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const reserva = await obtenerReservaPorId(id);
    if (!reserva) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }
    res.status(200).json(reserva);
  } catch (error) {
    console.error("Error al obtener la reserva:", error);
    res.status(500).json({ error: "Error al obtener la reserva" });
  }
};