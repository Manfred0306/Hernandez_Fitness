import { getPool, sql } from '../config/db.js';
import AppError from '../utils/AppError.js';
export default {
  async scheduleSession({ idEntrenador, idCliente, fechaHoraInicio, fechaHoraFin }) {
    const start = new Date(fechaHoraInicio), end = new Date(fechaHoraFin);
    if (!(start < end)) throw new AppError('La hora final debe ser posterior a la inicial.');
    const db = await getPool();
    const trainer = (await db.request().input('id',sql.Int,idEntrenador).query('SELECT HorarioInicio, HorarioFin FROM Entrenadores WHERE Id=@id')).recordset[0];
    if (!trainer) throw new AppError('Entrenador no encontrado.',404);
    const time = d => d.toISOString().slice(11,19);
    // Una sesión no puede cruzarse con ningún minuto de la jornada regular del entrenador.
    if (time(start) < trainer.HorarioFin && time(end) > trainer.HorarioInicio) throw new AppError(`La sesión se solapa con el horario laboral (${trainer.HorarioInicio}-${trainer.HorarioFin}).`, 409);
    const conflict = await db.request().input('t',sql.Int,idEntrenador).input('s',sql.DateTime2,start).input('e',sql.DateTime2,end).query('SELECT 1 FROM SesionesPersonalizadas WHERE IdEntrenador=@t AND FechaHoraInicio < @e AND FechaHoraFin > @s');
    if (conflict.recordset.length) throw new AppError('El entrenador ya tiene una sesión personalizada en ese horario.',409);
    await db.request().input('t',sql.Int,idEntrenador).input('c',sql.Int,idCliente).input('s',sql.DateTime2,start).input('e',sql.DateTime2,end).query('INSERT INTO SesionesPersonalizadas(IdEntrenador,IdCliente,FechaHoraInicio,FechaHoraFin) VALUES(@t,@c,@s,@e)');
  }
};
