import { getPool, sql } from '../config/db.js';
export default {
  async findByEmail(email) {
    const db = await getPool();
    return (await db.request().input('email', sql.NVarChar, email).query(`SELECT u.*, r.Nombre AS Rol, e.Id AS IdEntrenador
      FROM Usuarios u JOIN Roles r ON r.Id=u.IdRol LEFT JOIN Entrenadores e ON e.IdUsuario=u.Id WHERE u.Email=@email`)).recordset[0];
  },
  async updatePasswordHash(id, passwordHash) {
    const db = await getPool();
    await db.request()
      .input('id', sql.Int, id)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query('UPDATE Usuarios SET PasswordHash=@passwordHash WHERE Id=@id');
  }
};
