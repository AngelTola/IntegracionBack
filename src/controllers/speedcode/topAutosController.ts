import { Request, Response } from 'express';
import { obtenerTopAutos } from '../../services/speedcode/topAutosService';

export const getTopAutos = async (req: Request, res: Response): Promise<any> => {
  try {
    const autos = await obtenerTopAutos();
    res.status(200).json(autos);
  } catch (error) {
    console.error('Error al obtener los autos con mejor calificados:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
