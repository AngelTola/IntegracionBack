//src/routes/auth/registroDriver.routes.ts
import { Router } from 'express';
import { registrarDriverController } from '../../controllers/auth/authRegistroDriver/registroDriver.controller';
/* import { requireAuth } from '../middlewares/authMiddleware'; */
import { isAuthenticated } from "../../middlewares/auth/isAuthenticated";

const router = Router();

// Ruta protegida para registrar a un usuario como driver
router.post('/registro-driver', isAuthenticated, registrarDriverController);

export default router;
