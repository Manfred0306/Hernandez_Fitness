import ClientService from "../services/ClientService.js";
export async function list(req, res, next) {
  try {
    res.json(await ClientService.list(req.query.buscar || ""));
  } catch (e) {
    next(e);
  }
}
export async function get(req, res, next) {
  try {
    res.json(await ClientService.get(req.params.id));
  } catch (e) {
    next(e);
  }
}
export async function byCedula(req, res, next) {
  try {
    res.json(await ClientService.byCedula(req.params.cedula));
  } catch (e) {
    next(e);
  }
}
export async function create(req, res, next) {
  try {
    const id = await ClientService.save(req.body);
    res.status(201).json({ id, message: "Cliente registrado." });
  } catch (e) {
    next(e);
  }
}
export async function update(req, res, next) {
  try {
    await ClientService.save(req.body, req.params.id);
    res.json({ message: "Cliente actualizado." });
  } catch (e) {
    next(e);
  }
}
export async function setStatus(req, res, next) {
  try {
    await ClientService.setActive(req.params.id, req.body.activo);
    res.json({ message: "Estado actualizado." });
  } catch (e) {
    next(e);
  }
}
