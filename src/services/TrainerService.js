import bcrypt from 'bcrypt';
import { query } from '../config/db.js';
import AppError from '../utils/AppError.js';
import TrainerRepository from '../repositories/TrainerRepository.js';

const gymTimeZone = process.env.GYM_TIME_ZONE || 'America/Costa_Rica';
const weekdayNumbers = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

function gymDateParts(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: gymTimeZone,
    weekday: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return { weekday: weekdayNumbers[parts.weekday], time: `${parts.hour}:${parts.minute}:${parts.second}` };
}

export default {
  list: () => TrainerRepository.list(),

  async create(data) {
    if (!data.cedula || !data.nombreCompleto || !data.email || !data.password || !data.horarios?.length) {
      throw new AppError('Complete los datos y al menos un día laboral.', 400);
    }
    if (data.horarios.some(schedule => !schedule.horaInicio || !schedule.horaFin || schedule.horaInicio >= schedule.horaFin)) {
      throw new AppError('Revise las horas del horario semanal.', 400);
    }
    data.horarioInicio = data.horarios[0].horaInicio;
    data.horarioFin = data.horarios[0].horaFin;
    try {
      return await TrainerRepository.create(data, await bcrypt.hash(data.password, 10));
    } catch (error) {
      if (error.code === '23505') throw new AppError('La cédula o el correo ya están registrados.', 409);
      throw error;
    }
  },

  async update(id, data) {
    if (!data.cedula || !data.nombreCompleto || !data.email || !data.horarios?.length) throw new AppError('Datos incompletos.', 400);
    if (data.horarios.some(schedule => !schedule.horaInicio || !schedule.horaFin || schedule.horaInicio >= schedule.horaFin)) {
      throw new AppError('Revise las horas del horario semanal.', 400);
    }
    try {
      await TrainerRepository.update(id, data, data.password ? await bcrypt.hash(data.password, 10) : null);
    } catch (error) {
      if (error.code === '23505') throw new AppError('La cédula o el correo ya están registrados.', 409);
      throw error;
    }
  },

  setActive: (id, active) => TrainerRepository.setActive(id, active),
  sessions: id => TrainerRepository.sessions(id),

  async setSessionStatus(id, status, actor) {
    if (!['Completado', 'Cancelado'].includes(status)) {
      throw new AppError('El estado de la sesión no es válido.', 400);
    }
    const trainerId = actor.rol === 'Entrenador' ? actor.idEntrenador : null;
    const updated = await TrainerRepository.setSessionStatus(id, status, trainerId);
    if (!updated) {
      throw new AppError('La sesión no existe, no le pertenece o ya no está agendada.', 409);
    }
  },

  async scheduleSession({ idEntrenador, idCliente, fechaHoraInicio, fechaHoraFin }, actor) {
    if (actor.rol === 'Entrenador') idEntrenador = actor.idEntrenador;
    if (!idEntrenador) throw new AppError('Seleccione un entrenador.', 400);
    const start = new Date(fechaHoraInicio);
    const end = new Date(fechaHoraFin);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || !(start < end)) {
      throw new AppError('La hora final debe ser posterior a la inicial.', 400);
    }

    const trainer = (await query(`SELECT e.id FROM entrenadores e JOIN usuarios u ON u.id=e.usuario_id
      WHERE e.id=$1 AND u.activo`, [idEntrenador])).rows[0];
    if (!trainer) throw new AppError('Entrenador no encontrado o inactivo.', 404);
    const client = (await query('SELECT id FROM clientes WHERE id=$1 AND activo', [idCliente])).rows[0];
    if (!client) throw new AppError('Cliente no encontrado o inactivo.', 404);

    const startParts = gymDateParts(start);
    const endParts = gymDateParts(end);
    if (start.toLocaleDateString('en-CA', { timeZone: gymTimeZone }) !== end.toLocaleDateString('en-CA', { timeZone: gymTimeZone })) {
      throw new AppError('La sesión debe comenzar y terminar el mismo día.', 400);
    }
    const schedule = (await query(`SELECT hora_inicio, hora_fin FROM horarios_entrenadores
      WHERE entrenador_id=$1 AND dia_semana=$2`, [idEntrenador, startParts.weekday])).rows[0];
    if (schedule && startParts.time < schedule.hora_fin && endParts.time > schedule.hora_inicio) {
      throw new AppError(`No se puede agendar dentro del horario laboral (${schedule.hora_inicio.slice(0, 5)}-${schedule.hora_fin.slice(0, 5)}).`, 409);
    }

    try {
      await query(`INSERT INTO sesiones_personalizadas(entrenador_id,cliente_id,fecha_hora_inicio,fecha_hora_fin)
        VALUES($1,$2,$3,$4)`, [idEntrenador, idCliente, start.toISOString(), end.toISOString()]);
    } catch (error) {
      if (error.code === '23P01') throw new AppError('El entrenador ya tiene una sesión personalizada en ese horario.', 409);
      throw error;
    }
  }
};
