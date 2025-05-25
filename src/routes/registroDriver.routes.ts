import { Router } from 'express';
import { registrarDriverController } from '../controllers/authRegistroDriver/registroDriver.controller';
/* import { requireAuth } from '../middlewares/authMiddleware'; */
import { isAuthenticated } from "../middlewares/isAuthenticated";

const router = Router();

// Ruta protegida para registrar a un usuario como driver
router.post('/registro-driver', isAuthenticated, registrarDriverController);

export default router;
