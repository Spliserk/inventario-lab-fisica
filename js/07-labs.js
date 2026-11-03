// 07-labs.js — Gestión de laboratorios (superadmin)
// Parte de App Inventory. Script clásico (scope global compartido).
// ═══════════════════════════════════════
//  LAB MANAGEMENT (superadmin only)
// ═══════════════════════════════════════
function openLabManager(global) {
  if (userRole !== "superadmin") return;
  if (global) {
    if (firestoreUnsubscribe) { firestoreUnsubscribe(); firestoreUnsubscribe = null; }
    currentLabId = null;
  }
  currentLoc = null; currentDrawer = null;
  viewMode = "labs";
  render();
}

async function renderAdminHome() {
  const el = document.getElementById("content");
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.add("sidebar-hidden");

  let html = '<div class="admin-home">';
  html += '<h2>Panel de Laboratorios</h2>';
  html += `<p class="admin-sub">Bienvenido, ${esc(userName)}. Selecciona un laboratorio para ver su inventario.</p>`;

  // Action buttons
  html += '<div class="admin-actions">';
  html += '<button class="admin-action-btn" onclick="openUserManager(true)"><span class="mi" style="font-size:20px">group</span> Usuarios</button>';
  html += '<button class="admin-action-btn" onclick="openLabManager(true)"><span class="mi" style="font-size:20px">settings</span> Gestionar Labs</button>';
  html += '<button class="admin-action-btn" onclick="openAddLabModal()"><span class="mi" style="font-size:20px">add_circle</span> Nuevo Lab</button>';
  const totalPending = solicitudes.filter(s => s.status === "pendiente").length;
  html += `<button class="admin-action-btn" onclick="openSolicitudesPanel(true)" style="position:relative"><span class="mi" style="font-size:20px">assignment</span> Solicitudes${totalPending ? ' <span style="background:var(--amber);color:#fff;font-size:11px;padding:1px 6px;border-radius:10px;font-weight:600">'+totalPending+'</span>' : ''}</button>`;
  html += '<button class="admin-action-btn" onclick="openAuditLog(true)"><span class="mi" style="font-size:20px">history</span> Historial</button>';
  html += '</div>';

  // Lab cards grid
  html += '<div class="admin-home-grid">';
  if (laboratorios.length === 0) {
    html += '<p style="color:var(--text-sec);grid-column:1/-1">No hay laboratorios creados. Crea uno para empezar.</p>';
  } else {
    for (const lab of laboratorios) {
      let itemCount = 0;
      let userCount = 0;
      try {
        const invDoc = await db.collection("inventario").doc(lab.id).get();
        if (invDoc.exists) {
          const d = invDoc.data();
          itemCount = (d.items || []).length;
        }
      } catch(e) {}
      try {
        const uSnap = await db.collection("usuarios").where("labId","==",lab.id).get();
        userCount = uSnap.size;
      } catch(e) {}
      const pendingSol = solicitudes.filter(s => (s.labId || "lab_fisica") === lab.id && s.status === "pendiente").length;
      const approvedSol = solicitudes.filter(s => (s.labId || "lab_fisica") === lab.id && s.status === "aprobada").length;
      html += `<div class="admin-lab-card" onclick="enterLab('${esc(lab.id)}')">
        <div class="lab-card-icon">🔬</div>
        <div class="lab-card-name">${esc(lab.name)}</div>
        ${lab.code ? `<div class="lab-card-code">${esc(lab.code)}</div>` : ''}
        <div class="lab-card-stats">
          <span class="lab-card-stat"><span class="mi" style="font-size:16px">inventory_2</span> ${itemCount} ítems</span>
          <span class="lab-card-stat"><span class="mi" style="font-size:16px">person</span> ${userCount} usuarios</span>
        </div>
        ${(pendingSol || approvedSol) ? `<div class="lab-card-stats" style="margin-top:4px">
          ${pendingSol ? `<span class="lab-card-stat" style="color:var(--amber)"><span class="mi" style="font-size:16px">pending_actions</span> ${pendingSol} pendiente${pendingSol>1?"s":""}</span>` : ''}
          ${approvedSol ? `<span class="lab-card-stat" style="color:var(--green)"><span class="mi" style="font-size:16px">assignment_turned_in</span> ${approvedSol} prestado${approvedSol>1?"s":""}</span>` : ''}
        </div>` : ''}
      </div>`;
    }
  }
  html += '</div>';

  // Footer with theme/logout
  html += `<div style="display:flex;gap:12px;align-items:center;margin-top:16px;padding-top:16px;border-top:1px solid var(--border-light)">
    <button class="admin-action-btn" onclick="toggleTheme()"><span class="mi" style="font-size:18px">dark_mode</span> Tema</button>
    <button class="admin-action-btn" onclick="openChangePasswordModal()"><span class="mi" style="font-size:18px">key</span> Contraseña</button>
    <span style="flex:1"></span>
    <button class="admin-action-btn" onclick="doLogout()" style="color:var(--red)"><span class="mi" style="font-size:18px">logout</span> Salir</button>
  </div>`;

  html += '</div>';
  el.innerHTML = html;
}

function enterLab(labId) {
  currentLabId = labId;
  const lab = laboratorios.find(l => l.id === labId);
  if (lab) userLabName = lab.name;
  // Show the sidebar again
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.remove("sidebar-hidden");
  viewMode = "dashboard";
  if (firestoreUnsubscribe) { firestoreUnsubscribe(); firestoreUnsubscribe = null; }
  items = []; nextId = 1; locCodes = {}; customMaterialesLocs = []; customEquiposLocs = []; drawerNotes = {}; trash = [];
  currentLoc = null; currentDrawer = null;
  loadData();
  render();
}

async function renderLabsPanel() {
  let html = '<div class="users-panel">';
  html += '<div class="users-heading"><div><h2>Gestión de Laboratorios</h2><p>Crea y administra los laboratorios del sistema.</p></div>';
  html += '<button class="btn btn-accent btn-sm" onclick="openAddLabModal()"><span class="mi" style="font-size:18px">add_circle</span> Nuevo laboratorio</button></div>';

  if (!firestoreReady) {
    html += '<p style="color:var(--text-sec)">Sin conexión a Firestore</p>';
  } else {
    try {
      await loadLaboratorios();
      if (laboratorios.length === 0) {
        html += '<div class="users-empty">No hay laboratorios creados aún</div>';
      } else {
        html += '<div class="users-list">';
        for (const lab of laboratorios) {
          // Count users assigned to this lab
          let userCount = 0;
          try {
            const snap = await db.collection("usuarios").where("labId","==",lab.id).get();
            userCount = snap.size;
          } catch(e) {}
          html += `<div class="user-card">
            <div class="user-info"><span class="user-name">🔬 ${esc(lab.name)}</span>
            <div class="user-meta"><span style="color:var(--text-dim)">ID: ${esc(lab.id)}</span>
            ${lab.code ? `<span style="color:var(--text-dim)">Código: ${esc(lab.code)}</span>` : ''}
            <span style="color:var(--text-dim)">${userCount} usuario(s) asignado(s)</span>
            <span style="color:var(--text-dim)">Préstamo: ${(lab.loanType||"dia")==="hora"?"por horas":"por días"}</span></div></div>
            <div class="user-actions">
              <details class="user-menu">
                <summary class="user-action" title="Más acciones"><span class="mi">more_vert</span></summary>
                <div class="user-menu-popover" role="menu">
                  <button class="user-menu-item" role="menuitem" onclick="this.closest('details').open=false;editLab('${esc(lab.id)}','${esc(lab.name)}','${esc(lab.code||"")}','${esc(lab.loanType||"dia")}')"><span class="mi">edit</span>Editar</button>
                  ${lab.id !== 'lab_fisica' ? `<button class="user-menu-item danger" role="menuitem" onclick="this.closest('details').open=false;deleteLabFromSystem('${esc(lab.id)}','${esc(lab.name)}')"><span class="mi">delete</span>Eliminar</button>` : ''}
                </div>
              </details>
            </div>
          </div>`;
        }
        html += '</div>';
      }
    } catch(e) {
      html += '<p style="color:var(--red)">Error cargando laboratorios</p>';
    }
  }
  html += '</div>';
  document.getElementById("content").innerHTML = html;
}

function openAddLabModal() {
  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head"><h2>Crear laboratorio</h2><button class="modal-x" onclick="closeModal()" aria-label="Cerrar">&times;</button></div>
    <div class="modal-body">
      <div class="fg"><label for="f-labname">Nombre del laboratorio</label><input id="f-labname" placeholder="Ej: Laboratorio de Química"></div>
      <div class="fg"><label for="f-labcode">Código (opcional)</label><input id="f-labcode" placeholder="Ej: LAB-QUI" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9-_]/g,'')"></div>
      <div class="fg"><label for="f-labloan">Tipo de préstamo</label>
        <select id="f-labloan" style="padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface-alt);color:var(--text);font-size:14px;font-family:var(--body)">
          <option value="dia">Por día (fecha de devolución)</option>
          <option value="hora">Por hora (fecha y hora de devolución)</option>
        </select>
      </div>
    </div>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-accent" onclick="saveNewLab()">Crear</button></div>`;
  document.getElementById("modalBg").hidden = false;
}

async function saveNewLab() {
  const name = document.getElementById("f-labname").value.trim();
  const code = document.getElementById("f-labcode").value.trim();
  const loanTypeEl = document.getElementById("f-labloan");
  const loanType = loanTypeEl ? loanTypeEl.value : "dia";
  if (!name) { toast("Ingrese un nombre"); return; }
  if (!firestoreReady) { toast("Sin conexión"); return; }
  try {
    // Generate ID from name
    const labId = "lab_" + name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
    const existing = await db.collection("laboratorios").doc(labId).get();
    if (existing.exists) { toast("Ya existe un laboratorio con ese nombre"); return; }
    await db.collection("laboratorios").doc(labId).set({
      name: name,
      code: code || "",
      loanType: loanType,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: userName
    });
    // Create empty inventory doc for the new lab
    await db.collection("inventario").doc(labId).set({
      items: [],
      nextId: 1,
      locCodes: {},
      customMaterialesLocs: [],
      customEquiposLocs: [],
      drawerNotes: {},
      trash: [],
      dataVersion: 14,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    logAction("crear_laboratorio", name);
    closeModal();
    toast("Laboratorio '" + name + "' creado");
    await loadLaboratorios();
    if (viewMode === "admin-home") {
      renderAdminHome();
    } else {
      renderLabsPanel();
    }
    updateRoleUI();
  } catch(e) {
    console.error("Error creating lab:", e);
    toast("Error al crear laboratorio");
  }
}

function editLab(labId, currentName, currentCode, currentLoanType) {
  const lt = currentLoanType || "dia";
  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head"><h2>Editar laboratorio</h2><button class="modal-x" onclick="closeModal()" aria-label="Cerrar">&times;</button></div>
    <div class="modal-body">
      <div class="fg"><label for="f-labname">Nombre</label><input id="f-labname" value="${esc(currentName)}"></div>
      <div class="fg"><label for="f-labcode">Código</label><input id="f-labcode" value="${esc(currentCode)}" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9-_]/g,'')"></div>
      <div class="fg"><label for="f-labloan">Tipo de préstamo</label>
        <select id="f-labloan" style="padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface-alt);color:var(--text);font-size:14px;font-family:var(--body)">
          <option value="dia" ${lt==="dia"?"selected":""}>Por día (fecha de devolución)</option>
          <option value="hora" ${lt==="hora"?"selected":""}>Por hora (fecha y hora de devolución)</option>
        </select>
      </div>
    </div>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-accent" onclick="doSaveLab('${esc(labId)}')">Guardar</button></div>`;
  document.getElementById("modalBg").hidden = false;
}

async function doSaveLab(labId) {
  const name = document.getElementById("f-labname").value.trim();
  const code = document.getElementById("f-labcode").value.trim();
  const loanTypeEl = document.getElementById("f-labloan");
  const loanType = loanTypeEl ? loanTypeEl.value : "dia";
  if (!name) { toast("Ingrese un nombre"); return; }
  try {
    await db.collection("laboratorios").doc(labId).update({ name, code, loanType });
    closeModal();
    toast("Laboratorio actualizado");
    await loadLaboratorios();
    if (viewMode === "admin-home") {
      renderAdminHome();
    } else {
      renderLabsPanel();
    }
    updateRoleUI();
  } catch(e) { toast("Error al actualizar"); }
}

async function deleteLabFromSystem(labId, labName) {
  showConfirm("¿Eliminar el laboratorio '" + esc(labName) + "'? Se perderá todo su inventario y se desasignarán los usuarios.", async function() {
    try {
      // Delete lab inventory
      await db.collection("inventario").doc(labId).delete();
      // Unassign users
      const snap = await db.collection("usuarios").where("labId","==",labId).get();
      for (const doc of snap.docs) {
        await db.collection("usuarios").doc(doc.id).update({ labId: null });
      }
      // Delete lab
      await db.collection("laboratorios").doc(labId).delete();
      logAction("eliminar_laboratorio", labName);
      toast("Laboratorio eliminado");
      await loadLaboratorios();
      if (currentLabId === labId) {
        currentLabId = laboratorios.length > 0 ? laboratorios[0].id : null;
        if (currentLabId) loadData();
      }
      if (viewMode === "admin-home") {
        renderAdminHome();
      } else {
        renderLabsPanel();
      }
      updateRoleUI();
    } catch(e) { toast("Error al eliminar"); }
  });
}

async function switchLab(labId) {
  if (currentLabId === labId) return;
  currentLabId = labId;
  // Unsubscribe old listener
  if (firestoreUnsubscribe) { firestoreUnsubscribe(); firestoreUnsubscribe = null; }
  // Reset inventory state
  items = [];
  nextId = 1;
  locCodes = {};
  customMaterialesLocs = [];
  customEquiposLocs = [];
  drawerNotes = {};
  trash = [];
  viewMode = "dashboard";
  currentLoc = null;
  currentDrawer = null;
  // Load new lab data
  loadData();
  render();
}
