import TrainerService from "../services/TrainerService.js";
export async function list(_req, res, next) {
  try {
    res.json(await TrainerService.list());
  } catch (e) {
    next(e);
  }
}
export async function create(req, res, next) {
  try {
    const id = await TrainerService.create(req.body);
    res.status(201).json({ id, message: "Entrenador registrado." });
  } catch (e) {
    next(e);
  }
}
export async function update(req, res, next) {
  try {
    await TrainerService.update(req.params.id, req.body);
    res.json({ message: "Entrenador actualizado." });
  } catch (e) {
    next(e);
  }
}
export async function setStatus(req, res, next) {
  try {
    await TrainerService.setActive(req.params.id, req.body.activo);
    res.json({ message: "Estado actualizado." });
  } catch (e) {
    next(e);
  }
}
export async function schedule(req, res, next) {
  try {
    await TrainerService.scheduleSession(req.body, req.user);
    res.status(201).json({ message: "Sesión personalizada agendada." });
  } catch (e) {
    next(e);
  }
}
export async function sessions(req, res, next) {
  try {
    res.json(
      await TrainerService.sessions(
        req.user.rol === "Entrenador" ? req.user.idEntrenador : null,
      ),
    );
  } catch (e) {
    next(e);
  }
}
export async function setSessionStatus(req, res, next) {
  try {
    await TrainerService.setSessionStatus(req.params.id, req.body.estado, req.user);
    res.json({ message: `Sesión marcada como ${req.body.estado.toLowerCase()}.` });
  } catch (e) {
    next(e);
  }
}
