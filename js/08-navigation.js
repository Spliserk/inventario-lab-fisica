// 08-navigation.js — Navegación, edición en línea y modales
// Parte de App Inventory. Script clásico (scope global compartido).
// ═══════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════


function goToDashboard() {
  currentLoc = null;
  currentLocFilter = null;
  currentDrawerFilter = null;
  currentDrawer = null;
  currentFilter = null;
  viewMode = "dashboard";
  render();
  closeMobile();
}

function goToAdminHome() {
  if (firestoreUnsubscribe) { firestoreUnsubscribe(); firestoreUnsubscribe = null; }
  currentLabId = null;
  currentLoc = null;
  currentDrawer = null;
  viewMode = "admin-home";
  render();
  closeMobile();
}

function goToLoc(loc) {
  const navKey = section + '::' + loc;
  const isExpanded = currentLoc === loc && viewMode === "drawers" && !collapsedNavLocs[navKey];
  if (isExpanded) {
    collapsedNavLocs[navKey] = true;
    saveCollapsedNavLocs();
    renderSidebar();
    closeMobile();
    return;
  }
  collapsedNavLocs[navKey] = false;
  saveCollapsedNavLocs();
  viewMode = "drawers";
  currentLoc = loc;
  currentDrawer = null;
  currentFilter = null;
  render();
  closeMobile();
}

function goToDrawer(loc, drawer) {
  viewMode = "list";
  currentLoc = loc;
  currentDrawer = drawer;
  currentFilter = null;
  render();
  closeMobile();
}

function setFilter(f) { currentFilter = f; renderContent(); }
function setLocFilter(f) { currentLocFilter = f; currentDrawerFilter = null; renderContent(); }
function setDrawerFilter(f) { currentDrawerFilter = f; renderContent(); }
function toggleModule(loc, drawer, headerEl) {
  const key = loc + '::' + drawer;
  const isOpen = expandedModules[key] !== false;
  expandedModules[key] = !isOpen;
  saveExpandedModules();
  const body = headerEl.nextElementSibling;
  if (body) { body.classList.toggle('open', !isOpen); }
  headerEl.classList.toggle('expanded', !isOpen);
}
function collapseAllModules() {
  if (!currentLoc) return;
  const loc = getLocs().find(l => l.id === currentLoc);
  if (!loc) return;
  loc.drawers.forEach(d => { expandedModules[currentLoc + '::' + d] = false; });
  saveExpandedModules();
  renderContent();
}
function expandAllModules() {
  if (!currentLoc) return;
  const loc = getLocs().find(l => l.id === currentLoc);
  if (!loc) return;
  loc.drawers.forEach(d => { expandedModules[currentLoc + '::' + d] = true; });
  saveExpandedModules();
  renderContent();
}

let _searchDebounce;
document.getElementById("searchInput").addEventListener("input", function() {
  const self = this;
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(function() {
    if (self.value.trim()) { viewMode = "list"; currentLoc = null; currentDrawer = null; currentFilter = null; currentLocFilter = null; currentDrawerFilter = null; }
    else { currentLocFilter = null; currentDrawerFilter = null; }
    selectedItems.clear();
    render();
  }, 250);
});

// ═══════════════════════════════════════
//  INLINE EDITING
// ═══════════════════════════════════════
function editField(id, field) {
  const item = items.find(i=>i.id===id);
  if(!item) return;
  // Find the clicked editable span and replace with inline input
  const spans = document.querySelectorAll(`.editable[onclick*="'${id}','${field}'"]`);
  const span = spans[0];
  if (!span) return;
  const currentVal = item[field] || '';
  const wrap = document.createElement('div');
  wrap.className = 'inline-edit-wrap';
  const isTextarea = field === 'observations';
  const inputEl = document.createElement(isTextarea ? 'textarea' : 'input');
  inputEl.className = 'inline-edit-input';
  inputEl.value = currentVal;
  if (isTextarea) { inputEl.rows = 2; }
  if (field === 'quantity') { inputEl.type = 'number'; inputEl.min = '0'; }
  const actions = document.createElement('div');
  actions.className = 'inline-edit-actions';
  actions.innerHTML = '<button onclick="confirmInlineEdit(this)" title="Guardar">✓</button><button onclick="cancelInlineEdit(this)" title="Cancelar">✕</button>';
  wrap.appendChild(inputEl);
  wrap.appendChild(actions);
  wrap.dataset.itemId = id;
  wrap.dataset.field = field;
  span.replaceWith(wrap);
  inputEl.focus();
  inputEl.select();
  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !isTextarea) { e.preventDefault(); confirmInlineEdit(inputEl); }
    if (e.key === 'Escape') cancelInlineEdit(inputEl);
  });
}

function confirmInlineEdit(el) {
  const wrap = el.closest('.inline-edit-wrap');
  if (!wrap) return;
  const id = wrap.dataset.itemId;
  const field = wrap.dataset.field;
  const input = wrap.querySelector('.inline-edit-input');
  const val = input.value;
  const item = items.find(i=>i.id===id);
  if (item) {
    const oldVal = item[field];
    item[field] = val;
    logAction("editar_campo", `${field}: "${oldVal}" → "${val}" (ítem: ${item.name})`);
    saveData();
    render();
    toast("Actualizado");
  }
}

function cancelInlineEdit(el) {
  render(); // Re-render restores original state
}

function editStatus(id, event) {
  const item = items.find(i=>i.id===id);
  if(!item) return;
  // Remove any existing dropdown
  closeStatusDropdown();

  const STATUS_COLORS = {
    "Presente":"var(--green)","Desgastado":"var(--amber)",
    "Dañado":"var(--red)",
    "No Préstamo":"var(--purple)","Faltante":"var(--red)",
    "Prestado":"var(--accent)"
  };

  // Create overlay to close on outside click/tap
  const overlay = document.createElement('div');
  overlay.className = 'status-dropdown-overlay';
  overlay.addEventListener('click', closeStatusDropdown);
  overlay.addEventListener('touchend', function(e) { e.preventDefault(); closeStatusDropdown(); });
  document.body.appendChild(overlay);

  // Create dropdown
  const dd = document.createElement('div');
  dd.className = 'status-dropdown';
  dd.id = 'activeStatusDropdown';
  STATUSES.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'status-dropdown-item' + (s === item.status ? ' selected' : '');
    btn.innerHTML = `<span class="status-dropdown-dot" style="background:${STATUS_COLORS[s]||'var(--text-dim)'}"></span>${s}${s === item.status ? ' ✓' : ''}`;
    btn.onclick = function(e) {
      e.stopPropagation();
      e.preventDefault();
      // Re-find item in current items array to avoid stale closure reference
      const freshItem = items.find(i=>i.id===id);
      if (!freshItem) { closeStatusDropdown(); return; }
      const oldStatus = freshItem.status;
      freshItem.status = s;
      logAction("cambiar_estado", `${freshItem.name}: "${oldStatus}" → "${s}"`);
      saveData();
      closeStatusDropdown();
      render();
      toast("Estado: " + s);
    };
    dd.appendChild(btn);
  });

  // Position near the clicked element
  const rect = event.target.closest('.status-tag').getBoundingClientRect();
  dd.style.position = 'fixed';
  dd.style.left = rect.left + 'px';
  dd.style.top = (rect.bottom + 4) + 'px';
  dd.style.maxHeight = 'none';
  dd.style.overflowY = 'visible';
  // Ensure it doesn't go off screen
  document.body.appendChild(dd);
  const ddRect = dd.getBoundingClientRect();
  if (ddRect.right > window.innerWidth - 8) {
    dd.style.left = Math.max(8, window.innerWidth - ddRect.width - 8) + 'px';
  }
  if (ddRect.bottom > window.innerHeight - 8) {
    // Try positioning above the tag
    const topPos = rect.top - ddRect.height - 4;
    if (topPos >= 8) {
      dd.style.top = topPos + 'px';
    } else {
      // Not enough space above either — cap to viewport and make scrollable
      dd.style.top = '8px';
      dd.style.maxHeight = (rect.top - 12) + 'px';
      dd.style.overflowY = 'auto';
    }
  }
  // Also check if dropdown is clipped at the top (opened downward but too high)
  const finalRect = dd.getBoundingClientRect();
  if (finalRect.top < 8) {
    dd.style.top = '8px';
    dd.style.maxHeight = (window.innerHeight - 16) + 'px';
    dd.style.overflowY = 'auto';
  }
}

function closeStatusDropdown() {
  const dd = document.getElementById('activeStatusDropdown');
  if (dd) dd.remove();
  const overlay = document.querySelector('.status-dropdown-overlay');
  if (overlay) overlay.remove();
}

// ═══════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════
function openAddModal() {
  const locs = getLocs();
  const loc = currentLoc || locs[0]?.id || "";
  const drawer = currentDrawer || (locs.find(l=>l.id===loc)?.drawers[0] || "");
  const maxNum = Math.max(0, ...sectionItems().filter(i=>i.location===loc&&i.drawer===drawer).map(i=>i.num));

  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head"><h2>Agregar ítem</h2><button class="modal-x" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="fg-row">
        <div class="fg"><label>Ubicación</label><select id="f-loc" onchange="onLocChange()">${locs.map(l=>`<option value="${esc(l.id)}"${l.id===loc?' selected':''}>${esc(l.name)}</option>`).join('')}</select></div>
        <div class="fg"><label>Cajón / Piso</label><select id="f-dr">${(locs.find(l=>l.id===loc)?.drawers||[]).map(d=>`<option value="${esc(d)}"${d===drawer?' selected':''}>${esc(d)}</option>`).join('')}</select></div>
      </div>
      <div class="fg-row">
        <div class="fg"><label>N.°</label><input id="f-num" type="number" value="${maxNum+1}"></div>
        <div class="fg"><label>Cantidad</label><input id="f-qty" value="1"></div>
      </div>
      <div class="fg-row">
        <div class="fg"><label>Material / Elemento</label><input id="f-name" placeholder="Ej: Dinamómetro de resorte"></div>
        <div class="fg"><label>Marca</label><input id="f-brand" placeholder="Ej: ABC, Vernier"></div>
      </div>
      <div class="fg-row">
        <div class="fg"><label>N.° Placa</label><input id="f-placa" placeholder="Opcional"></div>
        <div class="fg"><label>N.° Serial (fabricante)</label><input id="f-serial" placeholder="Número del fabricante (opcional)"></div>
      </div>
      <div class="fg"><label>Estado</label><select id="f-st">${STATUSES.map(s=>`<option>${s}</option>`).join('')}</select></div>
      <div class="fg"><label>Observaciones</label><textarea id="f-obs" rows="2" placeholder="Detalles..."></textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-accent" onclick="saveNewItem()">Guardar</button>
    </div>`;
  document.getElementById("modalBg").hidden = false;
}

function openEditModal(id) {
  const item = items.find(i=>i.id===id);
  if(!item) return;
  const locs = getLocs();

  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head"><h2>Editar</h2><button class="modal-x" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="fg-row">
        <div class="fg"><label>Ubicación</label><select id="f-loc" onchange="onLocChange()">${locs.map(l=>`<option value="${esc(l.id)}"${l.id===item.location?' selected':''}>${esc(l.name)}</option>`).join('')}</select></div>
        <div class="fg"><label>Cajón / Piso</label><select id="f-dr">${(locs.find(l=>l.id===item.location)?.drawers||[]).map(d=>`<option value="${esc(d)}"${d===item.drawer?' selected':''}>${esc(d)}</option>`).join('')}</select></div>
      </div>
      <div class="fg-row">
        <div class="fg"><label>N.°</label><input id="f-num" type="number" value="${item.num}"></div>
        <div class="fg"><label>Cantidad</label><input id="f-qty" value="${esc(String(item.quantity))}"></div>
      </div>
      <div class="fg-row">
        <div class="fg"><label>Material / Elemento</label><input id="f-name" value="${esc(item.name)}"></div>
        <div class="fg"><label>Marca</label><input id="f-brand" value="${esc(item.brand)}"></div>
      </div>
      <div class="fg-row">
        <div class="fg"><label>N.° Placa</label><input id="f-placa" value="${esc(item.placa||item.serial||'')}"></div>
        <div class="fg"><label>N.° Serial (fabricante)</label><input id="f-serial" value="${esc(item.serialFabricante||'')}" placeholder="Número del fabricante (opcional)"></div>
      </div>
      <div class="fg"><label>Estado</label><select id="f-st">${STATUSES.map(s=>`<option${s===item.status?' selected':''}>${s}</option>`).join('')}</select></div>
      <div class="fg"><label>Observaciones</label><textarea id="f-obs" rows="2">${esc(item.observations)}</textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-danger" onclick="deleteItem('${item.id}');closeModal()">Eliminar</button>
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-accent" onclick="updateItem('${item.id}')">Guardar</button>
    </div>`;
  document.getElementById("modalBg").hidden = false;
}

function onLocChange() {
  const loc = document.getElementById("f-loc").value;
  const locs = getLocs();
  const sel = document.getElementById("f-dr");
  sel.innerHTML = (locs.find(l=>l.id===loc)?.drawers||[]).map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('');
}

function closeModal() { document.getElementById("modalBg").hidden = true; }
document.getElementById("modalBg").addEventListener("click", function(e) { if(e.target===this) closeModal(); });

function saveNewItem() {
  const item = {
    id: String(nextId++),
    section: section,
    location: document.getElementById("f-loc").value,
    drawer: document.getElementById("f-dr").value,
    num: parseInt(document.getElementById("f-num").value)||1,
    name: document.getElementById("f-name").value.trim(),
    brand: document.getElementById("f-brand").value.trim(),
    quantity: document.getElementById("f-qty").value.trim(),
    status: document.getElementById("f-st").value,
    observations: document.getElementById("f-obs").value.trim(),
    placa: document.getElementById("f-placa").value.trim(),
    serial: "",
    serialFabricante: (document.getElementById("f-serial")?.value||"").trim(),
  };
  if(!item.name){ toast("Ingresa un nombre"); return; }
  items.push(item);
  logAction("agregar_item", `${item.name} en ${item.location}/${item.drawer}`);
  saveData(); closeModal(); render(); toast("Agregado");
}

function updateItem(id) {
  try {
    const item = items.find(i=>i.id===id);
    if(!item) { toast("Error: ítem no encontrado"); closeModal(); return; }
    const loc = document.getElementById("f-loc");
    const dr = document.getElementById("f-dr");
    const num = document.getElementById("f-num");
    const name = document.getElementById("f-name");
    const brand = document.getElementById("f-brand");
    const qty = document.getElementById("f-qty");
    const st = document.getElementById("f-st");
    const obs = document.getElementById("f-obs");
    const placa = document.getElementById("f-placa");
    const serialFab = document.getElementById("f-serial");
    if (!loc || !name) { toast("Error: formulario no encontrado"); closeModal(); return; }
    item.location = loc.value;
    item.drawer = dr ? dr.value : item.drawer;
    item.num = parseInt(num ? num.value : item.num)||1;
    item.name = name.value.trim();
    item.brand = brand ? brand.value.trim() : item.brand;
    item.quantity = qty ? qty.value.trim() : item.quantity;
    item.status = st ? st.value : item.status;
    item.observations = obs ? obs.value.trim() : item.observations;
    item.placa = placa ? placa.value.trim() : (item.placa || item.serial || "");
    item.serialFabricante = serialFab ? serialFab.value.trim() : (item.serialFabricante || "");
    logAction("editar_item", `${item.name} (${item.location}/${item.drawer})`);
    saveData();
    closeModal();
    render();
    toast("Actualizado");
  } catch(err) {
    console.error("Error en updateItem:", err);
    toast("Error al guardar: " + err.message);
    closeModal();
  }
}

function showConfirm(msg, onYes) {
  const box = document.getElementById("modalBox");
  box.innerHTML = `
    <div class="modal-head"><h2>Confirmar</h2><button class="modal-x" onclick="closeModal()">&times;</button></div>
    <div class="modal-body"><p style="margin:8px 0">${msg}</p></div>
    <div class="modal-foot">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-danger" id="confirmYesBtn">Aceptar</button>
    </div>`;
  document.getElementById("modalBg").hidden = false;
  document.getElementById("confirmYesBtn").onclick = function() { closeModal(); onYes(); };
}

function deleteItem(id) {
  showConfirm("¿Eliminar este elemento?", function() {
    const delItem = items.find(i=>i.id===id);
    const delName = delItem ? delItem.name : id;
    items = items.filter(i=>i.id!==id);
    if (delItem) renumberAffectedDrawers([delItem]);
    logAction("eliminar_item", delName);
    saveData(); render(); toast("Eliminado");
  });
}
