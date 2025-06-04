//src/routes/auth/listaDrivers.routes.ts
import { Router } from 'express';
import { getDriversByRenter } from '../../controllers/auth/listaDrivers/listaDrivers.controller';
import { requireAuth } from '../../middlewares/auth/authMiddleware';

const router = Router();

router.get('/drivers-by-renter', requireAuth, (req, res, next) => {
  Promise.resolve(getDriversByRenter(req, res)).catch(next);
});

export default router;
