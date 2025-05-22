import { Router } from 'express';
import { obtenerRentersDisponibles } from '@/controllers/authRegistroDriver/usuario.controller';

const router = Router();

router.get('/usuarios/renters', obtenerRentersDisponibles);

export default router;
