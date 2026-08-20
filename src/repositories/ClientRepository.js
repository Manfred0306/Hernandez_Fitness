import { getPool, sql } from '../config/db.js';

const baseQuery = `SELECT c.*, e.Id AS IdEntrenador, u.NombreCompleto AS EntrenadorNombre
  FROM Clientes c LEFT JOIN Entrenadores e ON e.Id=c.IdEntrenadorAsignado
  LEFT JOIN Usuarios u ON u.Id=e.IdUsuario`;

export default {
  async list(search = '') {
    const db = await getPool();
    return (await db.request().input('search', sql.NVarChar, `%${search}%`).query(`${baseQuery}
      WHERE c.Cedula LIKE @search OR c.NombreCompleto LIKE @search ORDER BY c.Activo DESC, c.NombreCompleto`)).recordset;
  },
  async findById(id) {
    const db = await getPool();
    return (await db.request().input('id', sql.Int, id).query(`${baseQuery} WHERE c.Id=@id`)).recordset[0];
  },
  async findByCedula(cedula) {
    const db = await getPool();
    return (await db.request().input('cedula', sql.NVarChar, cedula).query(`${baseQuery} WHERE c.Cedula=@cedula`)).recordset[0];
  },
  async save(data, id = null) {
    const db = await getPool();
    const req = db.request()
      .input('Cedula', sql.NVarChar, data.cedula)
      .input('NombreCompleto', sql.NVarChar, data.nombreCompleto)
      .input('Edad', sql.TinyInt, Number(data.edad))
      .input('LesionesEnfermedades', sql.NVarChar, data.lesionesEnfermedades || null)
      .input('PlanAdquirido', sql.NVarChar, data.planAdquirido)
      .input('IdEntrenadorAsignado', sql.Int, data.idEntrenadorAsignado || null);
    if (id) {
      await req.input('id', sql.Int, id).query(`UPDATE Clientes SET Cedula=@Cedula,NombreCompleto=@NombreCompleto,Edad=@Edad,
        LesionesEnfermedades=@LesionesEnfermedades,PlanAdquirido=@PlanAdquirido,IdEntrenadorAsignado=@IdEntrenadorAsignado WHERE Id=@id`);
      return id;
    }
    return (await req.query(`INSERT INTO Clientes(Cedula,NombreCompleto,Edad,LesionesEnfermedades,PlanAdquirido,IdEntrenadorAsignado)
      OUTPUT INSERTED.Id VALUES(@Cedula,@NombreCompleto,@Edad,@LesionesEnfermedades,@PlanAdquirido,@IdEntrenadorAsignado)`)).recordset[0].Id;
  },
  async setActive(id, active) {
    const db = await getPool();
    await db.request().input('id', sql.Int, id).input('active', sql.Bit, active).query('UPDATE Clientes SET Activo=@active WHERE Id=@id');
  }
};
