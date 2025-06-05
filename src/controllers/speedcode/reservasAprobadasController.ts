import { Request, Response } from "express";
import { obtenerReservasAprobadas, obtenerDetalleReserva} from "../../services/speedcode/reservasAprobadasService";

export const listarReservasAprobadas = async (_req: Request, res: Response): Promise<any> => {
  try {
    const reservas = await obtenerReservasAprobadas();
    res.status(200).json(reservas);
  } catch (error) {
    console.error("Error al obtener reservas aprobadas:", error);
    res.status(500).json({ error: "Error al obtener reservas aprobadas" });
  }
};

export const getDetalleReserva = async (req: Request, res: Response): Promise<any> => {
  const idReserva = parseInt(req.params.id);

  if (isNaN(idReserva)) {
    return res.status(400).json({ message: 'ID de reserva inválido' });
  }

  try {
    const detalle = await obtenerDetalleReserva(idReserva);
    res.status(200).json(detalle);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener la reserva' });
  }
};
