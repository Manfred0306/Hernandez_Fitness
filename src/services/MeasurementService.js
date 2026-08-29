import { query } from "../config/db.js";
import AppError from "../utils/AppError.js";
const fields = [
  "Estatura",
  "Peso",
  "Masa Muscular",
  "Porcentaje de Grasa",
  "Cintura",
  "Cadera",
  "Brazo Izquierdo",
  "Brazo Derecho",
  "Pierna Izquierda",
  "Pierna Derecha",
  "Pantorrilla Izquierda",
  "Pantorrilla Derecha",
  "Pectoral",
  "Espalda",
];
const columns = [
  "estatura",
  "peso",
  "masa_muscular",
  "porcentaje_grasa",
  "cintura",
  "cadera",
  "brazo_izquierdo",
  "brazo_derecho",
  "pierna_izquierda",
  "pierna_derecha",
  "pantorrilla_izquierda",
  "pantorrilla_derecha",
  "pectoral",
  "espalda",
];
const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
export default {
  async create(data, actor) {
    if (!data.idCliente || !validDate(data.fechaMedicion))
      throw new AppError("Seleccione un cliente y una fecha válida.", 400);
    const measurements = fields.map((field) => data[field]);
    if (
      measurements.some(
        (value) =>
          value === "" ||
          value === null ||
          value === undefined ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0,
      )
    )
      throw new AppError("Complete todos los campos de la medición.", 400);
    if (actor.rol === "Entrenador" && !actor.idEntrenador)
      throw new AppError("El usuario no tiene perfil de entrenador.", 403);
    const values = [
      data.idCliente,
      actor.rol === "Entrenador" ? actor.idEntrenador : null,
      actor.id,
      data.fechaMedicion,
      ...measurements.map(Number),
    ];
    await query(
      `INSERT INTO mediciones(cliente_id,entrenador_id,realizado_por_usuario_id,fecha_medicion,${columns.join(",")})
      VALUES(${values.map((_, index) => `$${index + 1}`).join(",")})`,
      values,
    );
  },
  async history(idCliente) {
    return (
      await query(
        `SELECT m.id AS "Id", m.cliente_id AS "IdCliente", m.entrenador_id AS "IdEntrenador",
      m.fecha_medicion AS "FechaMedicion",
      CASE WHEN r.nombre='Administrador' THEN 'Administrador' ELSE u.nombre_completo END AS "RealizadoPor",
      m.estatura AS "Estatura", m.peso AS "Peso", m.masa_muscular AS "Masa Muscular",
      porcentaje_grasa AS "Porcentaje de Grasa", cintura AS "Cintura", cadera AS "Cadera",
      brazo_izquierdo AS "Brazo Izquierdo", brazo_derecho AS "Brazo Derecho",
      pierna_izquierda AS "Pierna Izquierda", pierna_derecha AS "Pierna Derecha",
      pantorrilla_izquierda AS "Pantorrilla Izquierda", pantorrilla_derecha AS "Pantorrilla Derecha",
      pectoral AS "Pectoral", espalda AS "Espalda"
      FROM mediciones m
      JOIN usuarios u ON u.id=m.realizado_por_usuario_id
      JOIN roles r ON r.id=u.rol_id
      WHERE m.cliente_id=$1 ORDER BY m.fecha_medicion DESC, m.id DESC`,
        [idCliente],
      )
    ).rows;
  },
};
