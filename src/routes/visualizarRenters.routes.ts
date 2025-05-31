import { Router } from "express";
import { getRentersAsignados } from "../controllers/authVisualizarListaRenters/visualizarRenters.controller";
import { authMiddleware } from "../middlewares/authMiddleware"; 

const router = Router();

// Endpoint protegido con token, retorna lista de renters de un driver
router.get("/driver/renters", authMiddleware, getRentersAsignados);


export default router;
