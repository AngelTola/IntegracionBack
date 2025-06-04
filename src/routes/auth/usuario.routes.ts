//src/routes/auth/usuario.routes.ts
import { Router } from 'express';
import { obtenerRentersDisponibles } from '../../controllers/auth/authRegistroDriver/usuario.controller';

const router = Router();

router.get('/usuarios/renters', obtenerRentersDisponibles);

export default router;
