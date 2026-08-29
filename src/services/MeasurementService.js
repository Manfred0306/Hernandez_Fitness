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
export default {
  async create(data, idEntrenador) {
    idEntrenador = idEntrenador || data.idEntrenador;
    if (!idEntrenador)
      throw new AppError("El usuario no tiene perfil de entrenador.", 403);
    const values = [
      data.idCliente,
      idEntrenador,
      data.fechaMedicion,
      ...fields.map((field) => data[field] || null),
    ];
    await query(
      `INSERT INTO mediciones(cliente_id,entrenador_id,fecha_medicion,${columns.join(",")})
      VALUES(${values.map((_, index) => `$${index + 1}`).join(",")})`,
      values,
    );
  },
  async history(idCliente) {
    return (
      await query(
        `SELECT id AS "Id", cliente_id AS "IdCliente", entrenador_id AS "IdEntrenador",
      fecha_medicion AS "Fecha de Medicion", estatura AS "Estatura", peso AS "Peso", masa_muscular AS "Masa Muscular",
      porcentaje_grasa AS "Porcentaje de Grasa", cintura AS "Cintura", cadera AS "Cadera",
      brazo_izquierdo AS "Brazo Izquierdo", brazo_derecho AS "Brazo Derecho",
      pierna_izquierda AS "Pierna Izquierda", pierna_derecha AS "Pierna Derecha",
      pantorrilla_izquierda AS "Pantorrilla Izquierda", pantorrilla_derecha AS "Pantorrilla Derecha",
      pectoral AS "Pectoral", espalda AS "Espalda"
      FROM mediciones WHERE cliente_id=$1 ORDER BY fecha_medicion DESC`,
        [idCliente],
      )
    ).rows;
  },
};
