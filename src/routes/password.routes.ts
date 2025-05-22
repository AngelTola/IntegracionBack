import { Router } from 'express';
import { recoverPassword } from '../controllers/authRecuperarContraseña/password.controller';
import { verifyCode } from '../controllers/authRecuperarContraseña/verifyCodeController';
import { resetPassword } from '../controllers/authRecuperarContraseña/resetPasswordController';

const router = Router();

router.post('/recover-password', recoverPassword);
router.post('/verify-code', verifyCode);
router.post('/reset-password', resetPassword);

export default router;

