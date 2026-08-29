import { Router } from "express";
import * as C from "../controllers/MeasurementController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
const router = Router();
router.use(authenticate);
router.post("/", authorize("Entrenador", "Administrador"), C.create);
router.get("/cliente/:clientId", C.history);
export default router;
