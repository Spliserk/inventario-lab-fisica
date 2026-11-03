// 03-auth.js — Autenticación (Firebase Auth) y bitácora de auditoría
// Parte de App Inventory. Script clásico (scope global compartido).
// ═══════════════════════════════════════
//  SECURITY: Password Hashing
// ═══════════════════════════════════════
// ═══════════════════════════════════════
//  AUTH HELPERS (Firebase Auth)
// ───────────────────────────────────────
//  La autenticación la maneja Firebase Auth (email + contraseña).
//  El login es por "nombre de usuario": se resuelve a su email con el
//  mapa /usernames/{usuario} y luego se autentica contra Firebase Auth.
//  Los roles viven en /usuarios/{uid} y se validan en las reglas de
//  Firestore (firestore.rules), no en el cliente.
// ═══════════════════════════════════════

// Dominio sintético para cuentas SIN correo real (p. ej. el superadmin).
// Firebase Auth exige un email como identificador, pero como el login es por
// nombre de usuario, usamos un email interno que el usuario nunca ve ni usa.
// (.local es un dominio reservado: nunca será una bandeja real.)
const AUTH_EMAIL_DOMAIN = "appinventory.local";

// Devuelve el email de Firebase Auth a usar: el correo real si se indicó uno
// válido; si no, uno sintético derivado del nombre de usuario.
function authEmailFor(username, contactEmail) {
  const e = (contactEmail || "").trim().toLowerCase();
  if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return e;
  return username + "@" + AUTH_EMAIL_DOMAIN;
}

// Resuelve el email de Firebase Auth a partir del nombre de usuario.
async function usernameToEmail(username) {
  if (!firestoreReady || !db) return null;
  try {
    const doc = await db.collection("usernames").doc(username).get();
    return doc.exists ? (doc.data().email || null) : null;
  } catch(e) { return null; }
}

// Aplica un perfil de /usuarios y abre la app. Compartido por login y por
// la restauración de sesión (onAuthStateChanged).
async function enterApp(uid, data) {
  currentUid = uid;
  currentUsername = data.username || null;
  userRole = data.role || "usuario";
  userName = data.displayName || data.username || "Usuario";
  userEmail = data.email || null;
  userLabId = data.labId || null;
  userLabName = null;

  await loadLaboratorios();
  if (userRole === "superadmin" || userRole === "usuario") {
    currentLabId = laboratorios.length > 0 ? laboratorios[0].id : "lab_fisica";
  } else {
    // Laboratorista — solo su lab asignado
    currentLabId = userLabId;
    if (userLabId) {
      const labObj = laboratorios.find(l => l.id === userLabId);
      userLabName = labObj ? labObj.name : userLabId;
    }
  }

  document.getElementById("loginOverlay").hidden = true;
  document.getElementById("registerOverlay").hidden = true;
  document.getElementById("appMain").hidden = false;
  const loginErr = document.getElementById("loginError");
  if (loginErr) loginErr.textContent = "";
  loadSolicitudes();
  if (userRole === "superadmin") {
    viewMode = "admin-home";
    render();
  } else {
    viewMode = "dashboard";
    loadData();
    render();
  }
  updateTitleBadge();
}

// Traduce códigos de error de Firebase Auth a mensajes en español.
function authErrorMessage(e) {
  const code = (e && e.code) || "";
  const map = {
    "auth/invalid-email": "Correo electrónico no válido",
    "auth/user-disabled": "Esta cuenta está deshabilitada",
    "auth/user-not-found": "Usuario o contraseña incorrectos",
    "auth/wrong-password": "Usuario o contraseña incorrectos",
    "auth/invalid-credential": "Usuario o contraseña incorrectos",
    "auth/invalid-login-credentials": "Usuario o contraseña incorrectos",
    "auth/too-many-requests": "Demasiados intentos. Espere un momento e intente de nuevo",
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo",
    "auth/weak-password": "La contraseña es demasiado débil (mínimo 6 caracteres)",
    "auth/network-request-failed": "Error de conexión. Revise su internet",
    "auth/requires-recent-login": "Por seguridad, vuelva a iniciar sesión e intente de nuevo"
  };
  return map[code] || "Error de autenticación. Intente de nuevo";
}

// ═══════════════════════════════════════
//  AUDIT LOG
// ═══════════════════════════════════════
async function logAction(action, details) {
  if (!firestoreReady || !db) return;
  try {
    await db.collection("historial").add({
      action: action,
      details: details || "",
      user: userName || userRole || "sistema",
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      section: section,
      labId: currentLabId || null
    });
  } catch(e) { console.warn("Audit log error:", e); }
}
