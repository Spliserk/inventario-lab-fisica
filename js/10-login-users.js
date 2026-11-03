// 10-login-users.js — Pantalla de login y gestión de usuarios
// Parte de App Inventory. Script clásico (scope global compartido).
// ═══════════════════════════════════════
//  AUTHENTICATION (unified login)
// ═══════════════════════════════════════
// El primer superadmin se crea UNA sola vez, de forma manual y segura, desde
// la consola de Firebase (ver docs/SEGURIDAD.md). Ya NO existe un superadmin
// por defecto con contraseña pública.

// Ensure default lab exists
async function ensureDefaultLab() {
  if (!firestoreReady || !db) return;
  try {
    const doc = await db.collection("laboratorios").doc("lab_fisica").get();
    if (!doc.exists) {
      await db.collection("laboratorios").doc("lab_fisica").set({
        name: "Laboratorio de Física",
        code: "LAB-FIS",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: "sistema"
      });
    }
  } catch(e) { console.warn("Could not ensure default lab:", e); }
}

// Load list of laboratories
async function loadLaboratorios() {
  if (!firestoreReady || !db) return;
  try {
    const snap = await db.collection("laboratorios").orderBy("name").get();
    laboratorios = [];
    snap.forEach(doc => { laboratorios.push({ id: doc.id, ...doc.data() }); });
  } catch(e) { console.warn("Error loading labs:", e); }
}

async function doLogin() {
  const user = document.getElementById("loginUser").value.trim().toLowerCase();
  const pass = document.getElementById("loginPass").value;
  const errEl = document.getElementById("loginError");
  if (!user || !pass) {
    errEl.textContent = "Ingrese usuario y contraseña";
    return;
  }
  if (!firestoreReady || !auth) {
    errEl.textContent = "Sin conexión al servidor";
    return;
  }
  const btn = document.getElementById("loginBtn");
  btn.disabled = true;
  btn.textContent = "Verificando...";
  errEl.textContent = "";
  try {
    // 1) Resolver el email de Firebase Auth a partir del nombre de usuario.
    const email = await usernameToEmail(user);
    if (!email) {
      errEl.textContent = "Usuario o contraseña incorrectos";
      document.getElementById("loginUser").focus();
      btn.disabled = false; btn.textContent = "Iniciar sesión";
      return;
    }
    // 2) Autenticar. onAuthStateChanged cargará el perfil y abrirá la app.
    await auth.signInWithEmailAndPassword(email, pass);
    // No reseteamos el botón aquí: onAuthStateChanged conmuta a la app.
  } catch(e) {
    console.error("Login error:", e);
    errEl.textContent = authErrorMessage(e);
    document.getElementById("loginPass").value = "";
    document.getElementById("loginPass").focus();
    btn.disabled = false;
    btn.textContent = "Iniciar sesión";
  }
}

// Enlace "¿Olvidó su contraseña?" en la pantalla de login.
async function doForgotPassword() {
  const user = (document.getElementById("loginUser").value || "").trim().toLowerCase();
  const errEl = document.getElementById("loginError");
  if (!user) {
    errEl.innerHTML = '<span style="color:var(--amber)">Escriba su usuario y vuelva a pulsar "¿Olvidó su contraseña?"</span>';
    document.getElementById("loginUser").focus();
    return;
  }
  if (!firestoreReady || !auth) { errEl.textContent = "Sin conexión al servidor"; return; }
  try {
    const email = await usernameToEmail(user);
    if (!email) {
      // No revelamos si el usuario existe o no.
      errEl.innerHTML = '<span style="color:var(--green)">Si el usuario existe, se enviará un correo para restablecer la contraseña.</span>';
      return;
    }
    await auth.sendPasswordResetEmail(email);
    errEl.innerHTML = '<span style="color:var(--green)">Correo de restablecimiento enviado. Revise su bandeja de entrada.</span>';
  } catch(e) {
    console.error("Reset error:", e);
    errEl.innerHTML = '<span style="color:var(--green)">Si el usuario existe, se enviará un correo para restablecer la contraseña.</span>';
  }
}

async function doLogout() {
  if (firestoreUnsubscribe) { firestoreUnsubscribe(); firestoreUnsubscribe = null; }
  try { if (auth) await auth.signOut(); } catch(e) { console.warn("Logout error:", e); }
  // onAuthStateChanged limpia el estado y muestra el login.
}

// Limpia el estado de sesión y muestra la pantalla de login.
function showLoginScreen() {
  userRole = null;
  userName = null;
  currentUid = null;
  currentUsername = null;
  userEmail = null;
  userLabId = null;
  userLabName = null;
  currentLabId = null;
  viewMode = "dashboard";
  if (firestoreUnsubscribe) { firestoreUnsubscribe(); firestoreUnsubscribe = null; }
  // Limpieza de tokens heredados del esquema anterior.
  try { localStorage.removeItem("inv_auth"); localStorage.removeItem("inv_auth_user"); } catch(e) {}
  document.getElementById("loginOverlay").hidden = false;
  document.getElementById("registerOverlay").hidden = true;
  document.getElementById("appMain").hidden = true;
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  const errEl = document.getElementById("loginError");
  if (errEl) errEl.textContent = "";
}

function showRegister() {
  document.getElementById("loginOverlay").hidden = true;
  document.getElementById("registerOverlay").hidden = false;
  document.getElementById("regError").textContent = "";
  document.getElementById("regName").value = "";
  document.getElementById("regUser").value = "";
  document.getElementById("regEmail").value = "";
  document.getElementById("regPass").value = "";
  document.getElementById("regPass2").value = "";
  document.getElementById("regName").focus();
}

function showLogin() {
  document.getElementById("registerOverlay").hidden = true;
  document.getElementById("loginOverlay").hidden = false;
  document.getElementById("loginUser").focus();
}

// Evita que onAuthStateChanged reaccione durante operaciones que crean
// cuentas (registro) antes de que exista el perfil en /usuarios.
let suppressAuthHandler = false;

async function doRegister() {
  const name = document.getElementById("regName").value.trim();
  const user = document.getElementById("regUser").value.trim().toLowerCase();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const pass = document.getElementById("regPass").value;
  const pass2 = document.getElementById("regPass2").value;
  const errEl = document.getElementById("regError");

  if (!name) { errEl.textContent = "Ingrese su nombre completo"; return; }
  if (!user || user.length < 3) { errEl.textContent = "El usuario debe tener al menos 3 caracteres"; return; }
  if (!/^[a-z0-9._-]+$/.test(user)) { errEl.textContent = "El usuario solo puede tener letras, números, puntos, guiones"; return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = "Ingrese un correo válido"; return; }
  if (pass.length < 6) { errEl.textContent = "La contraseña debe tener al menos 6 caracteres"; return; }
  if (pass !== pass2) { errEl.textContent = "Las contraseñas no coinciden"; return; }

  if (!firestoreReady || !auth) { errEl.textContent = "Sin conexión al servidor"; return; }

  document.getElementById("regBtn").disabled = true;
  document.getElementById("regBtn").textContent = "Creando...";

  try {
    // ¿Nombre de usuario ya tomado? (lookup directo en el mapa)
    const taken = await db.collection("usernames").doc(user).get();
    if (taken.exists) {
      errEl.textContent = "Ese nombre de usuario ya está en uso";
      document.getElementById("regBtn").disabled = false;
      document.getElementById("regBtn").textContent = "Crear cuenta";
      return;
    }

    // Crear la cuenta en Firebase Auth. Esto inicia sesión automáticamente;
    // suprimimos el handler mientras creamos el perfil y luego cerramos sesión.
    suppressAuthHandler = true;
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    const uid = cred.user.uid;

    // Perfil (rol "usuario", sin lab) y mapa username→email.
    await db.collection("usuarios").doc(uid).set({
      username: user,
      displayName: name,
      email: email,
      role: "usuario",
      labId: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await db.collection("usernames").doc(user).set({ email: email, uid: uid });

    await auth.signOut();
    suppressAuthHandler = false;

    // Volver al login con el usuario precargado.
    showLogin();
    document.getElementById("loginUser").value = user;
    document.getElementById("loginPass").value = "";
    document.getElementById("loginPass").focus();
    document.getElementById("loginError").innerHTML = '<span style="color:var(--green)">Cuenta creada. Inicie sesión.</span>';
  } catch(e) {
    suppressAuthHandler = false;
    console.error("Register error:", e);
    errEl.textContent = authErrorMessage(e);
  }
  document.getElementById("regBtn").disabled = false;
  document.getElementById("regBtn").textContent = "Crear cuenta";
}

function openChangePasswordModal() {
  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head"><h2>Cambiar mi contraseña</h2><button class="modal-x" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="fg"><label>Contraseña actual</label><input type="password" id="cp-current" placeholder="Contraseña actual" style="letter-spacing:2px"></div>
      <div class="fg"><label>Nueva contraseña</label><input type="password" id="cp-new" placeholder="Mínimo 6 caracteres" style="letter-spacing:2px"></div>
      <div class="fg"><label>Confirmar nueva contraseña</label><input type="password" id="cp-confirm" placeholder="Repetir nueva contraseña" style="letter-spacing:2px"></div>
      <div id="cp-error" style="color:var(--red);font-size:12px;min-height:18px;margin-top:4px"></div>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-accent" id="cp-save-btn" onclick="saveMyPassword()">Guardar</button>
    </div>`;
  document.getElementById("modalBg").hidden = false;
  document.getElementById("cp-current").focus();
}

async function saveMyPassword() {
  const current = document.getElementById("cp-current").value;
  const newPass = document.getElementById("cp-new").value;
  const confirmPass = document.getElementById("cp-confirm").value;
  const errEl = document.getElementById("cp-error");

  if (!current || !newPass || !confirmPass) { errEl.textContent = "Complete todos los campos"; return; }
  if (newPass.length < 6) { errEl.textContent = "La nueva contraseña debe tener al menos 6 caracteres"; return; }
  if (newPass !== confirmPass) { errEl.textContent = "Las contraseñas no coinciden"; return; }
  if (!auth || !auth.currentUser) { errEl.textContent = "Sesión no válida. Vuelva a iniciar sesión."; return; }

  document.getElementById("cp-save-btn").disabled = true;
  document.getElementById("cp-save-btn").textContent = "Guardando...";
  try {
    const u = auth.currentUser;
    // Reautenticar con la contraseña actual antes de cambiarla.
    const cred = firebase.auth.EmailAuthProvider.credential(u.email, current);
    await u.reauthenticateWithCredential(cred);
    await u.updatePassword(newPass);
    logAction("cambiar_contraseña", "Contraseña actualizada por " + userName);
    closeModal();
    toast("Contraseña actualizada");
  } catch(e) {
    console.error("Error saving password:", e);
    errEl.textContent = (e && (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential"))
      ? "Contraseña actual incorrecta"
      : authErrorMessage(e);
    document.getElementById("cp-save-btn").disabled = false;
    document.getElementById("cp-save-btn").textContent = "Guardar";
  }
}

// Escucha los cambios de sesión de Firebase Auth. Es la ÚNICA puerta de
// entrada a la app: al cargar la página, al iniciar sesión y al cerrarla.
function initAuthListener() {
  if (!auth) {
    // Sin Firebase: mostrar login (la app no funciona sin backend).
    showLoginScreen();
    return;
  }
  auth.onAuthStateChanged(async (user) => {
    if (suppressAuthHandler) return;
    if (!user) {
      showLoginScreen();
      return;
    }
    try {
      const doc = await db.collection("usuarios").doc(user.uid).get();
      if (!doc.exists) {
        // Cuenta de Auth sin perfil: acceso no autorizado.
        await auth.signOut();
        showLoginScreen();
        const errEl = document.getElementById("loginError");
        if (errEl) errEl.innerHTML = '<span style="color:var(--red)">Tu cuenta no tiene un perfil activo. Contacta al administrador.</span>';
        return;
      }
      await enterApp(user.uid, doc.data());
    } catch(e) {
      console.error("Auth state error:", e);
      showLoginScreen();
      const errEl = document.getElementById("loginError");
      if (errEl) errEl.textContent = "Error al cargar tu perfil. Intente de nuevo.";
    }
  });
}

// ═══════════════════════════════════════
//  USER ACCOUNT MANAGEMENT
// ═══════════════════════════════════════
function openUserManager(global) {
  if (userRole !== "superadmin" && userRole !== "laboratorista") return;
  if (global && userRole === "superadmin") {
    // Called from admin-home — clear lab context so sidebar hides
    if (firestoreUnsubscribe) { firestoreUnsubscribe(); firestoreUnsubscribe = null; }
    currentLabId = null;
  }
  currentLoc = null; currentDrawer = null;
  viewMode = "users";
  render();
}

function getRoleLabel(role) {
  const labels = { superadmin: "Super Admin", laboratorista: "Laboratorista", usuario: "Usuario", editor: "Laboratorista", lector: "Usuario" };
  return labels[role] || role;
}

function getRoleColor(role) {
  const colors = { superadmin: "var(--purple)", laboratorista: "var(--accent)", usuario: "var(--green)", editor: "var(--accent)", lector: "var(--green)" };
  return colors[role] || "var(--text-sec)";
}

async function renderUsersPanel() {
  const isSuperadmin = userRole === "superadmin";
  let html = '<div class="users-panel">';
  html += '<div class="users-heading"><div><h2>Gestión de Usuarios</h2><p>Administra cuentas y permisos de acceso.</p></div>';
  if (isSuperadmin) {
    html += '<button class="btn btn-accent btn-sm" onclick="openAddUserModal()"><span class="mi" style="font-size:18px">person_add</span> Nuevo usuario</button>';
  }
  html += '</div>';

  if (!firestoreReady) {
    html += '<p style="color:var(--text-sec)">Sin conexión a Firestore</p>';
  } else {
    try {
      const snap = await db.collection("usuarios").orderBy("username").get();
      if (snap.empty) {
        html += '<div class="users-empty">No hay usuarios creados aún</div>';
      } else {
        html += '<div class="users-search"><span class="mi">search</span><input type="search" placeholder="Buscar por nombre, usuario, rol o correo" aria-label="Buscar usuarios" oninput="filterUsers(this.value)"></div>';
        html += '<div class="users-list">';
        snap.forEach(doc => {
          const u = doc.data();
          // Laboratoristas only see users assigned to their lab
          if (userRole === "laboratorista" && u.role !== "usuario") return;
          if (userRole === "laboratorista" && u.labId !== userLabId) return;
          const role = u.role || "usuario";
          const labName = u.labId ? (laboratorios.find(l=>l.id===u.labId)||{}).name || u.labId : "—";
          const searchText = [u.displayName||u.username, u.username, u.email||"", role, labName].join(" ").toLocaleLowerCase();
          html += `<div class="user-card" data-search="${esc(searchText)}">
            <div class="user-info"><span class="user-name">${esc(u.displayName||u.username)}</span>
            <div class="user-meta"><span class="user-username">@${esc(u.username)}</span><span class="user-role" style="color:${getRoleColor(role)};font-weight:600">${getRoleLabel(role)}</span>
            ${role !== "superadmin" ? `<span style="color:var(--text-dim);font-size:12px">🔬 ${esc(labName)}</span>` : ''}
            ${u.email ? `<span class="user-email">${esc(u.email)}</span>` : '<span class="user-missing-email">Sin correo</span>'}</div></div>
            <div class="user-actions">
              ${isSuperadmin && role !== "superadmin" ? `<details class="user-menu">
                <summary class="user-action" title="Más acciones" aria-label="Más acciones" aria-haspopup="menu"><span class="mi">more_vert</span></summary>
                <div class="user-menu-popover" role="menu">
                  <button class="user-menu-item" role="menuitem" onclick="this.closest('details').open=false;editUserDetails('${doc.id}','${esc(u.username)}','${esc(u.email||"")}','${esc(role)}','${esc(u.labId||"")}')"><span class="mi">edit</span>Editar</button>
                  <button class="user-menu-item" role="menuitem" onclick="this.closest('details').open=false;resetUserPassword('${doc.id}','${esc(u.username)}','${esc(u.email||"")}')"><span class="mi">key</span>Restablecer contraseña</button>
                  <button class="user-menu-item danger" role="menuitem" onclick="this.closest('details').open=false;deleteUser('${doc.id}','${esc(u.username)}')"><span class="mi">delete</span>Eliminar</button>
                </div>
              </details>` : ''}
            </div>
          </div>`;
        });
        html += '</div><div class="users-empty" id="usersNoResults" role="status" hidden>No se encontraron usuarios.</div>';
      }
    } catch(e) {
      html += '<p style="color:var(--red)">Error cargando usuarios</p>';
    }
  }
  html += '</div>';
  document.getElementById("content").innerHTML = html;
}

function filterUsers(query) {
  const term = query.trim().toLocaleLowerCase();
  const cards = document.querySelectorAll(".user-card");
  let visibleCount = 0;
  cards.forEach(card => {
    const matches = card.dataset.search.includes(term);
    card.hidden = !matches;
    if (matches) visibleCount++;
  });
  const noResults = document.getElementById("usersNoResults");
  if (noResults) noResults.hidden = visibleCount > 0;
}

function openAddUserModal() {
  const labOptions = laboratorios.map(l => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('');
  const roleOptions = userRole === "superadmin"
    ? `<option value="laboratorista">Laboratorista</option><option value="usuario">Usuario</option>`
    : `<option value="usuario">Usuario</option>`;
  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head"><h2>Crear usuario</h2><button class="modal-x" onclick="closeModal()" aria-label="Cerrar">&times;</button></div>
    <div class="modal-body">
      <div class="fg"><label for="f-newname">Nombre para mostrar</label><input id="f-newname" placeholder="Ej: Juan Pérez"></div>
      <div class="fg"><label for="f-newemail">Correo electrónico (opcional)</label><input id="f-newemail" type="email" placeholder="Opcional — sin correo no recibe notificaciones"></div>
      <div class="fg"><label for="f-newuser">Nombre de usuario (login)</label><input id="f-newuser" placeholder="Ej: juanperez" oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9._-]/g,'')"></div>
      <div class="fg"><label for="f-newpass">Contraseña</label><input id="f-newpass" type="password" placeholder="Mínimo 6 caracteres"></div>
      <div class="fg"><label for="f-newrole">Rol</label><select id="f-newrole">${roleOptions}</select></div>
      <div class="fg"><label for="f-newlab">Laboratorio asignado</label><select id="f-newlab">${labOptions || '<option value="">Sin laboratorios</option>'}</select></div>
    </div>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-accent" onclick="saveNewUser()">Crear usuario</button></div>`;
  document.getElementById("modalBg").hidden = false;
}

async function saveNewUser() {
  const displayName = document.getElementById("f-newname").value.trim();
  const email = document.getElementById("f-newemail").value.trim();
  const username = document.getElementById("f-newuser").value.trim().toLowerCase();
  const password = document.getElementById("f-newpass").value;
  const role = document.getElementById("f-newrole").value;
  const labId = document.getElementById("f-newlab").value;
  const contactEmail = email.toLowerCase();
  if (!displayName) { toast("Ingrese un nombre"); return; }
  // El correo es OPCIONAL. Si se indica, debe ser válido; si no, la cuenta usa
  // un email sintético interno (no recibirá notificaciones ni reset por correo).
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) { toast("Correo electrónico no válido"); return; }
  if (!username || username.length < 3) { toast("Usuario debe tener al menos 3 caracteres"); return; }
  if (!/^[a-z0-9._-]+$/.test(username)) { toast("Usuario solo puede tener letras, números, puntos, guiones"); return; }
  if (!password || password.length < 6) { toast("Contraseña debe tener al menos 6 caracteres"); return; }
  if (!labId) { toast("Seleccione un laboratorio"); return; }
  if (!firestoreReady || !auth) { toast("Sin conexión a Firestore"); return; }

  const loginEmail = authEmailFor(username, contactEmail); // real o sintético

  // Segunda instancia de Firebase: crea la cuenta sin tocar la sesión del admin.
  let secondary = null;
  try {
    const taken = await db.collection("usernames").doc(username).get();
    if (taken.exists) { toast("Ese nombre de usuario ya existe"); return; }

    secondary = firebase.initializeApp(firebaseConfig, "secondary-" + Date.now());
    const cred = await secondary.auth().createUserWithEmailAndPassword(loginEmail, password);
    const uid = cred.user.uid;
    await secondary.auth().signOut();

    // El admin (sesión principal) escribe el perfil y el mapa username.
    // usuarios.email = correo de CONTACTO (vacío si no se indicó).
    // usernames.email = email de LOGIN de Auth (real o sintético).
    await db.collection("usuarios").doc(uid).set({
      username: username,
      displayName: displayName,
      email: contactEmail,
      role: role,
      labId: labId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await db.collection("usernames").doc(username).set({ email: loginEmail, uid: uid });

    logAction("crear_usuario", `${displayName} (@${username}) — ${getRoleLabel(role)}`);
    closeModal();
    toast("Usuario '" + displayName + "' creado");
    renderUsersPanel();
  } catch(e) {
    console.error("Error creating user:", e);
    toast(authErrorMessage(e));
  } finally {
    if (secondary) { try { await secondary.delete(); } catch(e) {} }
  }
}

function editUserDetails(docId, username, currentEmail, currentRole, currentLabId) {
  const labOptions = laboratorios.map(l =>
    `<option value="${esc(l.id)}" ${l.id === currentLabId ? 'selected' : ''}>${esc(l.name)}</option>`
  ).join('');
  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head"><h2>Editar usuario — @${esc(username)}</h2><button class="modal-x" onclick="closeModal()" aria-label="Cerrar">&times;</button></div>
    <div class="modal-body">
      <div class="fg"><label>Correo (login)</label><input type="email" value="${esc(currentEmail)}" disabled style="opacity:.6"><small style="color:var(--text-dim)">El correo de inicio de sesión no se puede cambiar desde aquí.</small></div>
      <div class="fg"><label for="f-editrole">Rol</label><select id="f-editrole">
        <option value="laboratorista" ${currentRole==="laboratorista"?"selected":""}>Laboratorista</option>
        <option value="usuario" ${currentRole==="usuario"?"selected":""}>Usuario</option>
      </select></div>
      <div class="fg"><label for="f-editlab">Laboratorio asignado</label><select id="f-editlab">${labOptions}</select></div>
    </div>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-accent" onclick="doSaveUserDetails('${docId}')">Guardar</button></div>`;
  document.getElementById("modalBg").hidden = false;
}

async function doSaveUserDetails(docId) {
  const role = document.getElementById("f-editrole").value;
  const labId = document.getElementById("f-editlab").value;
  if (!labId) { toast("Seleccione un laboratorio"); return; }
  try {
    await db.collection("usuarios").doc(docId).update({ role, labId });
    logAction("editar_usuario", `${docId} → ${getRoleLabel(role)}`);
    closeModal();
    toast("Usuario actualizado");
    renderUsersPanel();
  } catch(e) { console.error(e); toast("Error al actualizar"); }
}

async function deleteUser(docId, username) {
  showConfirm("¿Eliminar usuario @" + esc(username) + "? Perderá el acceso de inmediato.", async function() {
    try {
      await db.collection("usuarios").doc(docId).delete();
      try { await db.collection("usernames").doc(username).delete(); } catch(e) {}
      logAction("eliminar_usuario", "@" + username);
      toast("Usuario eliminado");
      renderUsersPanel();
    } catch(e) { console.error(e); toast("Error al eliminar"); }
  });
}

// El admin no puede fijar la contraseña de otra cuenta desde el navegador
// (eso requiere backend). En su lugar, envía un correo de restablecimiento
// para que el propio usuario elija su nueva contraseña.
async function resetUserPassword(docId, username, email) {
  const safeEmail = email || "";
  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head"><h2>Restablecer contraseña — @${esc(username)}</h2><button class="modal-x" onclick="closeModal()" aria-label="Cerrar">&times;</button></div>
    <div class="modal-body">
      <p style="color:var(--text-sec);font-size:14px;line-height:1.5">Se enviará un correo a <strong>${esc(safeEmail || "(sin correo)")}</strong> con un enlace para que el usuario establezca una nueva contraseña.</p>
    </div>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-accent" onclick="doSendReset('${esc(safeEmail)}','${esc(username)}')" ${safeEmail ? "" : "disabled"}>Enviar correo</button></div>`;
  document.getElementById("modalBg").hidden = false;
}

async function doSendReset(email, username) {
  if (!email || !auth) { toast("Sin correo registrado"); return; }
  try {
    await auth.sendPasswordResetEmail(email);
    logAction("reset_contraseña", "Enlace enviado a @" + username);
    closeModal();
    toast("Correo de restablecimiento enviado");
  } catch(e) { console.error(e); toast(authErrorMessage(e)); }
}

// editUserEmail replaced by editUserDetails above
