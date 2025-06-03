import { Router } from 'express';
import {
  filtrarVehiculos,
} from '../controllers/filtroMapaPrecioController';
import { autocompletarAeropuerto } from '../controllers/filtroAeropuertoController';

const router = Router();

router.get('/filtroMapaPrecio', filtrarVehiculos);
router.get('/autocompletar-aeropuerto', autocompletarAeropuerto);

export default router;