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
      /[&<>]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
    ),
  message = (x, b = 0) => {
    notice.textContent = x;
    notice.className = b ? "error" : "ok";
  };
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
function measurementHistory(items) {
  return `<div class="measurement-history">${items.map((m) => `<article><h3>${new Date(m.FechaMedicion).toLocaleDateString()}</h3><div class="detail-grid">${measurementFields.map((f) => `<span><small>${f}</small><b>${m[f] ?? "—"}</b></span>`).join("")}</div></article>`).join("") || "<p>No hay mediciones registradas.</p>"}</div>`;
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
  return `<div class="list">${list.map((c) => `<article><b>${esc(c.NombreCompleto)}</b><span>${esc(c.Cedula)} · ${c.Edad} años · ${esc(c.PlanAdquirido)}</span><div class="row"><button data-history="${c.Id}">Ver mediciones</button>${user.rol === "Administrador" ? `<button data-edit-client="${c.Id}">Editar</button><button class="danger" data-status-client="${c.Id}" data-active="${!c.Activo}">${c.Activo ? "Inactivar" : "Reactivar"}</button>` : ""}</div></article>`).join("")}</div>`;
}
async function clientes() {
  const clients = await api("/clientes");
  view.innerHTML = `<section class="grid"><form id="clientForm" class="content"><h2 id="clientTitle">Registrar cliente</h2><input type="hidden" name="id"><input name="cedula" placeholder="Cédula" required><input name="nombreCompleto" placeholder="Nombre completo" required><input name="edad" type="number" min="1" max="120" placeholder="Edad" required><input name="planAdquirido" placeholder="Plan adquirido" required><textarea name="lesionesEnfermedades" placeholder="Lesiones o enfermedades"></textarea><button>Guardar cliente</button></form><section class="content"><h2>Clientes</h2><input id="clientSearch" placeholder="Buscar por nombre o cédula"><div id="clientList">${clientCards(clients)}</div></section></section>`;
  const clientForm = $("clientForm"),
    clientTitle = $("clientTitle"),
    clientSearch = $("clientSearch"),
    clientList = $("clientList");
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
  clientSearch.oninput = async () =>
    (clientList.innerHTML = clientCards(
      await api("/clientes?buscar=" + encodeURIComponent(clientSearch.value)),
    ));
  view.onclick = async (ev) => {
    const h = ev.target.dataset.history,
      edit = ev.target.dataset.editClient,
      status = ev.target.dataset.statusClient;
    if (h) {
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
      clientForm.scrollIntoView();
    } else if (status) {
      await api(`/clientes/${status}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ activo: ev.target.dataset.active === "true" }),
      });
      clientes();
    }
  };
}
async function mediciones() {
  const [clients, trainers] = await Promise.all([
    api("/clientes"),
    api("/entrenadores"),
  ]);
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
  pickerResults.onclick = async (ev) => {
    if (!ev.target.dataset.pick) return;
    const c = clients.find((x) => x.Id == ev.target.dataset.pick),
      history = await api("/mediciones/cliente/" + c.Id);
    measurementArea.innerHTML = `<section class="grid"><form id="measurementForm" class="content"><h2>Nueva medición</h2><p><b>${esc(c.NombreCompleto)}</b> · ${esc(c.Cedula)} · ${c.Edad} años</p><input type="hidden" name="idCliente" value="${c.Id}">${user.rol === "Administrador" ? `<select name="idEntrenador" required><option value="">Entrenador responsable</option>${trainers.filter((t) => t.Activo).map((t) => `<option value="${t.Id}">${esc(t.NombreCompleto)}</option>`)}</select>` : ""}<input name="fechaMedicion" type="date" value="${new Date().toISOString().slice(0, 10)}" required><div class="form-grid">${measurementFields.map((f) => `<label>${f}<input name="${f}" type="number" step=".01"></label>`).join("")}</div><button>Registrar medición</button></form><section class="content"><h2>Historial</h2>${measurementHistory(history)}</section></section>`;
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
  view.innerHTML = `<section class="grid"><form id="trainerForm" class="content"><h2 id="trainerTitle">Registrar entrenador</h2><input type="hidden" name="id"><input name="cedula" placeholder="Usuario / cédula" required><input name="nombreCompleto" placeholder="Nombre completo" required><input name="email" type="email" placeholder="Correo" required><input name="password" type="password" placeholder="Contraseña${" (opcional al editar)"}"><h3>Horario semanal</h3>${scheduleInputs()}<button>Guardar entrenador</button></form><section class="content"><h2>Entrenadores</h2><div class="list">${list.map((t) => `<article><b>${esc(t.NombreCompleto)}</b><span>${esc(t.Email)} · ${t.Activo ? "Activo" : "Inactivo"}</span><small>${t.Horarios.map((h) => days[h.DiaSemana - 1] + " " + String(h.HoraInicio).match(/T(\d\d:\d\d)/)?.[1] + "–" + String(h.HoraFin).match(/T(\d\d:\d\d)/)?.[1]).join(" · ")}</small><div class="row"><button data-edit-trainer="${t.Id}">Editar</button><button class="danger" data-status-trainer="${t.Id}" data-active="${!t.Activo}">${t.Activo ? "Inactivar" : "Reactivar"}</button></div></article>`).join("")}</div></section></section>`;
  const trainerForm = $("trainerForm"),
    trainerTitle = $("trainerTitle");
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
      const t = list.find((x) => x.Id == id),
        el = trainerForm.elements;
      el.id.value = t.Id;
      el.cedula.value = t.Cedula;
      el.nombreCompleto.value = t.NombreCompleto;
      el.email.value = t.Email;
      t.Horarios.forEach((h) => {
        el[`day${h.DiaSemana}`].checked = true;
        el[`start${h.DiaSemana}`].value =
          String(h.HoraInicio).match(/T(\d\d:\d\d)/)?.[1] || "";
        el[`end${h.DiaSemana}`].value =
          String(h.HoraFin).match(/T(\d\d:\d\d)/)?.[1] || "";
      });
      trainerTitle.textContent = "Editar entrenador";
      trainerForm.scrollIntoView();
    } else if (status) {
      await api(`/entrenadores/${status}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ activo: ev.target.dataset.active === "true" }),
      });
      entrenadores();
    }
  };
}
async function sesiones() {
  const [c, t, s] = await Promise.all([
    api("/clientes"),
    api("/entrenadores"),
    api("/entrenadores/sesiones"),
  ]);
  view.innerHTML = `<section class="grid"><form id="sessionForm" class="content"><h2>Agendar sesión</h2><select name="idCliente" required>${c.filter((x) => x.Activo).map((x) => `<option value="${x.Id}">${esc(x.NombreCompleto)}</option>`)}</select><select name="idEntrenador" required>${t.filter((x) => x.Activo).map((x) => `<option value="${x.Id}" ${x.Id == user.idEntrenador ? "selected" : ""}>${esc(x.NombreCompleto)}</option>`)}</select><input name="fechaHoraInicio" type="datetime-local" required><input name="fechaHoraFin" type="datetime-local" required><button>Agendar</button></form><section class="content"><h2>Agenda</h2>${s.map((x) => `<p>${esc(x.ClienteNombre)} · ${new Date(x.FechaHoraInicio).toLocaleString()}</p>`).join("")}</section></section>`;
  const sessionForm = $("sessionForm");
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
}
const screens = { inicio, clientes, mediciones, entrenadores, sesiones },
  page = document.body.dataset.page;
quick.hidden = page !== "clientes";
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
