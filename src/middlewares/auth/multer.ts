//src/middlewares/auth/multer.ts
import multer from "multer";

// Usa almacenamiento en memoria para permitir subir a Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Máximo 5MB por archivo
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato inválido. Solo se permiten JPG o PNG."));
    }
  },
});

export default upload;