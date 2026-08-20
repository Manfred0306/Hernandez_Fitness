import { getPool, sql } from '../config/db.js';
import AppError from '../utils/AppError.js';
const fields = ['Estatura','Peso','MasaMuscular','PorcentajeGrasa','Cintura','Cadera','BrazoIzquierdo','BrazoDerecho','PiernaIzquierda','PiernaDerecha','PantorrillaIzquierda','PantorrillaDerecha','Pectoral','Espalda'];
export default {
  async create(data, idEntrenador) {
    idEntrenador = idEntrenador || data.idEntrenador;
    if (!idEntrenador) throw new AppError('El usuario no tiene perfil de entrenador.', 403);
    const db = await getPool(); const req = db.request().input('IdCliente', sql.Int, data.idCliente).input('IdEntrenador', sql.Int, idEntrenador).input('FechaMedicion', sql.Date, data.fechaMedicion);
    fields.forEach(f => req.input(f, sql.Decimal(5,2), data[f] ?? null));
    const columns = ['IdCliente','IdEntrenador','FechaMedicion', ...fields];
    await req.query(`INSERT INTO Mediciones (${columns.join(',')}) VALUES (${columns.map(f => '@'+f).join(',')})`);
  },
  async history(idCliente) { const db = await getPool(); return (await db.request().input('id', sql.Int, idCliente).query('SELECT * FROM Mediciones WHERE IdCliente=@id ORDER BY FechaMedicion DESC')).recordset; }
};
