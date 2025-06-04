//src/routes/auth/twofa.routes.ts
import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth/authMiddleware';
import { 
  handleEnviarCodigo, 
  handleVerificarCodigo, 
  handleDesactivar2FA, 
  handleVerifyLoginCode // AGREGAR ESTE IMPORT
} from '../../controllers/auth/authVerificacion2Pasos/twofa.routeHandlers';

import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/2fa/enviar', requireAuth, handleEnviarCodigo);
router.post('/2fa/verificar', requireAuth, handleVerificarCodigo);
router.post('/2fa/desactivar', requireAuth, handleDesactivar2FA);
router.post('/2fa/verificar-login', requireAuth, handleVerifyLoginCode); // NUEVA RUTA

export default router;