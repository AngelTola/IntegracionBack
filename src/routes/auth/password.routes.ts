//src/routes/auth/password.routes.ts
import { Router } from 'express';
import { recoverPassword } from '../../controllers/auth/authRecuperarContraseña/password.controller';
import { verifyCode } from '../../controllers/auth/authRecuperarContraseña/verifyCodeController';
import { resetPassword } from '../../controllers/auth/authRecuperarContraseña/resetPasswordController';

const router = Router();

router.post('/recover-password', recoverPassword);
router.post('/verify-code', verifyCode);
router.post('/reset-password', resetPassword);

export default router;

