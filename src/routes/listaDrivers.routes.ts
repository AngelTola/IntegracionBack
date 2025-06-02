import { Router } from 'express';
import { getDriversByRenter } from '../controllers/listaDrivers/listaDrivers.controller';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/drivers-by-renter', requireAuth, (req, res, next) => {
  Promise.resolve(getDriversByRenter(req, res)).catch(next);
});

export default router;
