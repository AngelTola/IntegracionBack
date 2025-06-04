//src/routes/auth/registroHost.routes.ts
import express from 'express';
import { registrarHostCompletoController } from '../../controllers/auth/authRegistroHost/registroHost.controller';
import { requireAuth } from '../../middlewares/auth/authMiddleware';
import upload from '../../middlewares/auth/multer'; // ✅ actualizado con tu multer real

const router = express.Router();

router.post(
  '/registro-host',
  requireAuth,
  upload.fields([
    { name: 'imagenes', maxCount: 6 },
    { name: 'qrImage', maxCount: 1 },
  ]),
  registrarHostCompletoController
);

export default router;
