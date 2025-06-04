import { Router } from 'express';
import {
  filtrarVehiculos,
} from '../controllers/filtroMapaPrecioController';
import { autocompletarAeropuerto } from '../controllers/filtroAeropuertoController';
import { listarReservasAprobadas, mostrarReservaPorId } from "../controllers/reservasAprobadasController";
const router = Router();

router.get('/filtroMapaPrecio', filtrarVehiculos);
router.get('/autocompletar/aeropuerto', autocompletarAeropuerto);
router.get("/reservas/aprobadas", listarReservasAprobadas);
router.get("/reservas/:id", mostrarReservaPorId);
export default router;