import { getPool, sql } from '../config/db.js';
import AppError from '../utils/AppError.js';
import TrainerRepository from '../repositories/TrainerRepository.js';
import bcrypt from 'bcrypt';
export default {
  list: () => TrainerRepository.list(),
  async create(data) {
    if (!data.cedula || !data.nombreCompleto || !data.email || !data.password || !data.horarios?.length) throw new AppError('Complete los datos y al menos un día laboral.',400);
    if(data.horarios.some(h=>!h.horaInicio||!h.horaFin||h.horaInicio>=h.horaFin)) throw new AppError('Revise las horas del horario semanal.',400);
    data.horarioInicio=data.horarios[0].horaInicio; data.horarioFin=data.horarios[0].horaFin;
    return TrainerRepository.create(data, await bcrypt.hash(data.password,10));
  },
  async update(id,data) { if (!data.cedula||!data.nombreCompleto||!data.email||!data.horarios?.length) throw new AppError('Datos incompletos.',400); if(data.horarios.some(h=>!h.horaInicio||!h.horaFin||h.horaInicio>=h.horaFin)) throw new AppError('Revise las horas del horario semanal.',400); await TrainerRepository.update(id,data,data.password?await bcrypt.hash(data.password,10):null); },
  setActive: (id,active) => TrainerRepository.setActive(id,active),
  sessions: id => TrainerRepository.sessions(id),
  async scheduleSession({ idEntrenador, idCliente, fechaHoraInicio, fechaHoraFin }, actor) {
    if (actor.rol === 'Entrenador' && Number(actor.idEntrenador) !== Number(idEntrenador)) throw new AppError('Solo puede agendar sesiones propias.',403);
    const start = new Date(fechaHoraInicio), end = new Date(fechaHoraFin);
    if (!(start < end)) throw new AppError('La hora final debe ser posterior a la inicial.');
    const db = await getPool();
    const trainer = (await db.request().input('id',sql.Int,idEntrenador).query('SELECT Id FROM Entrenadores WHERE Id=@id')).recordset[0];
    if (!trainer) throw new AppError('Entrenador no encontrado.',404);
    if(start.toDateString()!==end.toDateString()) throw new AppError('La sesión debe comenzar y terminar el mismo día.',400);
    const day=start.getDay()===0?7:start.getDay(), schedule=(await db.request().input('id',sql.Int,idEntrenador).input('day',sql.TinyInt,day).query('SELECT HoraInicio,HoraFin FROM HorariosEntrenadores WHERE IdEntrenador=@id AND DiaSemana=@day')).recordset[0], time=d=>d.toTimeString().slice(0,8), dbTime=t=>t instanceof Date?t.toISOString().slice(11,19):String(t).match(/T?(\d{2}:\d{2}:\d{2})/)?.[1];
    if(schedule&&time(start)<dbTime(schedule.HoraFin)&&time(end)>dbTime(schedule.HoraInicio)) throw new AppError(`No se puede agendar dentro del horario laboral (${dbTime(schedule.HoraInicio).slice(0,5)}-${dbTime(schedule.HoraFin).slice(0,5)}).`,409);
    const conflict = await db.request().input('t',sql.Int,idEntrenador).input('s',sql.DateTime2,start).input('e',sql.DateTime2,end).query('SELECT 1 FROM SesionesPersonalizadas WHERE IdEntrenador=@t AND FechaHoraInicio < @e AND FechaHoraFin > @s');
    if (conflict.recordset.length) throw new AppError('El entrenador ya tiene una sesión personalizada en ese horario.',409);
    await db.request().input('t',sql.Int,idEntrenador).input('c',sql.Int,idCliente).input('s',sql.DateTime2,start).input('e',sql.DateTime2,end).query('INSERT INTO SesionesPersonalizadas(IdEntrenador,IdCliente,FechaHoraInicio,FechaHoraFin) VALUES(@t,@c,@s,@e)');
  }
};
