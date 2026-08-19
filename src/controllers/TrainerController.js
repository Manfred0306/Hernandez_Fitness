import TrainerService from '../services/TrainerService.js';
export async function schedule(req,res,next) { try { await TrainerService.scheduleSession(req.body); res.status(201).json({message:'Sesión personalizada agendada.'}); } catch(e){next(e)} }
