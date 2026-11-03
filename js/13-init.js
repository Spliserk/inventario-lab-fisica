// 13-init.js — Arranque de la app (service worker, auth listener)
// Parte de App Inventory. Script clásico (scope global compartido).
// ═══════════════════════════════════════
//  INIT
// ═══════════════════════════════════════
// Mostrar login de inmediato; Firebase Auth decide si hay sesión activa.
showLoginScreen();
initConnectionMonitor();
// onAuthStateChanged es la puerta única: restaura sesión, login y logout.
initAuthListener();

// Registrar el Service Worker (PWA: instalable + offline). Solo en https.
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => console.warn("SW no registrado:", err));
  });
}
// Update print date on beforeprint
window.addEventListener("beforeprint", function() {
  const dateEl = document.getElementById("printDate");
  if (dateEl) dateEl.textContent = "Generado: " + new Date().toLocaleDateString("es-CO", { year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit" });
});
