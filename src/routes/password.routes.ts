import { Router } from 'express';
import { recoverPassword } from '../controllers/password.controller';
import { verifyCode } from '../controllers/verifyCodeController';
import { resetPassword } from '../controllers/resetPasswordController';

const router = Router();

router.post('/recover-password', recoverPassword);
router.post('/verify-code', verifyCode);
router.post('/reset-password', resetPassword);

export default router;

