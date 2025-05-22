import { Request, Response } from 'express';
import { registrarDriverCompleto } from '@/services/registroDriver.service';

export const registrarDriverController = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sexo,
      telefono,
      nro_licencia,
      categoria,
      fecha_emision,
      fecha_vencimiento,
      anversoUrl,
      reversoUrl,
      rentersIds
    } = req.body;

    if (!Array.isArray(rentersIds) || rentersIds.length === 0) {
      res.status(400).json({ message: 'Debes seleccionar al menos un renter' });
      console.log("🔴 Respuesta del backend:", res.status);
      return;
    }

    const usuario = req.user;
      if (
        !usuario ||
        typeof usuario !== "object" ||
        !("id_usuario" in usuario)
      ) {
        console.error("Usuario no autenticado o inválido:", usuario);
        console.log("🔴 Respuesta del backend:", res.status);
        return ;
      }


    await registrarDriverCompleto({
      id_usuario: Number((usuario as any).id_usuario),
      sexo,
      telefono,
      nro_licencia,
      categoria,
      fecha_emision: new Date(fecha_emision),
      fecha_vencimiento: new Date(fecha_vencimiento),
      anversoUrl,
      reversoUrl,
      rentersIds
    });

    res.status(201).json({ message: 'Registro de driver exitoso' });

  } catch (error) {
    console.error('Error en registrarDriverController:', error);
    res.status(500).json({ message: 'Error al registrar driver', error: String(error) });
    console.log("🔴 Respuesta del backend:", res.status);
  }
};
