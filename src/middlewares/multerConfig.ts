import multer from "multer";
import path from "path";
import fs from "fs";

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const usuario = req.user as { id_usuario: number };
    const tipo = req.body.tipo; // 'qr' o 'vehiculo'

    const folder = tipo === "qr" ? "qr" : "vehiculo";
    const dir = path.join("uploads", `usuario_${usuario.id_usuario}`, folder);

    // Crear la carpeta si no existe
    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}${ext}`;
    cb(null, filename);
  },
});

export const upload = multer({ storage });
