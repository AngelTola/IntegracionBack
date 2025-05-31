import { Router } from "express";
import { getDriverProfile } from "../../controllers/auth/authVisualizarDriver/VisualizarDriver.controller";
import { authDriverMiddleware } from "../../middlewares/auth/authDriverMiddleware";

const router = Router();

// ✔ Ruta segura: obtiene el perfil desde el token
router.get("/profile", authDriverMiddleware, getDriverProfile);

export default router;
