import { Router } from 'express';
import {
  filtrarVehiculos,
} from '../../controllers/speedcode/filtroMapaController';
import { autocompletarAeropuerto } from '../../controllers/speedcode/filtroAeropuertoController';
import { listarReservasAprobadas, getDetalleReserva } from "../../controllers/speedcode/reservasAprobadasController";
import { getTopAutos } from '../../controllers/speedcode/topAutosController';


const router = Router();

router.get('/filtroMapaPrecio', filtrarVehiculos);
router.get('/autocompletar/aeropuerto', autocompletarAeropuerto);
router.get("/reservas/aprobadas", listarReservasAprobadas);

//para mostrar detalle de reserva
router.get("/reservas/:id", getDetalleReserva);

//para el carrousel
router.get('/autos-top', getTopAutos);

export default router;