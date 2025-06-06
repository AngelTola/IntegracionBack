import { Router } from "express";
import { getAutos, getAutoId, getComentarios, getHost, getDrivers, getUsuarioId,
    getAutosDisponiblesPorFecha, getUsuarios, getCalificacionesHost, getHostSinFiltroFechas
} from "../../controllers/qantastic/auto.controller";
const router = Router();

router.get('/autos', getAutos);
router.get('/autos/:id', getAutoId);
router.get('/autos/:id/comentarios', getComentarios);
router.get('/autos/:id/host', getHost);
router.get('/autosDisponibles/:inicio/:fin', getAutosDisponiblesPorFecha);
router.get('/drivers/:id', getDrivers);
router.get('/usuarios', getUsuarios);
router.get('/host/:id', getCalificacionesHost);
router.get('/usuario/:id', getUsuarioId);
router.get('/hosts/:id', getHostSinFiltroFechas)

export default router;