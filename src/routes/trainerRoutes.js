import { Router } from 'express'; import {schedule} from '../controllers/TrainerController.js'; import {authenticate,authorize} from '../middlewares/auth.js';
const router=Router(); router.post('/sesiones',authenticate,authorize('Entrenador','Administrador'),schedule); export default router;
