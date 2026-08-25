import { query, withTransaction } from '../config/db.js';

export default {
  async list() {
    const trainers = (await query(`SELECT e.id AS "Id", e.usuario_id AS "IdUsuario",
      e.horario_inicio AS "HorarioInicio", e.horario_fin AS "HorarioFin",
      u.cedula AS "Cedula", u.nombre_completo AS "NombreCompleto", u.email AS "Email",
      u.activo AS "Activo", u.es_administrador_principal AS "EsAdministradorPrincipal", r.nombre AS "Rol"
      FROM entrenadores e JOIN usuarios u ON u.id=e.usuario_id JOIN roles r ON r.id=u.rol_id
      ORDER BY u.activo DESC,u.nombre_completo`)).rows;
    const schedules = (await query(`SELECT entrenador_id AS "IdEntrenador", dia_semana AS "DiaSemana",
      hora_inicio AS "HoraInicio", hora_fin AS "HoraFin"
      FROM horarios_entrenadores ORDER BY dia_semana`)).rows;
    trainers.forEach(trainer => {
      trainer.Horarios = schedules.filter(schedule => String(schedule.IdEntrenador) === String(trainer.Id));
    });
    return trainers;
  },

  async findByUserId(userId) {
    return (await query('SELECT id AS "Id" FROM entrenadores WHERE usuario_id=$1', [userId])).rows[0];
  },

  async create(data, passwordHash) {
    return withTransaction(async client => {
      const user = await client.query(`INSERT INTO usuarios(cedula,nombre_completo,email,password_hash,rol_id)
        VALUES($1,$2,$3,$4,(SELECT id FROM roles WHERE nombre='Entrenador')) RETURNING id`,
        [data.cedula, data.nombreCompleto, data.email, passwordHash]);
      const trainer = await client.query(`INSERT INTO entrenadores(usuario_id,horario_inicio,horario_fin)
        VALUES($1,$2,$3) RETURNING id`, [user.rows[0].id, data.horarioInicio, data.horarioFin]);
      const trainerId = trainer.rows[0].id;
      for (const schedule of data.horarios || []) {
        await client.query(`INSERT INTO horarios_entrenadores(entrenador_id,dia_semana,hora_inicio,hora_fin)
          VALUES($1,$2,$3,$4)`, [trainerId, schedule.diaSemana, schedule.horaInicio, schedule.horaFin]);
      }
      return trainerId;
    });
  },

  async update(id, data, passwordHash) {
    await withTransaction(async client => {
      await client.query(`UPDATE usuarios SET cedula=$1,nombre_completo=$2,email=$3,
        password_hash=COALESCE($4,password_hash) WHERE id=(SELECT usuario_id FROM entrenadores WHERE id=$5)`,
        [data.cedula, data.nombreCompleto, data.email, passwordHash, id]);
      await client.query('DELETE FROM horarios_entrenadores WHERE entrenador_id=$1', [id]);
      for (const schedule of data.horarios || []) {
        await client.query(`INSERT INTO horarios_entrenadores(entrenador_id,dia_semana,hora_inicio,hora_fin)
          VALUES($1,$2,$3,$4)`, [id, schedule.diaSemana, schedule.horaInicio, schedule.horaFin]);
      }
    });
  },

  async setActive(id, active) {
    await query(`UPDATE usuarios SET activo=$1 WHERE id=(SELECT usuario_id FROM entrenadores WHERE id=$2)`,
      [Boolean(active), id]);
  },

  async sessions(trainerId) {
    const values = trainerId ? [trainerId] : [];
    const where = trainerId ? 'WHERE s.entrenador_id=$1' : '';
    return (await query(`SELECT s.id AS "Id", s.entrenador_id AS "IdEntrenador", s.cliente_id AS "IdCliente",
      s.fecha_hora_inicio AS "FechaHoraInicio", s.fecha_hora_fin AS "FechaHoraFin",
      c.nombre_completo AS "ClienteNombre", u.nombre_completo AS "EntrenadorNombre"
      FROM sesiones_personalizadas s JOIN clientes c ON c.id=s.cliente_id
      JOIN entrenadores e ON e.id=s.entrenador_id JOIN usuarios u ON u.id=e.usuario_id
      ${where} ORDER BY s.fecha_hora_inicio DESC`, values)).rows;
  }
};
