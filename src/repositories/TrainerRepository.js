import { getPool, sql } from '../config/db.js';

export default {
  async list() {
    const db = await getPool();
    await db.request().query(`IF OBJECT_ID('HorariosEntrenadores','U') IS NULL BEGIN CREATE TABLE HorariosEntrenadores(Id INT IDENTITY PRIMARY KEY,IdEntrenador INT NOT NULL REFERENCES Entrenadores(Id),DiaSemana TINYINT NOT NULL,HoraInicio TIME NOT NULL,HoraFin TIME NOT NULL,CONSTRAINT UQ_Horario_Dia UNIQUE(IdEntrenador,DiaSemana)); INSERT INTO HorariosEntrenadores(IdEntrenador,DiaSemana,HoraInicio,HoraFin) SELECT Id,D.Dia,HorarioInicio,HorarioFin FROM Entrenadores CROSS JOIN(VALUES(1),(2),(3),(4),(5))D(Dia); END`);
    const trainers=(await db.request().query(`SELECT e.Id, e.IdUsuario, e.HorarioInicio, e.HorarioFin, u.Cedula, u.NombreCompleto, u.Email, u.Activo, u.EsAdministradorPrincipal, r.Nombre AS Rol
      FROM Entrenadores e JOIN Usuarios u ON u.Id=e.IdUsuario JOIN Roles r ON r.Id=u.IdRol ORDER BY u.Activo DESC,u.NombreCompleto`)).recordset;
    const schedules=(await db.request().query('SELECT IdEntrenador,DiaSemana,HoraInicio,HoraFin FROM HorariosEntrenadores ORDER BY DiaSemana')).recordset;
    trainers.forEach(t=>t.Horarios=schedules.filter(h=>h.IdEntrenador===t.Id)); return trainers;
  },
  async findByUserId(userId) {
    const db = await getPool();
    return (await db.request().input('userId', sql.Int, userId).query('SELECT Id FROM Entrenadores WHERE IdUsuario=@userId')).recordset[0];
  },
  async create(data, passwordHash) {
    const db = await getPool();
    const transaction = new sql.Transaction(db); await transaction.begin();
    try {
      const req = new sql.Request(transaction);
      const user = await req.input('cedula',sql.NVarChar,data.cedula).input('nombre',sql.NVarChar,data.nombreCompleto).input('email',sql.NVarChar,data.email)
        .input('password',sql.NVarChar,passwordHash).query(`INSERT INTO Usuarios(Cedula,NombreCompleto,Email,PasswordHash,IdRol)
          OUTPUT INSERTED.Id VALUES(@cedula,@nombre,@email,@password,(SELECT Id FROM Roles WHERE Nombre='Entrenador'))`);
      const userId = user.recordset[0].Id;
      const trainer = await new sql.Request(transaction).input('userId',sql.Int,userId).input('inicio',sql.Time,data.horarioInicio).input('fin',sql.Time,data.horarioFin)
        .query('INSERT INTO Entrenadores(IdUsuario,HorarioInicio,HorarioFin) OUTPUT INSERTED.Id VALUES(@userId,@inicio,@fin)');
      const trainerId=trainer.recordset[0].Id; for(const h of data.horarios||[]) await new sql.Request(transaction).input('id',sql.Int,trainerId).input('dia',sql.TinyInt,h.diaSemana).input('inicio',sql.Time,h.horaInicio).input('fin',sql.Time,h.horaFin).query('INSERT INTO HorariosEntrenadores(IdEntrenador,DiaSemana,HoraInicio,HoraFin) VALUES(@id,@dia,@inicio,@fin)');
      await transaction.commit(); return trainerId;
    } catch (error) { await transaction.rollback(); throw error; }
  },
  async update(id, data, passwordHash) {
    const db=await getPool(), transaction=new sql.Transaction(db); await transaction.begin(); try{
      await new sql.Request(transaction).input('id',sql.Int,id).input('cedula',sql.NVarChar,data.cedula).input('nombre',sql.NVarChar,data.nombreCompleto).input('email',sql.NVarChar,data.email).input('password',sql.NVarChar,passwordHash||null).query(`UPDATE Usuarios SET Cedula=@cedula,NombreCompleto=@nombre,Email=@email,PasswordHash=COALESCE(@password,PasswordHash) WHERE Id=(SELECT IdUsuario FROM Entrenadores WHERE Id=@id)`);
      await new sql.Request(transaction).input('id',sql.Int,id).query('DELETE FROM HorariosEntrenadores WHERE IdEntrenador=@id');
      for(const h of data.horarios||[]) await new sql.Request(transaction).input('id',sql.Int,id).input('dia',sql.TinyInt,h.diaSemana).input('inicio',sql.Time,h.horaInicio).input('fin',sql.Time,h.horaFin).query('INSERT INTO HorariosEntrenadores(IdEntrenador,DiaSemana,HoraInicio,HoraFin) VALUES(@id,@dia,@inicio,@fin)');
      await transaction.commit();
    }catch(error){await transaction.rollback();throw error}
  },
  async setActive(id, active) {
    const db = await getPool();
    await db.request().input('id',sql.Int,id).input('active',sql.Bit,active).query('UPDATE Usuarios SET Activo=@active WHERE Id=(SELECT IdUsuario FROM Entrenadores WHERE Id=@id)');
  },
  async sessions(idEntrenador) {
    const db = await getPool();
    const req = db.request(); let where = '';
    if (idEntrenador) { req.input('idEntrenador',sql.Int,idEntrenador); where='WHERE s.IdEntrenador=@idEntrenador'; }
    return (await req.query(`SELECT s.*, c.NombreCompleto AS ClienteNombre, u.NombreCompleto AS EntrenadorNombre FROM SesionesPersonalizadas s
      JOIN Clientes c ON c.Id=s.IdCliente JOIN Entrenadores e ON e.Id=s.IdEntrenador JOIN Usuarios u ON u.Id=e.IdUsuario ${where} ORDER BY s.FechaHoraInicio DESC`)).recordset;
  }
};
