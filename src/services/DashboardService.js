import { getPool } from '../config/db.js';
export default { async summary() { const db=await getPool(); return (await db.request().query(`SELECT
  (SELECT COUNT(*) FROM Clientes WHERE Activo=1) AS clientesActivos,
  (SELECT COUNT(*) FROM Mediciones WHERE YEAR(FechaMedicion)=YEAR(GETDATE()) AND MONTH(FechaMedicion)=MONTH(GETDATE())) AS medicionesMes,
  (SELECT COUNT(*) FROM Entrenadores e JOIN Usuarios u ON u.Id=e.IdUsuario WHERE u.Activo=1) AS entrenadoresActivos`)).recordset[0]; } };
