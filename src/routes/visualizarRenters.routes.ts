import { Router } from "express";
import { getRentersAsignados } from "../controllers/authVisualizarListaRenters/visualizarRenters.controller";
import { authMiddleware } from "../middlewares/authMiddleware"; 

const router = Router();
//Define una ruta GET en "/driver/renters"
// Primero se ejecuta el middleware de autenticación
router.get("/driver/renters", authMiddleware, getRentersAsignados);


export default router;
