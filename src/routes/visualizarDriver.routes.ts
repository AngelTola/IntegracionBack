import { Router } from "express";
import getDriverProfile from "../controllers/authVisualizarDriver/VisualizarDriver.controller";
import authDriverMiddleware from "../middlewares/authDriverMiddleware";

const router = Router();

router.get("/profile", authDriverMiddleware, getDriverProfile);

export default router;
