import { Request, Response } from "express";
import { registrarHostCompleto } from "../../../services/auth/pago.service";
import { uploadToCloudinary } from "../../../services/auth/upload.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const registrarHostCompletoController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const usuario = req.user as { idUsuario: number };
    const {
      placa,
      soat,
      tipo,
      numeroTarjeta,
      fechaExpiracion,
      titular,
      detalles_metodo,
    } = req.body;

    const files = req.files as {
      imagenes?: Express.Multer.File[];
      qrImage?: Express.Multer.File[];
    };

    const imagenes = files?.imagenes || [];
    const qrFile = files?.qrImage?.[0];

    if (!placa || !soat || imagenes.length < 3) {
      res.status(400).json({ message: "Faltan datos del vehículo" });
      return;
    }

    const tipoFinal =
      tipo === "card"
        ? "TARJETA_DEBITO"
        : tipo === "QR"
        ? "QR"
        : tipo === "cash"
        ? "EFECTIVO"
        : null;

    if (!tipoFinal) {
      res.status(400).json({ message: "Tipo de método de pago inválido" });
      return;
    }

    // Validar que exista ubicación por defecto (idUbicacion = 1)
    const ubicacion = await prisma.ubicacion.findUnique({
      where: { idUbicacion: 1 },
    });
    if (!ubicacion) {
      res.status(400).json({ message: "Ubicación por defecto no encontrada" });
      return;
    }

    // Subir imágenes del vehículo
    const imagenesSubidas = await Promise.all(
      imagenes.map((file) => uploadToCloudinary(file))
    );

    // Subir imagen QR si se proporciona
    let imagenQr: string | undefined = undefined;
    if (qrFile) {
      imagenQr = await uploadToCloudinary(qrFile);
    }

    await registrarHostCompleto({
      idPropietario: usuario.idUsuario,
      placa,
      soat,
      imagenes: imagenesSubidas,
      tipo: tipoFinal,
      numeroTarjeta,
      fechaExpiracion,
      titular,
      imagenQr,
      detallesMetodoPago: detalles_metodo,
    });

    res.status(201).json({ success: true, message: "Registro host completo" });
  } catch (error) {
    console.error("❌ Error al registrar host:", error);
    res.status(500).json({ message: "Error al registrar host" });
  }
};

