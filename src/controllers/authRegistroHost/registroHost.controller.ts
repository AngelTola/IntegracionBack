import { Request, Response } from "express";
import { registrarHostCompleto } from "@/services/pago.service";

export const registrarHostCompletoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuario = req.user as { id_usuario: number };
    const {
      placa,
      soat,
      tipo,
      numero_tarjeta,
      fecha_expiracion,
      titular,
      detalles_metodo,
    } = req.body;

    const imagenes = (req.files as any).imagenes || [];
    const qrImage = (req.files as any).qrImage?.[0];

    if (!placa || !soat || imagenes.length < 3) {
      res.status(400).json({ message: "Faltan datos del vehículo" });
      return;
    }

    const tipoFinal =
      tipo === "card" ? "tarjeta" : tipo === "qr" ? "qr" : tipo === "cash" ? "efectivo" : null;

    if (!tipoFinal) {
      res.status(400).json({ message: "Tipo de método de pago inválido" });
      return;
    }

    await registrarHostCompleto({
      id_usuario: usuario.id_usuario,
      placa,
      soat,
      imagenes: imagenes.map((f: any) => f.filename),
      tipo: tipoFinal,
      numero_tarjeta,
      fecha_expiracion,
      titular,
      imagen_qr: qrImage?.filename,
      detalles_metodo_pago: detalles_metodo,
    });

    // ✅ No retornes res.status(...), simplemente termina con void
    res.status(201).json({ success: true, message: "Registro host completo" });
  } catch (error) {
    console.error("❌ Error al registrar host:", error);
    res.status(500).json({ message: "Error al registrar host" });
  }
};

