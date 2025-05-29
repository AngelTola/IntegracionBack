//
import { Request, Response } from "express";
import { registrarHostCompleto } from "../../services/pago.service";
import { uploadToCloudinary } from "../../services/upload.service"; // ⬅ nuevo import

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
    // ⬇ Subida de imágenes del vehículo a Cloudinary
    const imagenesSubidas = await Promise.all(
      imagenes.map((file) => uploadToCloudinary(file))
    );

    // ⬇ Subida de imagen QR si existe
    let imagenQr: string | undefined = undefined;
    if (qrFile) {
      imagenQr = await uploadToCloudinary(qrFile);
    }

    // ⬇ Registrar en BD usando servicio existente
    await registrarHostCompleto({
      idUsuario: usuario.idUsuario,
      placa,
      soat,
      imagenes: imagenesSubidas, // ahora son URLs, no filenames
      tipo: tipoFinal,
      numeroTarjeta,
      fechaExpiracion,
      titular,
      imagenQr,
      detallesMetodoPago: detalles_metodo,
    });

    // ✅ No retornes res.status(...), simplemente termina con void
    res.status(201).json({ success: true, message: "Registro host completo" });
  } catch (error) {
    console.error("❌ Error al registrar host:", error);
    res.status(500).json({ message: "Error al registrar host" });
  }
};
