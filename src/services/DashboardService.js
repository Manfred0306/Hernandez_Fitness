import { query } from '../config/db.js';
export default { async summary() { return (await query(`SELECT
  (SELECT COUNT(*)::int FROM clientes WHERE activo) AS "clientesActivos",
  (SELECT COUNT(*)::int FROM mediciones WHERE date_trunc('month',fecha_medicion)=date_trunc('month',CURRENT_DATE)) AS "medicionesMes",
  (SELECT COUNT(*)::int FROM entrenadores e JOIN usuarios u ON u.id=e.usuario_id WHERE u.activo) AS "entrenadoresActivos"`)).rows[0]; } };
