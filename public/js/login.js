const form = document.querySelector("#loginForm"),
  error = document.querySelector("#error");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  error.textContent = "";
  const data = Object.fromEntries(new FormData(form));
  try {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const isJson = r.headers.get("content-type")?.includes("application/json");
    const body = isJson ? await r.json() : null;
    if (!r.ok)
      throw new Error(
        body?.message ||
          "La API no está disponible. Inicia el servidor con npm run dev para usar el acceso.",
      );
    localStorage.setItem("hf_user", JSON.stringify(body.user));
    location.href = "/dashboard.html";
  } catch (e) {
    error.textContent = e.message || "No fue posible iniciar sesión.";
  }
});
