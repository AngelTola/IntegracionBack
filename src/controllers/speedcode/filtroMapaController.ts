import { Request, Response } from 'express';
import {
  filtrarVehiculos as filtrarVehiculosService,
} from '../../services/speedcode/filtroMapaService';

export const filtrarVehiculos = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      texto,
      fechaInicio,
      fechaFin,
      lat,
      lng,
      dkm,
      precioMin,
      precioMax,
    } = req.query;

    const vehiculos = await filtrarVehiculosService({
      texto: texto?.toString(),
      fechaInicio: fechaInicio ? new Date(fechaInicio.toString()) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin.toString()) : undefined,
      lat: lat ? parseFloat(lat.toString()) : undefined,
      lng: lng ? parseFloat(lng.toString()) : undefined,
      dkm: dkm ? parseFloat(dkm.toString()) : 5,
      precioMin: precioMin ? parseFloat(precioMin.toString()) : undefined,
      precioMax: precioMax ? parseFloat(precioMax.toString()) : undefined,
    });

    return res.status(200).json({ vehiculos });
  } catch (error: any) {
    console.error(error);
    return res.status(error.status || 500).json({
      error: error.message || 'Error interno del servidor',
    });
  }
};