import DashboardService from '../services/DashboardService.js';
export async function summary(_req,res,next){try{res.json(await DashboardService.summary());}catch(e){next(e)}}
