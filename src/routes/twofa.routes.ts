import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { handleEnviarCodigo, handleVerificarCodigo } from '../controllers/authVerificacion2Pasos/twofa.routeHandlers';

const router = Router();

router.post('/2fa/enviar', requireAuth, handleEnviarCodigo);
router.post('/2fa/verificar', requireAuth, handleVerificarCodigo);

export default router;