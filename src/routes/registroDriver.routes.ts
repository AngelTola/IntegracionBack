import { Router } from 'express';
import { registrarDriverController } from '@/controllers/authRegistroDriver/registroDriver.controller';
import { requireAuth } from '@/middlewares/authMiddleware';

const router = Router();

// Ruta protegida para registrar a un usuario como driver
router.post('/registro-driver', requireAuth, registrarDriverController);

export default router;
