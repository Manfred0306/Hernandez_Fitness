import MeasurementService from "../services/MeasurementService.js";
export async function create(req, res, next) {
  try {
    await MeasurementService.create(
      req.body,
      req.user.rol === "Entrenador"
        ? req.user.idEntrenador
        : req.body.idEntrenador,
    );
    res.status(201).json({ message: "Medición registrada." });
  } catch (e) {
    next(e);
  }
}
export async function history(req, res, next) {
  try {
    res.json(await MeasurementService.history(req.params.clientId));
  } catch (e) {
    next(e);
  }
}
