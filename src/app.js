import express from 'express'; import cors from 'cors'; import cookieParser from 'cookie-parser'; import path from 'path'; import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js'; import measurementRoutes from './routes/measurementRoutes.js'; import trainerRoutes from './routes/trainerRoutes.js'; import {errorHandler} from './middlewares/errorHandler.js';
import clientRoutes from './routes/clientRoutes.js'; import dashboardRoutes from './routes/dashboardRoutes.js';
const app=express(), __dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(cors({origin:true,credentials:true})); app.use(express.json()); app.use(cookieParser());
app.use('/api/auth',authRoutes); app.use('/api/dashboard',dashboardRoutes); app.use('/api/clientes',clientRoutes); app.use('/api/mediciones',measurementRoutes); app.use('/api/entrenadores',trainerRoutes); app.use(express.static(path.join(__dirname,'../public'))); app.use(errorHandler); export default app;
