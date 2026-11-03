// 09-inventory-tools.js — Export CSV, móvil, códigos y ubicaciones
// Parte de App Inventory. Script clásico (scope global compartido).
// ═══════════════════════════════════════
//  EXPORT CSV
// ═══════════════════════════════════════
function exportCSV() {
  const si = sectionItems();
  const bom = "﻿";
  let csv = bom + "Ubicación,Código Inventario,Cajón,N.°,Material,Marca,N.° Placa,Serial Fabricante,Cantidad,Estado,Observaciones\n";
  si.forEach(i => {
    const e=s=>(s||"").toString().replace(/"/g,'""')
    csv += [`"${e(i.location)}"`,`"${e(locCodes[i.location])}"`,`"${e(i.drawer)}"`,i.num,`"${e(i.name)}"`,`"${e(i.brand)}"`,`"${e(i.placa||i.serial)}"`,`"${e(i.serialFabricante)}"`,i.quantity,`"${e(i.status)}"`,`"${e(i.observations)}"`].join(",") + "\n";
  });
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventario-${section}-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("CSV exportado");
}

// ═══════════════════════════════════════
//  MOBILE
// ═══════════════════════════════════════
function toggleMobile() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("mobileOverlay").hidden = !document.getElementById("sidebar").classList.contains("open");
}
function closeMobile() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("mobileOverlay").hidden = true;
}
function toggleFooterMenu(btn) {
  const drawer = document.getElementById("footerDrawer");
  if (!drawer) return;
  const isOpen = drawer.classList.toggle("open");
  btn.classList.toggle("open", isOpen);
}

// ═══════════════════════════════════════
//  CÓDIGOS DE INVENTARIO
// ═══════════════════════════════════════
function editLocCode(locId) {
  const current = locCodes[locId] || "";
  const val = prompt("Código de inventario universitario para " + locId + ":", current);
  if (val !== null) {
    if (val.trim()) {
      locCodes[locId] = val.trim();
    } else {
      delete locCodes[locId];
    }
    saveData();
    render();
    toast(val.trim() ? "Código asignado" : "Código eliminado");
  }
}

function editDrawerNote(loc, drawer) {
  const key = loc + "::" + drawer;
  const current = drawerNotes[key] || "";
  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head"><h2>Nota — ${esc(drawer)}</h2><button class="modal-x" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <p style="font-size:12px;color:var(--text-sec);margin-bottom:8px">${esc(loc)} → ${esc(drawer)}</p>
      <div class="fg"><label>Nota / Observación del módulo</label><textarea id="f-dnote" rows="3" placeholder="Ej: Cerradura dañada, humedad, falta llave...">${esc(current)}</textarea></div>
    </div>
    <div class="modal-foot">
      ${current?`<button class="btn btn-danger" onclick="saveDrawerNote('${esc(key)}','')">Eliminar nota</button>`:''}
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-accent" onclick="saveDrawerNote('${esc(key)}',document.getElementById('f-dnote').value.trim())">Guardar</button>
    </div>`;
  document.getElementById("modalBg").hidden = false;
}

function saveDrawerNote(key, val) {
  if (val) {
    drawerNotes[key] = val;
  } else {
    delete drawerNotes[key];
  }
  saveData(); closeModal(); render();
  toast(val ? "Nota guardada" : "Nota eliminada");
}

// ═══════════════════════════════════════
//  LOCATION MANAGEMENT
// ═══════════════════════════════════════
const LOC_ICONS = ["🗄","🗃","📦","📋","🏷","🧰","🗂","📐","🔬","💡","🖥","📺","🪑","📁","🔧"];

function openLocModal(editId) {
  const isEdit = !!editId;
  let loc = null;
  if (isEdit) {
    loc = getLocs().find(l=>l.id===editId);
    if (!loc || !isCustomLoc(editId)) return;
  }

  const currentIcon = loc ? loc.icon : "📦";
  const currentName = loc ? loc.name : "";
  const currentDrawers = loc ? [...loc.drawers] : ["Sección 1"];

  let html = `
    <div class="modal-head"><h2>${isEdit?'Editar':'Nueva'} ubicación</h2><button class="modal-x" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="fg"><label>Nombre</label><input id="loc-name" value="${esc(currentName)}" placeholder="Ej: Armario Nuevo, Estante TVs"></div>
      <div class="fg"><label>Icono</label>
        <div class="icon-picker" id="iconPicker">
          ${LOC_ICONS.map(ic=>`<span class="icon-opt${ic===currentIcon?' selected':''}" data-icon="${ic}" onclick="pickLocIcon(this)">${ic}</span>`).join('')}
        </div>
        <input type="hidden" id="loc-icon" value="${currentIcon}">
      </div>
      <div class="fg"><label>Sección</label>
        <select id="loc-section" ${isEdit?'disabled':''}>
          <option value="materiales"${section==='materiales'?' selected':''}>Materiales</option>
          <option value="equipos"${section==='equipos'?' selected':''}>Equipos</option>
        </select>
      </div>
      <div class="fg"><label>Cajones / Pisos / Secciones</label>
        <div class="drawer-list-editor" id="drawerList">
          ${currentDrawers.map((d,i)=>`<div class="drawer-row"><input value="${esc(d)}" placeholder="Nombre de sección"><button onclick="removeDrawerRow(this)" title="Quitar">&times;</button></div>`).join('')}
        </div>
        <button class="add-drawer-btn" onclick="addDrawerRow()">+ Agregar sección</button>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:center">
          <input id="bulk-drawer-name" placeholder="Nombre base (ej: Cajón)" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg);color:var(--text)">
          <input id="bulk-drawer-count" type="number" min="1" max="50" placeholder="N.°" style="width:60px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg);color:var(--text)">
          <button class="btn btn-sm" onclick="addBulkDrawers()" style="white-space:nowrap">Crear masivo</button>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-accent" onclick="saveLoc(${isEdit?"'"+esc(editId)+"'":"null"})">${isEdit?'Guardar cambios':'Crear ubicación'}</button>
    </div>`;

  document.getElementById("modalBox").innerHTML = html;
  document.getElementById("modalBg").hidden = false;
}

function pickLocIcon(el) {
  document.querySelectorAll('#iconPicker .icon-opt').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('loc-icon').value = el.dataset.icon;
}

function addDrawerRow() {
  const list = document.getElementById('drawerList');
  const count = list.children.length + 1;
  const row = document.createElement('div');
  row.className = 'drawer-row';
  row.innerHTML = `<input value="Sección ${count}" placeholder="Nombre de sección"><button onclick="removeDrawerRow(this)" title="Quitar">&times;</button>`;
  list.appendChild(row);
}

function removeDrawerRow(btn) {
  const list = document.getElementById('drawerList');
  if (list.children.length <= 1) { toast("Mínimo 1 sección"); return; }
  btn.closest('.drawer-row').remove();
}

function addBulkDrawers() {
  const baseName = document.getElementById('bulk-drawer-name').value.trim();
  const count = parseInt(document.getElementById('bulk-drawer-count').value) || 0;
  if (!baseName) { toast("Ingresa un nombre base"); return; }
  if (count < 1 || count > 50) { toast("Cantidad entre 1 y 50"); return; }
  const list = document.getElementById('drawerList');
  for (let i = 1; i <= count; i++) {
    const row = document.createElement('div');
    row.className = 'drawer-row';
    row.innerHTML = `<input value="${baseName} ${i}" placeholder="Nombre de sección"><button onclick="removeDrawerRow(this)" title="Quitar">&times;</button>`;
    list.appendChild(row);
  }
  document.getElementById('bulk-drawer-name').value = '';
  document.getElementById('bulk-drawer-count').value = '';
  toast(`${count} secciones "${baseName}" agregadas`);
}

function saveLoc(editId) {
  const name = document.getElementById('loc-name').value.trim();
  if (!name) { toast("Ingresa un nombre"); return; }
  const icon = document.getElementById('loc-icon').value;
  const sec = document.getElementById('loc-section').value;
  const drawerEls = document.querySelectorAll('#drawerList input');
  const drawers = [];
  drawerEls.forEach(el => {
    const v = el.value.trim();
    if (v) drawers.push(v);
  });
  if (drawers.length === 0) { toast("Agrega al menos 1 sección"); return; }

  const targetArr = sec === "equipos" ? customEquiposLocs : customMaterialesLocs;

  if (editId) {
    // Edit existing
    const idx = targetArr.findIndex(l=>l.id===editId);
    if (idx === -1) return;
    const oldName = targetArr[idx].id;
    targetArr[idx].name = name;
    targetArr[idx].icon = icon;
    // Update drawers — keep existing drawer names that items reference
    const oldDrawers = targetArr[idx].drawers;
    targetArr[idx].drawers = drawers;
    // If id (name) changed, update items
    if (oldName !== name) {
      targetArr[idx].id = name;
      items.forEach(i => { if (i.location === oldName) i.location = name; });
    }
    // If drawer names changed, update items
    oldDrawers.forEach((od, di) => {
      if (drawers[di] && drawers[di] !== od) {
        items.forEach(i => { if (i.location === name && i.drawer === od) i.drawer = drawers[di]; });
      }
    });
  } else {
    // Check unique name
    const allLocs = getLocs();
    if (allLocs.some(l=>l.id===name)) { toast("Ya existe una ubicación con ese nombre"); return; }
    targetArr.push({ id: name, name: name, icon: icon, drawers: drawers });
  }

  saveData();
  closeModal();
  render();
  toast(editId ? "Ubicación actualizada" : "Ubicación creada");
}

function deleteLoc(locId) {
  if (!isCustomLoc(locId)) return;
  const locItems = items.filter(i => i.location === locId);
  const msg = locItems.length > 0
    ? `"${locId}" tiene ${locItems.length} ítem(s). ¿Eliminar la ubicación y todos sus ítems?`
    : `¿Eliminar la ubicación "${locId}"?`;
  showConfirm(msg, function() {
    // Remove items in this location
    items = items.filter(i => i.location !== locId);
    // Remove from custom arrays
    customMaterialesLocs = customMaterialesLocs.filter(l=>l.id!==locId);
    customEquiposLocs = customEquiposLocs.filter(l=>l.id!==locId);
    // Clean up locCodes
    delete locCodes[locId];
    // If currently viewing this location, go to dashboard
    if (currentLoc === locId) { currentLoc = null; currentDrawer = null; viewMode = "dashboard"; }
    saveData();
    render();
    toast("Ubicación eliminada");
  });
}

// ═══════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════
function esc(s) {
  if(!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML.replace(/'/g, '&#39;');
}
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 2000);
}

