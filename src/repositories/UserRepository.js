import { query } from '../config/db.js';
export default {
  async findByEmail(email) {
    const result = await query(`SELECT u.id AS "Id", u.cedula AS "Cedula", u.nombre_completo AS "NombreCompleto",
      u.email AS "Email", u.password_hash AS "PasswordHash", u.activo AS "Activo", r.nombre AS "Rol",
      e.id AS "IdEntrenador"
      FROM usuarios u JOIN roles r ON r.id=u.rol_id LEFT JOIN entrenadores e ON e.usuario_id=u.id
      WHERE lower(u.email)=lower($1)`, [email]);
    return result.rows[0];
  },
  async updatePasswordHash(id, passwordHash) {
    await query('UPDATE usuarios SET password_hash=$1 WHERE id=$2', [passwordHash, id]);
  }
};
