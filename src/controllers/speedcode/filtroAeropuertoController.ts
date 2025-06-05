
import { Request, Response } from 'express';
import { autocompletarAeropuertoService } from '../../services/speedcode/filtroAeropuertoService';

export const autocompletarAeropuerto = async (req: Request, res: Response): Promise<any> => {
  const { q } = req.query;

  if (typeof q !== 'string' || q.trim() === '') {
    res.status(400).json({ mensaje: 'Debe ingresar un nombre para buscar.' });
    return;
  }

  try {
    const resultados = await autocompletarAeropuertoService(q.trim());

    if (resultados.length === 0) {
      res.status(404).json({ mensaje: 'No se encontraron resultados.' });
      return;
    }

    res.json(resultados);
  } catch (error) {
    console.error('Error al buscar ubicaciones tipo aeropuerto:', error);
    res.status(500).json({ mensaje: 'Error del servidor al buscar aeropuertos.' });
  }
};
