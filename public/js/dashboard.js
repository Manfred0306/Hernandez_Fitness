document.head.insertAdjacentHTML(
  "beforeend",
  '<link rel="stylesheet" href="css/responsive.css">',
);
const user = JSON.parse(localStorage.getItem("hf_user") || "null"),
  view = document.querySelector("#view"),
  notice = document.querySelector("#notice"),
  quick = document.querySelector(".measure"),
  eyebrow = document.querySelector("#eyebrow"),
  title = document.querySelector("#title"),
  logout = document.querySelector("#logout"),
  $ = (id) => document.getElementById(id);
if (!user) {
  location.replace("/");
  throw Error("Sin sesión");
}
if (user.rol !== "Administrador") {
  document.querySelectorAll(".admin").forEach((x) => x.remove());
  if (document.body.dataset.page === "entrenadores") {
    location.replace("dashboard.html");
    throw Error("Sin permiso");
  }
}
const sidebar = document.querySelector("aside"),
  navigation = sidebar.querySelector("nav"),
  pageHeader = document.querySelector("main > header");
const menuToggle = document.createElement("button"),
  menuBackdrop = document.createElement("button"),
  mobileLogout = document.createElement("button");
menuToggle.className = "mobile-menu-toggle";
menuToggle.type = "button";
menuToggle.setAttribute("aria-label", "Abrir menú");
menuToggle.setAttribute("aria-controls", "mobile-navigation");
menuToggle.setAttribute("aria-expanded", "false");
menuToggle.innerHTML = "<span></span><span></span><span></span>";
menuBackdrop.className = "mobile-menu-backdrop";
menuBackdrop.type = "button";
menuBackdrop.setAttribute("aria-label", "Cerrar menú");
mobileLogout.className = "mobile-logout";
mobileLogout.type = "button";
mobileLogout.textContent = "Cerrar sesión";
navigation.id = "mobile-navigation";
navigation.appendChild(mobileLogout);
pageHeader.appendChild(menuToggle);
document.body.appendChild(menuBackdrop);
function toggleMobileMenu(open) {
  document.body.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}
menuToggle.onclick = () =>
  toggleMobileMenu(!document.body.classList.contains("menu-open"));
menuBackdrop.onclick = () => toggleMobileMenu(false);
navigation
  .querySelectorAll("a")
  .forEach((link) =>
    link.addEventListener("click", () => toggleMobileMenu(false)),
  );
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") toggleMobileMenu(false);
});
const esc = (x) =>
    String(x ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    ),
  message = (x, b = 0) => {
    notice.textContent = x;
    notice.className = b ? "error" : "ok";
  };
const statusDialog = document.createElement("dialog");
statusDialog.className = "status-modal";
statusDialog.innerHTML = `<form method="dialog"><span class="modal-eyebrow">CONFIRMACIÓN</span><h2 id="statusModalTitle"></h2><p id="statusModalText"></p><div class="modal-actions"><button value="cancel" class="modal-cancel">Cancelar</button><button value="confirm" id="statusModalConfirm">Confirmar</button></div></form>`;
document.body.appendChild(statusDialog);
function confirmStatusChange({ name, entity, activate }) {
  const action = activate ? "reactivar" : "inactivar";
  $("statusModalTitle").textContent = `${activate ? "Reactivar" : "Inactivar"} ${entity}`;
  $("statusModalText").textContent = `¿Confirma que desea ${action} a ${name}?`;
  const confirmButton = $("statusModalConfirm");
  confirmButton.className = activate ? "success" : "danger";
  confirmButton.textContent = activate ? "Sí, reactivar" : "Sí, inactivar";
  statusDialog.returnValue = "";
  statusDialog.showModal();
  return new Promise((resolve) => {
    statusDialog.addEventListener(
      "close",
      () => resolve(statusDialog.returnValue === "confirm"),
      { once: true },
    );
  });
}
function confirmSessionChange({ client, status }) {
  const cancel = status === "Cancelado";
  $("statusModalTitle").textContent = cancel
    ? "Cancelar sesión"
    : "Completar sesión";
  $("statusModalText").textContent = `¿Confirma que desea marcar la sesión de ${client} como ${status.toLowerCase()}?`;
  const confirmButton = $("statusModalConfirm");
  confirmButton.className = cancel ? "danger" : "success";
  confirmButton.textContent = cancel ? "Sí, cancelar" : "Sí, completar";
  statusDialog.returnValue = "";
  statusDialog.showModal();
  return new Promise((resolve) => {
    statusDialog.addEventListener(
      "close",
      () => resolve(statusDialog.returnValue === "confirm"),
      { once: true },
    );
  });
}
async function api(path, options = {}) {
  const response = await fetch("/api" + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = response.status === 204 ? {} : await response.json();
  if (response.status === 401) {
    localStorage.removeItem("hf_user");
    location.replace("/");
    throw Error("Sesión finalizada");
  }
  if (!response.ok) throw Error(data.message);
  return data;
}
const measurementFields = [
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
const days = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const formatTime = (value) =>
  String(value ?? "").match(/(\d{2}:\d{2})/)?.[1] || "";
const formatTrainerSchedule = (schedules = []) => {
  const formatted = schedules
    .map((schedule) => {
      const start = formatTime(schedule.HoraInicio),
        end = formatTime(schedule.HoraFin),
        day = days[schedule.DiaSemana - 1];
      return day && start && end ? `${day} ${start}–${end}` : "";
    })
    .filter(Boolean);
  return formatted.length ? formatted.join(" · ") : "Sin horario";
};
const formatMeasurementDate = (value) => {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "Fecha no disponible";
  return new Date(+match[1], +match[2] - 1, +match[3]).toLocaleDateString();
};
function measurementHistory(items) {
  return `<div class="measurement-history">${items.map((m) => `<article><h3>${formatMeasurementDate(m.FechaMedicion)}</h3><p>Realizada por: <b>${esc(m.RealizadoPor || "No disponible")}</b></p><div class="detail-grid">${measurementFields.map((f) => `<span><small>${f}</small><b>${m[f] ?? "—"}</b></span>`).join("")}</div></article>`).join("") || "<p>No hay mediciones registradas.</p>"}</div>`;
}
async function inicio() {
  const d = await api("/dashboard");
  view.innerHTML = `<section class="metrics">${[
    ["Clientes activos", d.clientesActivos],
    ["Mediciones este mes", d.medicionesMes],
    ["Entrenadores activos", d.entrenadoresActivos],
  ]
    .map((x) => `<article><small>${x[0]}</small><b>${x[1]}</b></article>`)
    .join("")}</section>`;
}
function clientCards(list) {
  return `<div class="list">${list.map((c) => `<article><b>${esc(c.NombreCompleto)}</b><span>${esc(c.Cedula)} · ${c.Edad} años · ${esc(c.PlanAdquirido)}</span><div class="row"><button data-history="${c.Id}">Ver mediciones</button><button data-measure-client="${c.Id}" ${c.Activo ? "" : "disabled"}>Registrar medición</button>${user.rol === "Administrador" ? `<button data-edit-client="${c.Id}">Editar</button><button class="${c.Activo ? "danger" : "success"}" data-status-client="${c.Id}" data-active="${!c.Activo}">${c.Activo ? "Inactivar" : "Reactivar"}</button>` : ""}</div></article>`).join("")}</div>`;
}
async function clientes() {
  const clients = await api("/clientes");
  view.innerHTML = `<section class="grid"><form id="clientForm" class="content"><h2 id="clientTitle">Registrar cliente</h2><input type="hidden" name="id"><input name="cedula" placeholder="Cédula" required><input name="nombreCompleto" placeholder="Nombre completo" required><input name="edad" type="number" min="1" max="120" placeholder="Edad" required><input name="planAdquirido" placeholder="Plan adquirido" required><textarea name="lesionesEnfermedades" placeholder="Lesiones o enfermedades"></textarea><div class="form-actions"><button>Guardar cliente</button><button id="cancelClientEdit" class="secondary" type="button" hidden>Cancelar</button></div></form><section class="content"><h2>Clientes</h2><input id="clientSearch" placeholder="Buscar por nombre o cédula"><div id="clientList"></div><div id="clientPagination" class="pagination"></div></section></section>`;
  const clientForm = $("clientForm"),
    clientTitle = $("clientTitle"),
    cancelClientEdit = $("cancelClientEdit"),
    clientSearch = $("clientSearch"),
    clientList = $("clientList"),
    clientPagination = $("clientPagination"),
    pageSize = 10;
  const resetClientEdit = () => {
    clientForm.reset();
    clientForm.elements.id.value = "";
    clientTitle.textContent = "Registrar cliente";
    cancelClientEdit.hidden = true;
  };
  cancelClientEdit.onclick = resetClientEdit;
  let currentPage = 1,
    filteredClients = clients;
  const renderClientPage = () => {
    const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (currentPage - 1) * pageSize;
    clientList.innerHTML = clientCards(
      filteredClients.slice(start, start + pageSize),
    );
    clientPagination.innerHTML = `<button type="button" data-client-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>Anterior</button><span>Página ${currentPage} de ${totalPages} · ${filteredClients.length} cliente${filteredClients.length === 1 ? "" : "s"}</span><button type="button" data-client-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>Siguiente</button>`;
  };
  renderClientPage();
  clientForm.onsubmit = async (ev) => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(clientForm)),
      id = d.id;
    delete d.id;
    try {
      await api("/clientes" + (id ? "/" + id : ""), {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(d),
      });
      message("Cliente guardado.");
      clientes();
    } catch (x) {
      message(x.message, 1);
    }
  };
  clientSearch.oninput = () => {
    const search = clientSearch.value.trim().toLocaleLowerCase("es");
    filteredClients = clients.filter((client) =>
      `${client.NombreCompleto} ${client.Cedula}`
        .toLocaleLowerCase("es")
        .includes(search),
    );
    currentPage = 1;
    renderClientPage();
  };
  view.onclick = async (ev) => {
    const h = ev.target.dataset.history,
      edit = ev.target.dataset.editClient,
      status = ev.target.dataset.statusClient,
      pageTarget = ev.target.dataset.clientPage,
      measurementClient = ev.target.dataset.measureClient;
    if (measurementClient) {
      location.href = `mediciones.html?cliente=${encodeURIComponent(measurementClient)}`;
    } else if (pageTarget) {
      currentPage = Number(pageTarget);
      renderClientPage();
      clientSearch.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (h) {
      const c = await api("/clientes/" + h),
        m = await api("/mediciones/cliente/" + h);
      view.innerHTML = `<section class="content"><button id="backClients">Volver</button><h2>${esc(c.NombreCompleto)}</h2><p>${esc(c.Cedula)} · ${c.Edad} años</p>${measurementHistory(m)}</section>`;
      $("backClients").onclick = clientes;
    } else if (edit) {
      const c = await api("/clientes/" + edit);
      for (const [k, val] of Object.entries({
        id: c.Id,
        cedula: c.Cedula,
        nombreCompleto: c.NombreCompleto,
        edad: c.Edad,
        planAdquirido: c.PlanAdquirido,
        lesionesEnfermedades: c.LesionesEnfermedades,
      }))
        if (clientForm.elements[k]) clientForm.elements[k].value = val ?? "";
      clientTitle.textContent = "Editar cliente";
      cancelClientEdit.hidden = false;
      clientForm.scrollIntoView();
    } else if (status) {
      const selectedClient = clients.find((client) => client.Id == status),
        activate = ev.target.dataset.active === "true";
      if (
        !selectedClient ||
        !(await confirmStatusChange({
          name: selectedClient.NombreCompleto,
          entity: "cliente",
          activate,
        }))
      )
        return;
      try {
        await api(`/clientes/${status}/estado`, {
          method: "PATCH",
          body: JSON.stringify({ activo: activate }),
        });
        message(`Cliente ${activate ? "reactivado" : "inactivado"}.`);
        clientes();
      } catch (error) {
        message(error.message, 1);
      }
    }
  };
}
async function mediciones() {
  const clients = await api("/clientes");
  view.innerHTML = `<section class="content"><h2>Seleccionar cliente</h2><input id="clientPicker" placeholder="Buscar por nombre o cédula"><div id="pickerResults" class="list"></div></section><section id="measurementArea"></section>`;
  const clientPicker = $("clientPicker"),
    pickerResults = $("pickerResults"),
    measurementArea = $("measurementArea");
  const draw = (list) =>
    (pickerResults.innerHTML = list
      .map(
        (c) =>
          `<article><b>${esc(c.NombreCompleto)}</b><span>${esc(c.Cedula)} · ${c.Edad} años</span><button data-pick="${c.Id}">Seleccionar</button></article>`,
      )
      .join(""));
  draw(clients.filter((c) => c.Activo));
  clientPicker.oninput = () =>
    draw(
      clients.filter((c) =>
        (c.NombreCompleto + " " + c.Cedula)
          .toLowerCase()
          .includes(clientPicker.value.toLowerCase()),
      ),
    );
  const openClientMeasurement = async (c) => {
    const history = await api("/mediciones/cliente/" + c.Id);
    const measurementAuthor =
      user.rol === "Administrador" ? "Administrador" : user.nombre;
    measurementArea.innerHTML = `<section class="grid"><form id="measurementForm" class="content"><h2>Nueva medición</h2><p><b>${esc(c.NombreCompleto)}</b> · ${esc(c.Cedula)} · ${c.Edad} años</p><p>Realizada por: <b>${esc(measurementAuthor)}</b></p><input type="hidden" name="idCliente" value="${c.Id}"><input name="fechaMedicion" type="date" value="${new Date().toISOString().slice(0, 10)}" required><div class="form-grid">${measurementFields.map((f) => `<label>${f}<input name="${f}" type="number" min="0" step=".01" required></label>`).join("")}</div><button>Registrar medición</button></form><section class="content"><h2>Historial</h2>${measurementHistory(history)}</section></section>`;
    const measurementForm = $("measurementForm");
    measurementForm.onsubmit = async (e) => {
      e.preventDefault();
      try {
        await api("/mediciones", {
          method: "POST",
          body: JSON.stringify(
            Object.fromEntries(new FormData(measurementForm)),
          ),
        });
        message("Medición registrada.");
        mediciones();
      } catch (x) {
        message(x.message, 1);
      }
    };
  };
  pickerResults.onclick = async (ev) => {
    if (!ev.target.dataset.pick) return;
    const c = clients.find((x) => x.Id == ev.target.dataset.pick);
    if (c) await openClientMeasurement(c);
  };
  const requestedClientId = new URLSearchParams(location.search).get("cliente"),
    requestedClient = clients.find(
      (client) => String(client.Id) === requestedClientId && client.Activo,
    );
  if (requestedClient) {
    clientPicker.value = `${requestedClient.NombreCompleto} ${requestedClient.Cedula}`;
    draw([requestedClient]);
    await openClientMeasurement(requestedClient);
  }
}
const scheduleInputs = () =>
  days
    .map(
      (d, i) =>
        `<div class="schedule-row"><label><input type="checkbox" name="day${i + 1}"> ${d}</label><input type="time" name="start${i + 1}"><input type="time" name="end${i + 1}"></div>`,
    )
    .join("");
const getSchedule = (f) =>
  days
    .map((_, i) =>
      f.elements[`day${i + 1}`].checked
        ? {
            diaSemana: i + 1,
            horaInicio: f.elements[`start${i + 1}`].value,
            horaFin: f.elements[`end${i + 1}`].value,
          }
        : null,
    )
    .filter(Boolean);
async function entrenadores() {
  const list = await api("/entrenadores");
  view.innerHTML = `<section class="grid"><form id="trainerForm" class="content"><h2 id="trainerTitle">Registrar entrenador</h2><input type="hidden" name="id"><input name="cedula" placeholder="Usuario / cédula" required><input name="nombreCompleto" placeholder="Nombre completo" required><input name="email" type="email" placeholder="Correo" required><input name="password" type="password" placeholder="Contraseña${" (opcional al editar)"}"><h3>Horario semanal</h3>${scheduleInputs()}<div class="form-actions"><button>Guardar entrenador</button><button id="cancelTrainerEdit" class="secondary" type="button" hidden>Cancelar</button></div></form><section class="content"><h2>Entrenadores</h2><div class="list">${list.map((t) => `<article><b>${esc(t.NombreCompleto)}</b><span>${esc(t.Email)} · ${t.Activo ? "Activo" : "Inactivo"}</span><small>${formatTrainerSchedule(t.Horarios)}</small><div class="row"><button data-edit-trainer="${t.Id}">Editar</button><button class="${t.Activo ? "danger" : "success"}" data-status-trainer="${t.Id}" data-active="${!t.Activo}">${t.Activo ? "Inactivar" : "Reactivar"}</button></div></article>`).join("")}</div></section></section>`;
  const trainerForm = $("trainerForm"),
    trainerTitle = $("trainerTitle"),
    cancelTrainerEdit = $("cancelTrainerEdit");
  const resetTrainerEdit = () => {
    trainerForm.reset();
    trainerForm.elements.id.value = "";
    trainerTitle.textContent = "Registrar entrenador";
    cancelTrainerEdit.hidden = true;
  };
  cancelTrainerEdit.onclick = resetTrainerEdit;
  trainerForm.onsubmit = async (ev) => {
    ev.preventDefault();
    const data = Object.fromEntries(new FormData(trainerForm)),
      id = data.id;
    data.horarios = getSchedule(trainerForm);
    try {
      await api("/entrenadores" + (id ? "/" + id : ""), {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(data),
      });
      message("Entrenador guardado.");
      entrenadores();
    } catch (x) {
      message(x.message, 1);
    }
  };
  view.onclick = async (ev) => {
    const id = ev.target.dataset.editTrainer,
      status = ev.target.dataset.statusTrainer;
    if (id) {
      resetTrainerEdit();
      const t = list.find((x) => x.Id == id),
        el = trainerForm.elements;
      el.id.value = t.Id;
      el.cedula.value = t.Cedula;
      el.nombreCompleto.value = t.NombreCompleto;
      el.email.value = t.Email;
      t.Horarios.forEach((h) => {
        const start = formatTime(h.HoraInicio),
          end = formatTime(h.HoraFin);
        if (!start || !end) return;
        el[`day${h.DiaSemana}`].checked = true;
        el[`start${h.DiaSemana}`].value = start;
        el[`end${h.DiaSemana}`].value = end;
      });
      trainerTitle.textContent = "Editar entrenador";
      cancelTrainerEdit.hidden = false;
      trainerForm.scrollIntoView();
    } else if (status) {
      const selectedTrainer = list.find((trainer) => trainer.Id == status),
        activate = ev.target.dataset.active === "true";
      if (
        !selectedTrainer ||
        !(await confirmStatusChange({
          name: selectedTrainer.NombreCompleto,
          entity: "entrenador",
          activate,
        }))
      )
        return;
      try {
        await api(`/entrenadores/${status}/estado`, {
          method: "PATCH",
          body: JSON.stringify({ activo: activate }),
        });
        message(`Entrenador ${activate ? "reactivado" : "inactivado"}.`);
        entrenadores();
      } catch (error) {
        message(error.message, 1);
      }
    }
  };
}
async function sesiones() {
  const [c, s] = await Promise.all([
    api("/clientes"),
    api("/entrenadores/sesiones"),
  ]);
  const activeClients = c.filter((client) => client.Activo),
    trainers =
      user.rol === "Administrador" ? await api("/entrenadores") : [],
    trainerField =
      user.rol === "Entrenador"
        ? `<label class="field-label">Entrenador</label><div class="readonly-field">${esc(user.nombre)}</div><input type="hidden" name="idEntrenador" value="${user.idEntrenador}"><small class="field-note">Asignado automáticamente según la sesión iniciada.</small>`
        : `<label class="field-label" for="sessionTrainer">Entrenador</label><select id="sessionTrainer" name="idEntrenador" required><option value="">Seleccione un entrenador</option>${trainers.filter((trainer) => trainer.Activo).map((trainer) => `<option value="${trainer.Id}">${esc(trainer.NombreCompleto)}</option>`)}</select>`;
  const clientOptions = (clients) =>
    `<option value="">Seleccione un cliente</option>${clients.map((client) => `<option value="${client.Id}">${esc(client.NombreCompleto)} · ${esc(client.Cedula)}</option>`).join("")}`;
  const formatSessionDateTime = (value) =>
    new Intl.DateTimeFormat("es-CR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  const sessionCards = s
    .map((x) => {
      const status = x.Estado || "Agendado",
        statusClass =
          status === "Completado"
            ? "completed"
            : status === "Cancelado"
              ? "cancelled"
              : "";
      return `<article class="session-card"><small>CLIENTE</small><h3>${esc(x.ClienteNombre)}</h3><p>Entrenador: <b>${esc(x.EntrenadorNombre)}</b></p><p>Inicio: <b>${formatSessionDateTime(x.FechaHoraInicio)}</b></p><p>Fin: <b>${formatSessionDateTime(x.FechaHoraFin)}</b></p><span class="session-status ${statusClass}">${esc(status)}</span>${status === "Agendado" ? `<div class="row"><button class="success" data-session-status="Completado" data-session-id="${x.Id}" data-session-client="${esc(x.ClienteNombre)}">Completar</button><button class="danger" data-session-status="Cancelado" data-session-id="${x.Id}" data-session-client="${esc(x.ClienteNombre)}">Cancelar</button></div>` : ""}</article>`;
    })
    .join("");
  view.innerHTML = `<section class="grid"><form id="sessionForm" class="content"><h2>Agendar sesión</h2><label class="field-label" for="sessionClientSearch">Buscar cliente</label><input id="sessionClientSearch" type="search" placeholder="Escriba el nombre o la cédula"><label class="field-label" for="sessionClient">Cliente</label><select id="sessionClient" name="idCliente" required>${clientOptions(activeClients)}</select>${trainerField}<label class="field-label" for="sessionStart">Inicio</label><input id="sessionStart" name="fechaHoraInicio" type="datetime-local" required><label class="field-label" for="sessionEnd">Fin</label><input id="sessionEnd" name="fechaHoraFin" type="datetime-local" required><button>Agendar</button></form><section class="content"><h2>Agenda</h2><div class="session-list">${sessionCards || "<p>No hay sesiones agendadas.</p>"}</div></section></section>`;
  const sessionForm = $("sessionForm"),
    sessionClientSearch = $("sessionClientSearch"),
    sessionClient = $("sessionClient");
  sessionClientSearch.oninput = () => {
    const search = sessionClientSearch.value.trim().toLocaleLowerCase("es");
    sessionClient.innerHTML = clientOptions(
      activeClients.filter((client) =>
        `${client.NombreCompleto} ${client.Cedula}`
          .toLocaleLowerCase("es")
          .includes(search),
      ),
    );
  };
  sessionForm.onsubmit = async (ev) => {
    ev.preventDefault();
    const data = Object.fromEntries(new FormData(sessionForm));
    data.fechaHoraInicio = new Date(data.fechaHoraInicio).toISOString();
    data.fechaHoraFin = new Date(data.fechaHoraFin).toISOString();
    try {
      await api("/entrenadores/sesiones", {
        method: "POST",
        body: JSON.stringify(data),
      });
      message("Sesión agendada.");
      sesiones();
    } catch (x) {
      message(x.message, 1);
    }
  };
  view.onclick = async (ev) => {
    const sessionId = ev.target.dataset.sessionId,
      status = ev.target.dataset.sessionStatus;
    if (!sessionId || !status) return;
    if (
      !(await confirmSessionChange({
        client: ev.target.dataset.sessionClient,
        status,
      }))
    )
      return;
    try {
      await api(`/entrenadores/sesiones/${sessionId}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado: status }),
      });
      message(`Sesión marcada como ${status.toLowerCase()}.`);
      sesiones();
    } catch (error) {
      message(error.message, 1);
    }
  };
}
const screens = { inicio, clientes, mediciones, entrenadores, sesiones },
  page = document.body.dataset.page;
quick.hidden = true;
logout.hidden = page !== "inicio";
const closeSession = async () => {
  try {
    await api("/auth/logout", { method: "POST" });
  } finally {
    localStorage.removeItem("hf_user");
    location.replace("/");
  }
};
logout.onclick = closeSession;
mobileLogout.onclick = closeSession;
screens[page]().catch((error) => message(error.message, 1));
