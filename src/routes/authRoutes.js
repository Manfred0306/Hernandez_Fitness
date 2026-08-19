import { Router } from 'express'; import * as Auth from '../controllers/AuthController.js';
const router=Router(); router.post('/login',Auth.login); router.post('/logout',Auth.logout); export default router;
