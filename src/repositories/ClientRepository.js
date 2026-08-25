import { query } from '../config/db.js';

const baseQuery = `SELECT c.id AS "Id", c.cedula AS "Cedula", c.nombre_completo AS "NombreCompleto",
  c.edad AS "Edad", c.lesiones_enfermedades AS "LesionesEnfermedades", c.plan_adquirido AS "PlanAdquirido",
  c.entrenador_asignado_id AS "IdEntrenadorAsignado", c.activo AS "Activo",
  e.id AS "IdEntrenador", u.nombre_completo AS "EntrenadorNombre"
  FROM clientes c LEFT JOIN entrenadores e ON e.id=c.entrenador_asignado_id
  LEFT JOIN usuarios u ON u.id=e.usuario_id`;

export default {
  async list(search = '') {
    const result = await query(`${baseQuery}
      WHERE c.cedula ILIKE $1 OR c.nombre_completo ILIKE $1 ORDER BY c.activo DESC, c.nombre_completo`, [`%${search}%`]);
    return result.rows;
  },
  async findById(id) {
    return (await query(`${baseQuery} WHERE c.id=$1`, [id])).rows[0];
  },
  async findByCedula(cedula) {
    return (await query(`${baseQuery} WHERE c.cedula=$1`, [cedula])).rows[0];
  },
  async save(data, id = null) {
    const values = [data.cedula, data.nombreCompleto, Number(data.edad), data.lesionesEnfermedades || null,
      data.planAdquirido, data.idEntrenadorAsignado || null];
    if (id) {
      await query(`UPDATE clientes SET cedula=$1,nombre_completo=$2,edad=$3,lesiones_enfermedades=$4,
        plan_adquirido=$5,entrenador_asignado_id=$6 WHERE id=$7`, [...values, id]);
      return id;
    }
    return (await query(`INSERT INTO clientes(cedula,nombre_completo,edad,lesiones_enfermedades,plan_adquirido,entrenador_asignado_id)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING id`, values)).rows[0].id;
  },
  async setActive(id, active) {
    await query('UPDATE clientes SET activo=$1 WHERE id=$2', [Boolean(active), id]);
  }
};
