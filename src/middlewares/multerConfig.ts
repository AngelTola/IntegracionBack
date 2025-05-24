import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const usuario = req.user as { idUsuario: number };
    const tipo = req.body.tipo; // 'qr' o 'vehiculo'

    const folder = tipo === "qr" ? "qr" : "vehiculo";
    const dir = path.join("uploads", `usuario_${usuario.idUsuario}`, folder);

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
