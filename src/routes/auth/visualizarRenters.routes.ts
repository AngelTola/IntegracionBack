//src/routes/auth/visualizarRenters.routes.ts
import { Router } from "express";
import { getRentersAsignados } from "../../controllers/auth/authVisualizarListaRenters/visualizarRenters.controller";
import { authMiddleware } from "../../middlewares/auth/authMiddleware"; 

const router = Router();
//Define una ruta GET en "/driver/renters"
// Primero se ejecuta el middleware de autenticación
// Si el usuario está autenticado, se ejecuta el controlador getRentersAsignados
router.get("/driver/renters", authMiddleware, getRentersAsignados);

// Exporta el router para que pueda ser usado en el archivo principal de rutas del servidor
export default router;
