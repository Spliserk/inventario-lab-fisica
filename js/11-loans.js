// 11-loans.js — Préstamos y notificaciones por correo
// Parte de App Inventory. Script clásico (scope global compartido).
// ═══════════════════════════════════════
//  LOAN / REQUEST SYSTEM
// ═══════════════════════════════════════
async function loadSolicitudes() {
  if (!firestoreReady) return;
  try {
    const snap = await db.collection("solicitudes").orderBy("createdAt","desc").get();
    solicitudes = [];
    snap.forEach(doc => { solicitudes.push({ id: doc.id, ...doc.data() }); });
  } catch(e) { console.warn("Error loading solicitudes:", e); }
  // Listen for real-time updates
  try {
    db.collection("solicitudes").orderBy("createdAt","desc").onSnapshot(snap => {
      solicitudes = [];
      snap.forEach(doc => { solicitudes.push({ id: doc.id, ...doc.data() }); });
      // Re-render if viewing solicitudes
      if (viewMode === "solicitudes" || viewMode === "mis-solicitudes") renderContent();
      updateSolicitudesBadge();
      updateTitleBadge();
    });
  } catch(e) {}
}

function getSolicitudesForRole() {
  // Returns the solicitudes relevant to the current user's role and lab
  if (userRole === "superadmin") return solicitudes; // superadmin sees all
  if (userRole === "laboratorista" || userRole === "editor") {
    // Laboratorista only sees solicitudes for their assigned lab
    const myLab = currentLabId || userLabId;
    if (!myLab) return solicitudes;
    return solicitudes.filter(s => (s.labId || "lab_fisica") === myLab);
  }
  // usuario sees only their own
  return solicitudes.filter(s => s.requestedBy === userName);
}

function updateSolicitudesBadge() {
  const badge = document.getElementById("solBadge");
  if (!badge) return;
  const relevant = getSolicitudesForRole();
  const pending = relevant.filter(s => s.status === "pendiente").length;
  badge.textContent = pending || "";
  badge.style.display = pending ? "inline-flex" : "none";
  updateTitleBadge();
}

function openSolicitudesPanel(global) {
  if (global && userRole === "superadmin") {
    if (firestoreUnsubscribe) { firestoreUnsubscribe(); firestoreUnsubscribe = null; }
    currentLabId = null;
  }
  currentLoc = null; currentDrawer = null;
  viewMode = (userRole === "superadmin" || userRole === "laboratorista") ? "solicitudes" : "mis-solicitudes";
  render();
}

function renderSolicitudesPanel() {
  const isEditor = canEdit();

  // Filter by role: laboratorista sees only their lab, superadmin sees all (with lab filter), usuario sees own
  let list;
  if (userRole === "usuario" || userRole === "lector") {
    list = solicitudes.filter(s => s.requestedBy === userName);
  } else if (userRole === "laboratorista" || userRole === "editor") {
    const myLab = currentLabId || userLabId;
    list = myLab ? solicitudes.filter(s => (s.labId || "lab_fisica") === myLab) : solicitudes;
  } else {
    // superadmin — filter by selected lab if any
    const labFilter = window._solLabFilter || "all";
    list = labFilter === "all" ? solicitudes : solicitudes.filter(s => (s.labId || "lab_fisica") === labFilter);
  }

  let html = '<div style="max-width:700px;margin:0 auto;padding:20px">';
  html += '<h2 style="font-family:var(--sans);font-size:18px;margin-bottom:16px">' +
    (isEditor ? 'Solicitudes de Préstamo' : 'Mis Solicitudes') + '</h2>';

  // Superadmin lab filter dropdown
  if (userRole === "superadmin" && laboratorios.length > 0) {
    const labFilter = window._solLabFilter || "all";
    html += '<div style="margin-bottom:14px;display:flex;align-items:center;gap:8px">';
    html += '<span style="font-size:13px;color:var(--text-sec)">Laboratorio:</span>';
    html += '<select onchange="window._solLabFilter=this.value;renderContent()" style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface-alt);color:var(--text);font-size:13px;font-family:var(--body)">';
    html += `<option value="all" ${labFilter==="all"?"selected":""}>Todos los laboratorios</option>`;
    laboratorios.forEach(l => {
      const pendCount = solicitudes.filter(s => (s.labId || "lab_fisica") === l.id && s.status === "pendiente").length;
      html += `<option value="${esc(l.id)}" ${labFilter===l.id?"selected":""}>${esc(l.name)}${pendCount ? " ("+pendCount+" pend.)" : ""}</option>`;
    });
    html += '</select></div>';
  }

  // Tabs: Pendientes / Aprobadas / Historial
  const tabs = isEditor
    ? [["pendiente","Pendientes"],["aprobada","Prestados"],["all","Historial"]]
    : [["pendiente","Pendientes"],["aprobada","Prestados"],["all","Todas"]];

  const solFilter = window._solFilter || "pendiente";
  html += '<div class="filter-bar" style="margin-bottom:16px">';
  tabs.forEach(([val,label]) => {
    const count = val === "all" ? list.length : list.filter(s=>s.status===val).length;
    html += `<span class="filter-chip${solFilter===val?' active':''}" onclick="window._solFilter='${val}';renderContent()">${label} (${count})</span>`;
  });
  html += '</div>';

  const filtered = solFilter === "all" ? list : list.filter(s => s.status === solFilter);

  if (filtered.length === 0) {
    html += '<p style="color:var(--text-sec);text-align:center;padding:30px 0">No hay solicitudes</p>';
  } else {
    filtered.forEach(s => {
      const dateStr = s.createdAt ? new Date(s.createdAt.seconds*1000).toLocaleDateString("es-CO") : "—";
      let returnDate = s.returnDate || "—";
      // Format date values nicely; hour-based loans already stored as "X horas"
      if (returnDate.includes("T")) {
        try { returnDate = new Date(returnDate).toLocaleString("es-CO", {dateStyle:"medium",timeStyle:"short"}); } catch(e) {}
      }
      const isHourLoan = s.loanType === "hora" || returnDate.includes("horas");
      const returnLabel = isHourLoan ? "Duración" : "Devolución";
      // Show lab name for superadmin
      const solLab = laboratorios.find(l => l.id === (s.labId || "lab_fisica"));
      const labTag = (userRole === "superadmin" && solLab) ? `<span style="font-size:11px;color:var(--purple);background:var(--purple-bg);padding:2px 8px;border-radius:10px;margin-left:6px">🔬 ${esc(solLab.name)}</span>` : '';
      html += `<div class="req-card">
        <div class="req-header">
          <span class="req-user">👤 ${esc(s.requestedBy)}${labTag}</span>
          <span class="req-status req-st-${s.status}">${s.status.charAt(0).toUpperCase()+s.status.slice(1)}</span>
        </div>
        <div class="req-item">📦 <strong>${esc(s.itemName)}</strong> × ${s.quantity || 1}</div>
        <div class="req-item" style="font-size:12px;color:var(--text-sec)">📍 ${esc(s.location)} → ${esc(s.drawer)}</div>
        <div style="display:flex;gap:16px;font-size:12px;color:var(--text-dim);margin-top:4px">
          <span>Solicitado: ${dateStr}</span>
          <span>${returnLabel}: ${esc(returnDate)}</span>
        </div>
        ${s.notes ? '<div style="font-size:12px;color:var(--text-sec);margin-top:4px">💬 '+esc(s.notes)+'</div>' : ''}
        <div class="req-actions">`;

      if (isEditor && s.status === "pendiente") {
        html += `<button class="btn-approve" onclick="updateSolicitud('${s.id}','aprobada')">✓ Aprobar</button>`;
        html += `<button class="btn-reject" onclick="updateSolicitud('${s.id}','rechazada')">✕ Rechazar</button>`;
      }
      if (isEditor && s.status === "aprobada") {
        html += `<button class="btn-return" onclick="updateSolicitud('${s.id}','devuelto')">↩ Marcar Devuelto</button>`;
      }
      html += '</div></div>';
    });
  }
  html += '</div>';
  document.getElementById("content").innerHTML = html;
}

function requestItem(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;
  // Get the current lab's loan type
  const labObj = laboratorios.find(l => l.id === currentLabId);
  const loanType = (labObj && labObj.loanType) || "dia";
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7*86400000).toISOString().split("T")[0];

  let returnLabel, returnInput;
  if (loanType === "hora") {
    returnLabel = "Duración del préstamo";
    returnInput = `<select id="f-reqReturn" style="padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface-alt);color:var(--text);font-size:14px;font-family:var(--body)">
      <option value="1">1 hora</option>
      <option value="2" selected>2 horas</option>
      <option value="3">3 horas</option>
      <option value="4">4 horas</option>
      <option value="5">5 horas</option>
      <option value="6">6 horas</option>
    </select>`;
  } else {
    returnLabel = "Fecha de devolución";
    returnInput = `<input id="f-reqReturn" type="date" min="${today}" value="${nextWeek}">`;
  }

  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head">
      <h2>Solicitar Préstamo</h2>
      <button class="modal-x" onclick="closeModal()" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-body">
      <div style="background:var(--surface-alt);border:1px solid var(--border-light);border-radius:var(--radius);padding:12px;margin-bottom:14px">
        <div style="font-weight:600">${esc(item.name)}</div>
        <div style="font-size:12px;color:var(--text-sec);margin-top:2px">${esc(item.location)} → ${esc(item.drawer)}</div>
        <div style="font-size:11px;color:var(--text-dim);margin-top:4px">Préstamo ${loanType === "hora" ? "por horas" : "por días"}</div>
      </div>
      <div class="fg-row">
        <div class="fg"><label>Cantidad</label><input id="f-reqQty" type="number" min="1" max="${item.quantity}" value="1"></div>
        <div class="fg"><label>${returnLabel}</label>${returnInput}</div>
      </div>
      <div class="fg"><label>Nota (opcional)</label><input id="f-reqNotes" placeholder="Motivo o detalle"></div>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-accent" onclick="submitRequest('${item.id}')">Enviar Solicitud</button>
    </div>`;
  document.getElementById("modalBg").hidden = false;
}

async function submitRequest(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item || !firestoreReady) { toast("Error: sin conexión"); return; }
  const qty = parseInt(document.getElementById("f-reqQty").value) || 1;
  const returnVal = document.getElementById("f-reqReturn").value;
  const notes = document.getElementById("f-reqNotes").value.trim();

  // Determine loan type from current lab
  const currentLab = laboratorios.find(l => l.id === currentLabId);
  const loanType = currentLab?.loanType || "dia";

  if (!returnVal) { toast(loanType === "hora" ? "Seleccione duración" : "Seleccione fecha de devolución"); return; }

  // Format returnDate based on loanType
  const returnDate = loanType === "hora" ? returnVal + " horas" : returnVal;

  try {
    await db.collection("solicitudes").add({
      itemId: item.id,
      itemName: item.name,
      location: item.location,
      drawer: item.drawer,
      quantity: qty,
      returnDate: returnDate,
      loanType: loanType,
      labId: currentLabId,
      notes: notes,
      requestedBy: userName,
      requestEmail: userEmail || "",
      status: "pendiente",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal();
    toast("Solicitud enviada");
    // Notificar al laboratorista/admin del laboratorio
    notifyLabStaffNewRequest({
      itemName: item.name,
      location: item.location,
      drawer: item.drawer,
      quantity: qty,
      returnDate: returnDate,
      loanType: loanType,
      labId: currentLabId,
      notes: notes,
      requestedBy: userName
    });
  } catch(e) {
    console.error("Error submitting request:", e);
    toast("Error al enviar solicitud");
  }
}

// ═══════════════════════════════════════
//  EMAIL NOTIFICATIONS (EmailJS)
// ═══════════════════════════════════════

function isEmailReady() {
  return typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY !== "TU_PUBLIC_KEY";
}

function getLabName(labId) {
  const lab = laboratorios.find(l => l.id === labId);
  return lab ? lab.name : (labId || "Laboratorio");
}

function getReturnInfo(sol) {
  const isHour = sol.loanType === "hora" || (sol.returnDate || "").includes("horas");
  if (isHour) return "Duración: " + (sol.returnDate || "No especificada");
  let rd = sol.returnDate || "No especificada";
  if (rd.includes("T")) { try { rd = new Date(rd).toLocaleString("es-CO", {dateStyle:"medium",timeStyle:"short"}); } catch(e) {} }
  return "Fecha de devolución: " + rd;
}

async function findUserEmail(nameOrUsername) {
  if (!nameOrUsername || !firestoreReady) return null;
  try {
    const usersSnap = await db.collection("usuarios").get();
    for (const doc of usersSnap.docs) {
      const u = doc.data();
      if ((u.displayName === nameOrUsername || u.username === nameOrUsername) && u.email) {
        return u.email;
      }
    }
  } catch(e) { console.warn("Error buscando email:", e); }
  return null;
}

async function sendEmail(toEmail, toName, subject, message) {
  if (!isEmailReady() || !toEmail) return false;
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: toEmail,
      name: toName,
      subject: subject,
      message: message,
      email: toEmail
    });
    // Email sent successfully
    return true;
  } catch(e) {
    console.warn("Error enviando email:", e);
    return false;
  }
}

// Notificar al estudiante cuando cambia el estado de su solicitud
async function sendEmailNotification(sol, newStatus) {
  if (!isEmailReady()) return;

  let toEmail = sol.requestEmail || await findUserEmail(sol.requestedBy);
  if (!toEmail) { toast("⚠ Usuario sin correo — no se envió notificación"); return; }

  const labName = getLabName(sol.labId || "lab_fisica");

  const statusMessages = {
    "aprobada": {
      subject: `✅ Préstamo Aprobado — ${labName}`,
      message: `Hola ${sol.requestedBy},\n\nTu solicitud de préstamo ha sido APROBADA.\n\n📦 Ítem: ${sol.itemName}\n📍 Ubicación: ${sol.location} → ${sol.drawer}\n📊 Cantidad: ${sol.quantity || 1}\n📅 ${getReturnInfo(sol)}\n🔬 Laboratorio: ${labName}\n\nPuedes pasar a recoger el equipo al laboratorio.\n\n— App Inventory`
    },
    "rechazada": {
      subject: `❌ Solicitud Rechazada — ${labName}`,
      message: `Hola ${sol.requestedBy},\n\nTu solicitud de préstamo ha sido RECHAZADA.\n\n📦 Ítem: ${sol.itemName}\n📍 Ubicación: ${sol.location} → ${sol.drawer}\n🔬 Laboratorio: ${labName}\n\nSi tienes dudas, consulta con el encargado del laboratorio.\n\n— App Inventory`
    },
    "devuelto": {
      subject: `🔄 Devolución Registrada — ${labName}`,
      message: `Hola ${sol.requestedBy},\n\nSe ha registrado la devolución del equipo.\n\n📦 Ítem: ${sol.itemName}\n🔬 Laboratorio: ${labName}\n\nGracias por devolver el equipo en buen estado.\n\n— App Inventory`
    }
  };

  const info = statusMessages[newStatus];
  if (!info) return;

  const ok = await sendEmail(toEmail, sol.requestedBy, info.subject, info.message);
  if (ok) toast("📧 Notificación enviada a " + toEmail);
  else toast("⚠ Error al enviar notificación por correo");
}

// Notificar al laboratorista/superadmin cuando llega una nueva solicitud
async function notifyLabStaffNewRequest(sol) {
  if (!isEmailReady() || !firestoreReady) return;

  const labId = sol.labId || "lab_fisica";
  const labName = getLabName(labId);

  // Buscar laboratoristas asignados a este lab + superadmins
  const recipients = [];
  try {
    const usersSnap = await db.collection("usuarios").get();
    for (const doc of usersSnap.docs) {
      const u = doc.data();
      if (!u.email) continue;
      // Laboratoristas de este lab
      if ((u.role === "laboratorista" || u.role === "editor") && u.labId === labId) {
        recipients.push({ name: u.displayName || u.username, email: u.email });
      }
      // Superadmins reciben de todos los labs
      if (u.role === "superadmin") {
        recipients.push({ name: u.displayName || u.username, email: u.email });
      }
    }
  } catch(e) { console.warn("Error buscando staff:", e); return; }

  if (recipients.length === 0) return;

  const subject = `📋 Nueva Solicitud de Préstamo — ${labName}`;
  const message = `Se ha recibido una nueva solicitud de préstamo.\n\n👤 Solicitante: ${sol.requestedBy}\n📦 Ítem: ${sol.itemName}\n📍 Ubicación: ${sol.location} → ${sol.drawer}\n📊 Cantidad: ${sol.quantity || 1}\n📅 ${getReturnInfo(sol)}\n🔬 Laboratorio: ${labName}${sol.notes ? "\n💬 Nota: " + sol.notes : ""}\n\nIngresa al sistema para aprobar o rechazar la solicitud.\n\n— App Inventory`;

  let sent = 0;
  for (const r of recipients) {
    const ok = await sendEmail(r.email, r.name, subject, message);
    if (ok) sent++;
  }
  if (sent > 0) toast(`📧 Notificación enviada a ${sent} encargado${sent > 1 ? "s" : ""}`);
}

async function updateSolicitud(solId, newStatus) {
  if (!firestoreReady) return;
  try {
    const sol = solicitudes.find(s => s.id === solId);
    const update = { status: newStatus };
    if (newStatus === "aprobada") {
      update.approvedAt = firebase.firestore.FieldValue.serverTimestamp();
      // Cambiar estado del ítem a "Prestado" automáticamente
      if (sol && sol.itemId) {
        const item = items.find(i => i.id === sol.itemId);
        if (item && item.status === "Presente") {
          item.status = "Prestado";
          const isHourLoan = sol.loanType === "hora" || (sol.returnDate||"").includes("horas");
          item.observations = `Prestado a ${sol.requestedBy} — ${isHourLoan ? "Duración: " : "Devolver: "}${sol.returnDate || "sin fecha"}`;
          saveData();
          logAction("status", `${item.name} → Prestado (préstamo aprobado a ${sol.requestedBy})`);
        }
      }
    }
    if (newStatus === "devuelto") {
      update.returnedAt = firebase.firestore.FieldValue.serverTimestamp();
      // Restaurar estado del ítem a "Presente"
      if (sol && sol.itemId) {
        const item = items.find(i => i.id === sol.itemId);
        if (item && item.status === "Prestado") {
          item.status = "Presente";
          item.observations = "";
          saveData();
          logAction("status", `${item.name} → Presente (devolución de ${sol.requestedBy})`);
        }
      }
    }
    await db.collection("solicitudes").doc(solId).update(update);
    // Enviar notificación por correo
    if (sol) sendEmailNotification(sol, newStatus);
    toast(newStatus === "aprobada" ? "Préstamo aprobado — ítem marcado como Prestado" : newStatus === "rechazada" ? "Solicitud rechazada" : "Devolución registrada — ítem disponible");
    render();
  } catch(e) { toast("Error al actualizar"); }
}

