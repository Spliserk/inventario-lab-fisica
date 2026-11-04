// 06-rendering.js — Renderizado de vistas
// Parte de App Inventory. Script clásico (scope global compartido).
// ═══════════════════════════════════════
//  RENDERING
// ═══════════════════════════════════════
function getLocs() {
  // Default hardcoded locations only apply to the original physics lab
  const isPhysicsLab = !currentLabId || currentLabId === "lab_fisica";
  if (section === "equipos") {
    return isPhysicsLab ? [...EQUIPOS_LOCATIONS, ...customEquiposLocs] : [...customEquiposLocs];
  }
  return isPhysicsLab ? [...MATERIALES_LOCATIONS, ...customMaterialesLocs] : [...customMaterialesLocs];
}
function isCustomLoc(locId) {
  return customMaterialesLocs.some(l=>l.id===locId) || customEquiposLocs.some(l=>l.id===locId);
}
function sectionItems() { return items.filter(i => i.section === section); }

function switchSection(s) {
  section = s;
  viewMode = "dashboard";
  currentLoc = null;
  currentDrawer = null;
  currentFilter = null;
  document.getElementById("searchInput").value = "";
  render();
}

function renderSidebar() {
  const nav = document.getElementById("sidebarNav");
  const locs = getLocs();
  const allSi = sectionItems();
  // Para lectores, solo contar ítems disponibles
  const si = isReadOnly() ? allSi.filter(i => i.status === "Presente") : allSi;

  // Section tabs
  document.getElementById("tabMateriales").classList.toggle("active", section==="materiales");
  document.getElementById("tabEquipos").classList.toggle("active", section==="equipos");



  let html = '';
  // Dashboard link
  const dashActive = viewMode === "dashboard";
  html += `<div class="nav-group"><div class="nav-item${dashActive?' active':''}" onclick="goToDashboard()">
    <span class="mi" style="font-size:20px">dashboard</span><span>Resumen</span><span class="nav-badge">${si.length}</span>
  </div></div>`;

  locs.forEach(loc => {
    const count = si.filter(i => i.location === loc.id).length;
    const navKey = section + '::' + loc.id;
    const navExpanded = currentLoc === loc.id && (viewMode === "list" || viewMode === "drawers") && !collapsedNavLocs[navKey];
    const isActive = currentLoc === loc.id && !currentDrawer && (viewMode==="list" || viewMode==="drawers");
    html += `<div class="nav-group">`;
    const isCustom = isCustomLoc(loc.id);
    html += `<div class="nav-item${isActive?' active':''}" onclick="goToLoc('${esc(loc.id)}')">
      <span>${loc.icon}</span><span>${esc(loc.name)}${locCodes[loc.id]?'<span class="nav-code">'+esc(locCodes[loc.id])+'</span>':''}</span>
      ${isCustom && canEdit()?`<span class="loc-actions"><button class="loc-act-btn" onclick="event.stopPropagation();openLocModal('${esc(loc.id)}')" title="Editar">✎</button><button class="loc-act-btn del" onclick="event.stopPropagation();deleteLoc('${esc(loc.id)}')" title="Eliminar">✕</button></span>`:''}
      <span class="mi nav-expand-icon" aria-hidden="true">${navExpanded?'expand_less':'expand_more'}</span>
      <span class="nav-badge">${count}</span>
    </div>`;
    if (navExpanded) {
      html += `<div class="nav-sub">`;
      loc.drawers.forEach(d => {
        const dCount = si.filter(i => i.location === loc.id && i.drawer === d).length;
        const isActiveD = currentDrawer === d;
        if (isReadOnly()) {
          html += `<div class="nav-item${isActiveD?' active':''}" onclick="goToDrawer('${esc(loc.id)}','${esc(d)}')">
            <span class="nav-dot" style="background:var(--green)"></span>
            <span>${esc(d)}</span>
            <span class="nav-badge">${dCount}</span>
          </div>`;
        } else {
          const hasIssue = allSi.some(i => i.location === loc.id && i.drawer === d && ["Dañado","Faltante"].includes(i.status));
          html += `<div class="nav-item${isActiveD?' active':''}" onclick="goToDrawer('${esc(loc.id)}','${esc(d)}')">
            <span class="nav-dot" style="background:${hasIssue?'var(--red)':'var(--green)'}"></span>
            <span>${esc(d)}</span>
            <span class="nav-badge">${dCount}</span>
          </div>`;
        }
      });
      html += `</div>`;
    }
    html += `</div>`;
  });

  // Botón para agregar nueva ubicación (solo editor)
  if (canEdit()) html += `<div class="loc-mgmt-btn" onclick="openLocModal()"><span class="mi" style="font-size:20px">add_circle</span> Nueva ubicación</div>`;

  nav.innerHTML = html;

  // Footer
  const fCount = document.getElementById("footerCount");
  if (fCount) fCount.textContent = isReadOnly() ? `${si.length} disponibles` : `${allSi.length} ítems`;
}

function renderTopbar() {
  const tb = document.getElementById("topbar");
  const isEditor = canEdit();

  const syncHtml = `<div id="syncIndicator" class="sync-${syncState||'online'}"><span class="sync-dot"></span><span id="syncText">${syncState==='offline'?'Sin conexión':syncState==='syncing'?'Sincronizando...':'Conectado'}</span></div>`;

  // Special views
  if (viewMode === "admin-home") {
    tb.innerHTML = '';
    return;
  }
  if (viewMode === "users") {
    const backBtn = isAdmin() && !currentLabId
      ? `<button class="btn btn-sm" onclick="goToAdminHome()"><span class="mi" style="font-size:18px">arrow_back</span> Labs</button>`
      : `<button class="btn btn-sm" onclick="goToDashboard()"><span class="mi" style="font-size:18px">arrow_back</span> Inventario</button>`;
    tb.innerHTML = `<button class="btn-mobile-menu" onclick="toggleMobile()"><span class="mi">menu</span></button>
      <span class="topbar-title"><span class="mi" style="font-size:24px;vertical-align:middle;margin-right:8px">group</span>Gestión de Usuarios</span>
      ${syncHtml}
      ${backBtn}`;
    return;
  }
  if (viewMode === "labs") {
    tb.innerHTML = `<button class="btn-mobile-menu" onclick="toggleMobile()"><span class="mi">menu</span></button>
      <span class="topbar-title"><span class="mi" style="font-size:24px;vertical-align:middle;margin-right:8px">science</span>Gestión de Laboratorios</span>
      ${syncHtml}
      <button class="btn btn-sm" onclick="goToAdminHome()"><span class="mi" style="font-size:18px">arrow_back</span> Labs</button>`;
    return;
  }
  if (viewMode === "audit") {
    const backBtnA = isAdmin()
      ? `<button class="btn btn-sm" onclick="goToAdminHome()"><span class="mi" style="font-size:18px">arrow_back</span> Labs</button>`
      : `<button class="btn btn-sm" onclick="goToDashboard()"><span class="mi" style="font-size:18px">arrow_back</span> Inventario</button>`;
    tb.innerHTML = `<button class="btn-mobile-menu" onclick="toggleMobile()"><span class="mi">menu</span></button>
      <span class="topbar-title"><span class="mi" style="font-size:24px;vertical-align:middle;margin-right:8px">history</span>Historial de Cambios</span>
      ${syncHtml}
      ${backBtnA}`;
    return;
  }
  if (viewMode === "solicitudes" || viewMode === "mis-solicitudes") {
    const backBtn = isAdmin() && !currentLabId
      ? `<button class="btn btn-sm" onclick="goToAdminHome()"><span class="mi" style="font-size:18px">arrow_back</span> Labs</button>`
      : `<button class="btn btn-sm" onclick="goToDashboard()"><span class="mi" style="font-size:18px">arrow_back</span> Inventario</button>`;
    tb.innerHTML = `<button class="btn-mobile-menu" onclick="toggleMobile()"><span class="mi">menu</span></button>
      <span class="topbar-title"><span class="mi" style="font-size:24px;vertical-align:middle;margin-right:8px">assignment</span>${viewMode==="solicitudes"?"Solicitudes de Préstamo":"Mis Solicitudes"}</span>
      ${syncHtml}
      ${backBtn}`;
    return;
  }

  let titleHtml = '';
  if (viewMode === "dashboard") {
    titleHtml = section === "equipos" ? "Equipos — Referencia ABC" : "Materiales — Inventario";
  } else if (viewMode === "drawers") {
    const locObj = getLocs().find(l => l.id === currentLoc);
    titleHtml = locObj ? esc(locObj.name) : esc(currentLoc || '');
    if (isEditor) titleHtml += `<span class="topbar-crumb">Inventario${locCodes[currentLoc]?' · '+esc(locCodes[currentLoc]):''}</span> <button class="btn btn-sm" onclick="editLocCode('${esc(currentLoc)}')" style="font-size:11px;padding:2px 8px">Código inv.</button>`;
    else titleHtml += locCodes[currentLoc] ? `<span class="topbar-crumb">${esc(locCodes[currentLoc])}</span>` : '';
  } else {
    titleHtml = currentDrawer ? esc(currentDrawer) : esc(currentLoc || '');
    if (currentLoc && !currentDrawer) {
      if (isEditor) titleHtml += `<span class="topbar-crumb">Inventario${locCodes[currentLoc]?' · '+esc(locCodes[currentLoc]):''}</span> <button class="btn btn-sm" onclick="editLocCode('${esc(currentLoc)}')" style="font-size:11px;padding:2px 8px">Código inv.</button>`;
      else titleHtml += locCodes[currentLoc] ? `<span class="topbar-crumb">${esc(locCodes[currentLoc])}</span>` : '';
    } else if (currentDrawer) {
      titleHtml += `<span class="topbar-crumb">${esc(currentLoc)}</span>`;
      const noteKey = currentLoc + "::" + currentDrawer;
      const dn = drawerNotes[noteKey];
      if (dn) titleHtml += `<span style="font-size:11px;color:var(--amber);margin-left:8px">⚠ ${esc(dn)}</span>`;
    }
  }

  let filtered;
  if (viewMode === "list") filtered = getFiltered();
  else if (viewMode === "drawers") filtered = sectionItems().filter(i => i.location === currentLoc);
  else filtered = sectionItems();
  const pres = filtered.filter(i=>i.status==="Presente").length;
  const desg = filtered.filter(i=>i.status==="Desgastado").length;
  const bad = filtered.filter(i=>["Dañado","Faltante"].includes(i.status)).length;

  const showCollapseControls = currentLoc && !currentDrawer && viewMode === "list";
  tb.innerHTML = `
    <button class="btn-mobile-menu" onclick="toggleMobile()"><span class="mi">menu</span></button>
    <span class="topbar-title" id="topTitle">${titleHtml}</span>
    <div class="stat-pills">
      <span class="stat-pill pill-ok">${pres} OK</span>
      ${desg?`<span class="stat-pill pill-warn">${desg}</span>`:''}
      ${bad?`<span class="stat-pill pill-bad">${bad}</span>`:''}
    </div>
    ${syncHtml}
    ${showCollapseControls?`<button class="btn btn-sm" onclick="expandAllModules()" title="Expandir todo"><span class="mi" style="font-size:18px">unfold_more</span></button><button class="btn btn-sm" onclick="collapseAllModules()" title="Colapsar todo"><span class="mi" style="font-size:18px">unfold_less</span></button>`:''}
    ${isEditor?`<button class="btn btn-accent btn-sm" onclick="openAddModal()">+ Agregar</button>`:''}
    ${isEditor&&currentLoc&&currentDrawer?`<button class="btn btn-sm" onclick="editDrawerNote('${esc(currentLoc)}','${esc(currentDrawer)}')">📝 Nota</button>`:''}
    ${viewMode!=="dashboard"?`<button class="btn btn-sm" onclick="goToDashboard()"><span class="mi" style="font-size:18px">dashboard</span> Resumen</button>`:''}
    ${isAdmin()?`<button class="btn btn-sm" onclick="goToAdminHome()" style="border-color:var(--purple);color:var(--purple)"><span class="mi" style="font-size:18px">science</span> Labs</button>`:''}
  `;
}

function renderContent() {
  const el = document.getElementById("content");
  if (viewMode === "admin-home") { renderAdminHome(); return; }
  if (viewMode === "users") { renderUsersPanel(); return; }
  if (viewMode === "labs") { renderLabsPanel(); return; }
  if (viewMode === "audit") { openAuditLog(); return; }
  if (viewMode === "solicitudes" || viewMode === "mis-solicitudes") { renderSolicitudesPanel(); return; }
  if (viewMode === "dashboard") {
    renderDashboard(el);
  } else if (viewMode === "drawers") {
    renderDrawersView(el);
  } else {
    renderTable(el);
  }
}

function renderDrawersView(el) {
  const loc = getLocs().find(l => l.id === currentLoc);
  if (!loc) { renderDashboard(el); return; }
  const si = sectionItems().filter(i => i.location === currentLoc);
  const total = si.length;
  const pres = si.filter(i=>i.status==="Presente").length;
  const desg = si.filter(i=>i.status==="Desgastado").length;
  const bad = si.filter(i=>["Dañado","Faltante"].includes(i.status)).length;

  let html = `<div class="dashboard-grid" style="margin-bottom:20px">
    <div class="dash-card"><div class="dash-card-label">${isReadOnly()?"Disponibles":"Total ítems"}</div><div class="dash-card-value">${isReadOnly()?pres:total}</div></div>
    <div class="dash-card"><div class="dash-card-label">Presente</div><div class="dash-card-value ok">${pres}</div></div>
    ${canEdit() && desg?`<div class="dash-card"><div class="dash-card-label">Desgastado</div><div class="dash-card-value warn">${desg}</div></div>`:''}
    ${canEdit() && bad?`<div class="dash-card"><div class="dash-card-label">Faltante / Dañado</div><div class="dash-card-value bad">${bad}</div></div>`:''}
  </div>`;

  html += `<div class="dash-section-title">${loc.drawers[0]?.startsWith("Piso")||loc.drawers[0]?.startsWith("Cajón")? "Pisos / Cajones" : section==="equipos" ? "Módulos" : "Secciones"} (${loc.drawers.length})</div>`;
  html += `<div class="dash-locations">`;
  loc.drawers.forEach(d => {
    const di = si.filter(i => i.drawer === d);
    const ct = di.length;
    const okC = di.filter(i=>i.status==="Presente").length;
    const warnC = di.filter(i=>i.status==="Desgastado").length;
    const badC = di.filter(i=>["Dañado","Faltante"].includes(i.status)).length;
    const okP = ct ? (okC/ct*100) : 0;
    const warnP = ct ? (warnC/ct*100) : 0;
    const badP = ct ? (badC/ct*100) : 0;
    const icon = section==="equipos" ? "📋" : d.startsWith("Piso")?"📂":"🗂";
    const noteKey = currentLoc + "::" + d;
    const note = drawerNotes[noteKey] || "";
    html += `<div class="dash-loc" onclick="goToDrawer('${esc(currentLoc)}','${esc(d)}')">
      <span class="dash-loc-icon">${icon}</span>
      <div class="dash-loc-info">
        <div class="dash-loc-name">${esc(d)}</div>
        <div class="dash-loc-count">${ct} ítems</div>
        ${note?`<div style="font-size:11px;color:var(--amber);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(note)}">⚠ ${esc(note)}</div>`:''}
        ${ct?`<div class="dash-loc-bar">
          <span class="bar-ok" style="width:${okP}%"></span>
          <span class="bar-warn" style="width:${warnP}%"></span>
          <span class="bar-bad" style="width:${badP}%"></span>
        </div>`:''}
      </div>
      ${canEdit()?`<button class="loc-act-btn" onclick="event.stopPropagation();editDrawerNote('${esc(currentLoc)}','${esc(d)}')" title="Nota del módulo" style="opacity:0.5;font-size:14px">📝</button>`:''}
    </div>`;
  });
  html += `</div>`;

  // Items needing attention in this location (solo para editores)
  if (canEdit()) {
    const attention = si.filter(i=>["Dañado","Faltante"].includes(i.status));
    if (attention.length) {
      html += `<div class="dash-section-title" style="margin-top:20px">Requieren atención (${attention.length})</div>`;
      html += `<div class="tbl-wrap"><div class="tbl-scroll"><table>
        <thead><tr><th>${section==="equipos"?"Módulo":"Cajón"}</th><th>N.°</th><th>Material</th><th>Estado</th><th>Observaciones</th></tr></thead><tbody>`;
      attention.forEach(i => {
        html += `<tr style="cursor:pointer" onclick="goToDrawer('${esc(i.location)}','${esc(i.drawer)}')">
          <td style="font-family:var(--mono);font-size:12px">${esc(i.drawer)}</td>
          <td class="qty">${i.num}</td>
          <td>${esc(i.name)}</td>
          <td><span class="status-tag ${STATUS_CLS[i.status]||''}">${esc(i.status)}</span></td>
          <td style="font-size:12px;color:var(--text-sec)">${esc(i.observations)}</td>
        </tr>`;
      });
      html += `</tbody></table></div></div>`;
    }
  }

  el.innerHTML = html;
}

function renderDashboard(el) {
  const si = sectionItems();
  const total = si.length;
  const pres = si.filter(i=>i.status==="Presente").length;
  const desg = si.filter(i=>i.status==="Desgastado").length;
  const falt = si.filter(i=>["Faltante"].includes(i.status)).length;
  const dan = si.filter(i=>i.status==="Dañado").length;
  const noPrestamo = si.filter(i=>i.status==="No Préstamo").length;

  const prestados = si.filter(i=>i.status==="Prestado").length;
  let html = `<div class="dashboard-grid">
    <div class="dash-card"><div class="dash-card-label">${isReadOnly()?"Disponibles":"Total registrado"}</div><div class="dash-card-value">${isReadOnly()?pres:total}</div><div class="dash-card-sub">${isReadOnly()?"ítems disponibles para préstamo":"ítems del laboratorio"}</div></div>
    <div class="dash-card"><div class="dash-card-label">Presente</div><div class="dash-card-value ok">${pres}</div><div class="dash-card-sub">${total?Math.round(pres/total*100):0}% del total</div></div>
    ${canEdit()?`<div class="dash-card"><div class="dash-card-label">Desgastado</div><div class="dash-card-value warn">${desg}</div><div class="dash-card-sub">requieren atención</div></div>
    <div class="dash-card"><div class="dash-card-label">Faltante / Dañado</div><div class="dash-card-value bad">${falt+dan}</div><div class="dash-card-sub">${falt} faltantes, ${dan} dañados</div></div>`:''}
    ${prestados?`<div class="dash-card"><div class="dash-card-label">Prestado</div><div class="dash-card-value" style="color:var(--accent)">${prestados}</div><div class="dash-card-sub">ítems en préstamo</div></div>`:''}
    ${noPrestamo?`<div class="dash-card"><div class="dash-card-label">No Préstamo</div><div class="dash-card-value" style="color:var(--purple)">${noPrestamo}</div><div class="dash-card-sub">ítems no prestables</div></div>`:''}
  </div>`;

  html += `<div class="dash-section-title">Ubicaciones</div><div class="dash-locations">`;
  const locs = getLocs();
  locs.forEach(loc => {
    const li = si.filter(i=>i.location===loc.id);
    const ct = li.length;
    const okC = li.filter(i=>i.status==="Presente").length;
    const warnC = li.filter(i=>i.status==="Desgastado").length;
    const badC = li.filter(i=>["Dañado","Faltante"].includes(i.status)).length;
    const okP = ct ? (okC/ct*100) : 0;
    const warnP = ct ? (warnC/ct*100) : 0;
    const badP = ct ? (badC/ct*100) : 0;
    const isC = isCustomLoc(loc.id);
    html += `<div class="dash-loc" onclick="goToLoc('${esc(loc.id)}')" style="position:relative">
      <span class="dash-loc-icon">${loc.icon}</span>
      <div class="dash-loc-info">
        <div class="dash-loc-name">${esc(loc.name)}${locCodes[loc.id]?' <span style="font-family:var(--mono);font-size:11px;color:var(--text-dim);font-weight:400">'+esc(locCodes[loc.id])+'</span>':' <span style="font-size:11px;color:var(--text-dim);font-style:italic">Sin código</span>'}${isC?'<span class="loc-actions" style="display:inline-flex;vertical-align:middle;margin-left:6px"><button class="loc-act-btn" onclick="event.stopPropagation();openLocModal(\''+esc(loc.id)+'\')" title="Editar">✎</button><button class="loc-act-btn del" onclick="event.stopPropagation();deleteLoc(\''+esc(loc.id)+'\')" title="Eliminar">✕</button></span>':''}</div>
        <div class="dash-loc-count">${ct} ítems · ${loc.drawers.length} ${loc.drawers[0]?.startsWith("Piso")?"pisos":section==="equipos"?"módulos":"secciones"}</div>
        ${ct?`<div class="dash-loc-bar">
          <span class="bar-ok" style="width:${okP}%"></span>
          <span class="bar-warn" style="width:${warnP}%"></span>
          <span class="bar-bad" style="width:${badP}%"></span>
        </div>`:''}
      </div>
    </div>`;
  });
  if (canEdit()) {
    html += `<div class="dash-loc" onclick="openLocModal()" style="border:2px dashed var(--border);background:transparent;cursor:pointer;justify-content:center;min-height:60px">
      <span style="font-size:20px;color:var(--accent)">+</span>
      <div class="dash-loc-info">
        <div class="dash-loc-name" style="color:var(--accent)">Nueva ubicación</div>
      </div>
    </div>`;
  }
  html += `</div>`;

  // Items needing attention (solo para editores)
  if (canEdit()) {
    const attention = si.filter(i=>["Dañado","Faltante"].includes(i.status));
    if (attention.length) {
      html += `<div class="dash-section-title">Requieren atención (${attention.length})</div>`;
      html += `<div class="tbl-wrap"><div class="tbl-scroll"><table>
        <thead><tr><th>Ubicación</th><th>Cajón</th><th>Material</th><th>Estado</th><th>Qué falta / Problema</th></tr></thead><tbody>`;
      attention.forEach(i => {
        html += `<tr style="cursor:pointer" onclick="goToDrawer('${esc(i.location)}','${esc(i.drawer)}')">
          <td>${esc(i.location)}</td>
          <td style="font-family:var(--mono);font-size:12px">${esc(i.drawer)}</td>
          <td>${esc(i.name)}</td>
          <td><span class="status-tag ${STATUS_CLS[i.status]||''}">${esc(i.status)}</span></td>
          <td style="font-size:12px;color:var(--text-sec)">${esc(i.observations)}</td>
        </tr>`;
      });
      html += `</tbody></table></div></div>`;
    }
  }

  el.innerHTML = html;
}

function renderTable(el) {
  const filtered = getFiltered();
  if (filtered.length === 0) {
    el.innerHTML = `<div class="empty">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4M4 7l8 4M4 7v10l8 4m0-10v10"/></svg>
      <h3>Sin elementos</h3>
      <p>Usa "+ Agregar" para registrar el primer ítem en esta ubicación.</p>
    </div>`;
    return;
  }

  // Filter chips — status
  let chipHtml = `<div class="filter-bar">
    <span class="filter-chip${!currentFilter?' active':''}" onclick="setFilter(null)">Todos (${filtered.length})</span>`;
  STATUSES.forEach(s => {
    const c = filtered.filter(i=>i.status===s).length;
    if(c) chipHtml += `<span class="filter-chip${currentFilter===s?' active':''}" onclick="setFilter('${s}')">${s} (${c})</span>`;
  });
  chipHtml += `</div>`;

  // Additional combined filters when searching or at top level
  const isSearch = document.getElementById("searchInput").value.trim();
  if (isSearch) {
    // Show location grouping when in search results
    const locs = [...new Set(filtered.map(i=>i.location))].sort();
    if (locs.length > 1) {
      chipHtml += `<div class="filter-bar" style="padding-top:0">
        <span style="font-size:11px;color:var(--text-dim);padding:4px 4px;font-weight:600">Ubicación:</span>
        <span class="filter-chip${!currentLocFilter?' active':''}" onclick="setLocFilter(null)">Todas</span>`;
      locs.forEach(l => {
        const c = filtered.filter(i=>i.location===l).length;
        chipHtml += `<span class="filter-chip${currentLocFilter===l?' active':''}" onclick="setLocFilter('${esc(l)}')">${esc(l)} (${c})</span>`;
      });
      chipHtml += `</div>`;
    }
    // Show drawer grouping
    const baseFiltered = currentLocFilter ? filtered.filter(i=>i.location===currentLocFilter) : filtered;
    const drawers = [...new Set(baseFiltered.map(i=>i.drawer))].sort();
    if (drawers.length > 1 && currentLocFilter) {
      chipHtml += `<div class="filter-bar" style="padding-top:0">
        <span style="font-size:11px;color:var(--text-dim);padding:4px 4px;font-weight:600">Módulo:</span>
        <span class="filter-chip${!currentDrawerFilter?' active':''}" onclick="setDrawerFilter(null)">Todos</span>`;
      drawers.forEach(d => {
        const c = baseFiltered.filter(i=>i.drawer===d).length;
        chipHtml += `<span class="filter-chip${currentDrawerFilter===d?' active':''}" onclick="setDrawerFilter('${esc(d)}')">${esc(d)} (${c})</span>`;
      });
      chipHtml += `</div>`;
    }
  }

  let display = currentFilter ? filtered.filter(i=>i.status===currentFilter) : filtered;
  if (currentLocFilter) display = display.filter(i=>i.location===currentLocFilter);
  if (currentDrawerFilter) display = display.filter(i=>i.drawer===currentDrawerFilter);

  const isEditor = canEdit();

  // Collapsible module sections: group by drawer when viewing a location (not a specific drawer) and not searching
  const useCollapsible = currentLoc && !currentDrawer && !isSearch && display.length > 0;

  function buildTableRows(itemsList) {
    let rows = '';
    itemsList.forEach(item => {
      rows += `<tr class="${selectedItems.has(item.id)?'selected-row':''}">
        ${isEditor?'<td class="chk-cell"><input type="checkbox" data-item-id="'+item.id+'" '+(selectedItems.has(item.id)?'checked':'')+' onchange="toggleSelectItem(\''+item.id+'\')"></td>':''}
        <td class="qty">${item.num}</td>
        <td>${isEditor?`<span class="editable" onclick="editField('${item.id}','name')">`:''}${esc(item.name)}${isEditor?'</span>':''}</td>
        <td>${isEditor?`<span class="editable" onclick="editField('${item.id}','brand')">`:''}${esc(item.brand)||'—'}${isEditor?'</span>':''}</td>
        <td style="font-family:var(--mono);font-size:12px">${esc(item.placa||item.serial||'')||'—'}</td>
        <td class="qty">${esc(String(item.quantity))}</td>
        <td><span class="status-tag ${STATUS_CLS[item.status]||''}" ${isEditor?`onclick="editStatus('${item.id}', event)"`:''} style="${isEditor?'':'cursor:default'}">${esc(item.status)}</span></td>
        <td style="font-size:13px">${isEditor?`<span class="editable" onclick="editField('${item.id}','observations')">`:''}${esc(item.observations)||'—'}${isEditor?'</span>':''}</td>
        <td>${isEditor?`<div class="row-actions">
          <button class="row-act edit-act" onclick="openEditModal('${item.id}')" title="Editar"><span class="mi" style="font-size:18px">edit</span></button>
          <button class="row-act del" onclick="deleteItem('${item.id}')" title="Eliminar">&#10005;</button>
        </div>`:`<div style="display:flex;align-items:center;gap:4px">${(()=>{const l=getActiveLoans(item.id);return l>0?'<span style="font-size:10px;background:var(--amber);color:#fff;border-radius:8px;padding:1px 5px" title="'+l+' préstamo(s) activo(s)">⏳'+l+'</span>':''})()}<button class="btn-request-item" onclick="requestItem('${item.id}')" title="Solicitar préstamo">📋</button></div>`}</td>
      </tr>`;
    });
    return rows;
  }

  function buildTableHead() {
    return `<thead><tr>
      ${isEditor?'<th class="chk-cell"><input type="checkbox" onchange="toggleSelectAll()" '+((selectedItems.size===display.length&&display.length>0)?'checked':'')+'></th>':''}
      <th style="width:40px">N.°</th>
      <th>Material / Elemento</th>
      <th>Marca</th>
      <th style="width:100px">N.° Placa</th>
      <th style="width:60px">Cant.</th>
      <th style="width:120px">Estado</th>
      <th>Observaciones</th>
      <th style="width:${isEditor?'70':'80'}px"></th>
    </tr></thead>`;
  }

  let tHtml = '';

  if (useCollapsible) {
    // Group items by drawer
    const drawers = [];
    const drawerMap = {};
    display.forEach(item => {
      if (!drawerMap[item.drawer]) {
        drawerMap[item.drawer] = [];
        drawers.push(item.drawer);
      }
      drawerMap[item.drawer].push(item);
    });

    drawers.forEach((drawer, idx) => {
      const dItems = drawerMap[drawer];
      const okC = dItems.filter(i=>i.status==="Presente").length;
      const warnC = dItems.filter(i=>i.status==="Desgastado").length;
      const badC = dItems.filter(i=>["Dañado","Faltante"].includes(i.status)).length;
      const statusSummary = [];
      if (okC) statusSummary.push(`<span style="color:var(--green)">${okC} ✓</span>`);
      if (warnC) statusSummary.push(`<span style="color:var(--amber)">${warnC} ⚠</span>`);
      if (badC) statusSummary.push(`<span style="color:var(--red)">${badC} ✕</span>`);
      const isExpanded = expandedModules[currentLoc + '::' + drawer] !== false;
      tHtml += `<div class="module-section">
        <div class="module-header ${isExpanded?'expanded':''}" onclick="toggleModule('${esc(currentLoc)}','${esc(drawer)}',this)">
          <span class="module-icon">▾</span>
          <span class="module-title">${esc(drawer)}</span>
          <span style="font-size:13px;display:flex;gap:10px;margin-right:8px">${statusSummary.join(' ')}</span>
          <span class="module-count">${dItems.length} ítems</span>
        </div>
        <div class="module-body ${isExpanded?'open':''}">
          <div class="tbl-wrap" style="border-radius:0;box-shadow:none"><div class="tbl-scroll"><table>
            ${buildTableHead()}
            <tbody>${buildTableRows(dItems)}</tbody>
          </table></div></div>
        </div>
      </div>`;
    });
  } else {
    tHtml = `<div class="tbl-wrap"><div class="tbl-scroll"><table>
      ${buildTableHead()}
      <tbody>${buildTableRows(display)}</tbody>
    </table></div></div>`;
  }

  el.innerHTML = chipHtml + tHtml;
}

function getFiltered() {
  let si = sectionItems();
  // Lectores solo ven ítems disponibles para préstamo
  if (isReadOnly()) {
    si = si.filter(i => i.status === "Presente");
  }
  const search = document.getElementById("searchInput").value.toLowerCase().trim();
  if (search) {
    return si.filter(i =>
      i.name.toLowerCase().includes(search) ||
      i.brand.toLowerCase().includes(search) ||
      (i.placa||i.serial||'').toLowerCase().includes(search) ||
      i.observations.toLowerCase().includes(search) ||
      i.drawer.toLowerCase().includes(search) ||
      i.location.toLowerCase().includes(search)
    ).sort((a,b)=>a.num-b.num);
  }
  let r = si;
  if (currentLoc) r = r.filter(i=>i.location===currentLoc);
  if (currentDrawer) r = r.filter(i=>i.drawer===currentDrawer);
  return r.sort((a,b)=>a.num-b.num);
}

function render() {
  const sidebar = document.getElementById("sidebar");
  const adminPanelViews = ["admin-home","users","labs","audit","solicitudes"];
  const hideSidebar = viewMode === "admin-home" || (isAdmin() && !currentLabId && adminPanelViews.includes(viewMode));
  if (sidebar) sidebar.classList.toggle("sidebar-hidden", hideSidebar);
  renderSidebar(); renderTopbar(); renderContent(); updateRoleUI();
}

function getActiveTheme() {
  const theme = document.documentElement.dataset.theme;
  if (theme === "light" || theme === "dark") return theme;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function updateThemeToggle() {
  const button = document.getElementById("themeToggle");
  if (!button) return;
  const isDark = getActiveTheme() === "dark";
  const nextTheme = isDark ? "claro" : "oscuro";
  button.innerHTML = `<span class="mi">${isDark ? "light_mode" : "dark_mode"}</span> Cambiar a modo ${nextTheme}`;
  button.setAttribute("aria-label", `Cambiar a modo ${nextTheme}`);
  button.setAttribute("aria-pressed", String(isDark));
}

function toggleTheme() {
  const nextTheme = getActiveTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  try { localStorage.setItem("inv_theme", nextTheme); } catch(e) {}
  updateThemeToggle();
}

function updateRoleUI() {
  const footer = document.getElementById("sidebarFooter");
  if (!footer) return;
  const relevantSols = getSolicitudesForRole();
  const pending = relevantSols.filter(s => s.status === "pendiente").length;
  const badgeHtml = pending ? `<span class="loan-badge" id="solBadge">${pending}</span>` : '<span id="solBadge" style="display:none"></span>';

  // Update sidebar title based on current lab
  const titleEl = document.getElementById("sidebarTitle");
  if (titleEl) {
    const lab = laboratorios.find(l => l.id === currentLabId);
    titleEl.textContent = lab ? lab.name : "App Inventory";
  }

  // Selector de laboratorio: los admin y usuarios cambian entre TODOS los labs;
  // un laboratorista con varios labs asignados cambia solo entre los suyos.
  const labSel = document.getElementById("labSelector");
  if (labSel) {
    const canSeeAll = isAdmin() || userRole === "usuario";
    const myLabs = canSeeAll ? laboratorios : laboratorios.filter(l => userLabList().includes(l.id));
    if (myLabs.length > 1) {
      let selHtml = '<select id="labSwitcher" onchange="switchLab(this.value)" style="width:100%;margin-top:6px;padding:6px 8px;border-radius:var(--radius);border:1px solid var(--border);background:var(--surface-alt);color:var(--text);font-size:13px;font-family:var(--body)">';
      myLabs.forEach(l => {
        selHtml += `<option value="${esc(l.id)}" ${l.id===currentLabId?'selected':''}>${esc(l.name)}</option>`;
      });
      selHtml += '</select>';
      labSel.innerHTML = selHtml;
    } else {
      labSel.innerHTML = '';
    }
  }

  const isEditor = isAdmin() || userRole === "laboratorista";

  if (isAdmin()) {
    footer.innerHTML = `
      <div class="footer-drawer" id="footerDrawer">
        <div class="footer-drawer-inner">
          <button class="footer-drawer-item" onclick="openSolicitudesPanel()">📋 Solicitudes${badgeHtml}</button>
          <button class="footer-drawer-item" onclick="openUserManager()">👥 Usuarios</button>
          <button class="footer-drawer-item" onclick="openLabManager()">🔬 Laboratorios</button>
          <button class="footer-drawer-item" onclick="openAuditLog()">📜 Historial</button>
          <div class="footer-drawer-sep"></div>
          <button class="footer-drawer-item" onclick="exportCSV()">📊 Exportar CSV</button>
          <button class="footer-drawer-item" onclick="importBackup()">📥 Importar</button>
          <button class="footer-drawer-item" onclick="exportBackup()">💾 Backup</button>
          <button class="footer-drawer-item" onclick="printInventory()">🖨 Imprimir</button>
          <div class="footer-drawer-sep"></div>
          <button class="footer-drawer-item" id="themeToggle" onclick="toggleTheme()" aria-pressed="false"><span class="mi">dark_mode</span> Cambiar tema</button>
          <button class="footer-drawer-item" onclick="openChangePasswordModal()">🔑 Cambiar contraseña</button>
        </div>
      </div>
      <div class="footer-bar">
        <button class="logout-btn" onclick="goToAdminHome()" style="background:var(--purple);color:#fff;border-color:var(--purple)">🔬 Labs</button>
        <span class="footer-count" id="footerCount">${items.length} ítems · 👑 ${esc(userName)}</span>
        <button class="footer-menu-toggle" onclick="toggleFooterMenu(this)"><span class="mi">expand_less</span> Opciones</button>
        <button class="logout-btn" onclick="doLogout()">🔒 Salir</button>
      </div>`;
  } else if (userRole === "laboratorista") {
    footer.innerHTML = `
      <div class="footer-drawer" id="footerDrawer">
        <div class="footer-drawer-inner">
          <button class="footer-drawer-item" onclick="openSolicitudesPanel()">📋 Solicitudes${badgeHtml}</button>
          <button class="footer-drawer-item" onclick="openUserManager()">👥 Usuarios</button>
          <button class="footer-drawer-item" onclick="openAuditLog()">📜 Historial</button>
          <div class="footer-drawer-sep"></div>
          <button class="footer-drawer-item" onclick="exportCSV()">📊 Exportar CSV</button>
          <button class="footer-drawer-item" onclick="importBackup()">📥 Importar</button>
          <button class="footer-drawer-item" onclick="exportBackup()">💾 Backup</button>
          <button class="footer-drawer-item" onclick="printInventory()">🖨 Imprimir</button>
          <div class="footer-drawer-sep"></div>
          <button class="footer-drawer-item" id="themeToggle" onclick="toggleTheme()" aria-pressed="false"><span class="mi">dark_mode</span> Cambiar tema</button>
          <button class="footer-drawer-item" onclick="openChangePasswordModal()">🔑 Cambiar contraseña</button>
        </div>
      </div>
      <div class="footer-bar">
        <span class="footer-count" id="footerCount">${items.length} ítems · 🔬 ${esc(userName)}</span>
        <button class="footer-menu-toggle" onclick="toggleFooterMenu(this)"><span class="mi">expand_less</span> Opciones</button>
        <button class="logout-btn" onclick="doLogout()">🔒 Salir</button>
      </div>`;
  } else if (userRole === "usuario") {
    footer.innerHTML = `
      <div class="footer-drawer" id="footerDrawer">
        <div class="footer-drawer-inner">
          <button class="footer-drawer-item" onclick="openSolicitudesPanel()">📋 Mis Solicitudes${badgeHtml}</button>
          <div class="footer-drawer-sep"></div>
          <button class="footer-drawer-item" id="themeToggle" onclick="toggleTheme()" aria-pressed="false"><span class="mi">dark_mode</span> Cambiar tema</button>
          <button class="footer-drawer-item" onclick="openChangePasswordModal()">🔑 Cambiar contraseña</button>
        </div>
      </div>
      <div class="footer-bar">
        <span class="footer-count" id="footerCount">${items.filter(i=>i.status==="Presente").length} disponibles · 👤 ${esc(userName)}</span>
        <button class="footer-menu-toggle" onclick="toggleFooterMenu(this)"><span class="mi">expand_less</span> Opciones</button>
        <button class="logout-btn" onclick="doLogout()">🔒 Salir</button>
      </div>`;
  }
  updateThemeToggle();
}
