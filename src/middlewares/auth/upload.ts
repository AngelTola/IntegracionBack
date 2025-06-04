//src/middlewares/auth/upload.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ✅ Función para sanitizar nombre de usuario
const sanitize = (name: string) => {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-zA-Z0-9]/g, "_");
};

// ✅ Configuración de almacenamiento dinámica
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const user = req.user as { idUsuario: number; nombreCompleto: string };
    const nombreSanitizado = sanitize(user.nombreCompleto);
    
    // Usa el campo del archivo para determinar la carpeta
    const tipo = file.fieldname === 'qrImage' ? 'QR' : 'vehiculo';

    const dir = path.join('uploads', `usuario_${user.idUsuario}_${nombreSanitizado}`, tipo);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// ✅ Filtro de tipos de archivo
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagen inválido'));
  }
};

// ✅ Exporta la instancia lista para .fields()
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por archivo
});

export default upload;



