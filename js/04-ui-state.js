// 04-ui-state.js — Indicador de sincronización y selección masiva
// Parte de App Inventory. Script clásico (scope global compartido).
// ═══════════════════════════════════════
//  SYNC STATUS INDICATOR
// ═══════════════════════════════════════
let syncState = "online";
function updateSyncIndicator(state, msg) {
  syncState = state;
  const el = document.getElementById("syncIndicator");
  if (!el) return;
  el.className = "sync-" + state;
  const txt = document.getElementById("syncText");
  if (txt) txt.textContent = msg || (state === "online" ? "Conectado" : state === "offline" ? "Sin conexión" : "Sincronizando...");
}

// ═══════════════════════════════════════
//  BULK SELECTION STATE
// ═══════════════════════════════════════
let selectedItems = new Set();

function toggleSelectItem(id) {
  if (selectedItems.has(id)) selectedItems.delete(id);
  else selectedItems.add(id);
  renderBulkBar();
  const cb = document.querySelector('input[data-item-id="' + id + '"]');
  if (cb) cb.checked = selectedItems.has(id);
}

function toggleSelectAll() {
  const display = getCurrentDisplay();
  if (selectedItems.size === display.length) {
    selectedItems.clear();
  } else {
    display.forEach(function(i) { selectedItems.add(i.id); });
  }
  renderContent();
}

function clearSelection() { selectedItems.clear(); renderContent(); }

function getCurrentDisplay() {
  var display = currentFilter ? getFiltered().filter(function(i){ return i.status===currentFilter; }) : getFiltered();
  if (currentLocFilter) display = display.filter(function(i){ return i.location===currentLocFilter; });
  if (currentDrawerFilter) display = display.filter(function(i){ return i.drawer===currentDrawerFilter; });
  return display;
}

function renderBulkBar() {
  var bar = document.getElementById("bulkBar");
  if (selectedItems.size === 0) {
    if (bar) bar.remove();
    return;
  }
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "bulkBar";
    bar.className = "bulk-bar";
    var contentEl = document.getElementById("content");
    contentEl.insertBefore(bar, contentEl.firstChild);
  }
  bar.innerHTML = '<span>' + selectedItems.size + ' seleccionados</span>' +
    '<button onclick="bulkChangeStatus(\'Presente\')">✓ Presente</button>' +
    '<button onclick="bulkChangeStatus(\'Desgastado\')">⚠ Desgastado</button>' +
    '<button onclick="bulkChangeStatus(\'Faltante\')">✕ Faltante</button>' +
    '<button onclick="bulkChangeStatus(\'Dañado\')">🔴 Dañado</button>' +
    '<button onclick="bulkDelete()">🗑 Eliminar</button>' +
    '<button class="bulk-close" onclick="clearSelection()" title="Limpiar selección">&times;</button>';
}

function bulkChangeStatus(newStatus) {
  if (selectedItems.size === 0) return;
  showConfirm("¿Cambiar " + selectedItems.size + " ítems a \"" + newStatus + "\"?", function() {
    var count = 0;
    selectedItems.forEach(function(id) {
      var item = items.find(function(i) { return i.id === id; });
      if (item) { item.status = newStatus; count++; }
    });
    logAction("cambio_masivo_estado", count + " ítems → " + newStatus);
    saveData();
    selectedItems.clear();
    render();
    toast(count + " ítems → " + newStatus);
  });
}

function renumberAffectedDrawers(removedItems) {
  const groupKey = item => JSON.stringify([item.section, item.location, item.drawer]);
  const affectedGroups = new Set(removedItems.map(groupKey));
  affectedGroups.forEach(key => {
    items.filter(item => groupKey(item) === key)
      .sort((a, b) => Number(a.num) - Number(b.num))
      .forEach((item, index) => { item.num = index + 1; });
  });
}

function bulkDelete() {
  if (selectedItems.size === 0) return;
  showConfirm("¿Eliminar " + selectedItems.size + " ítems? Esta acción no se puede deshacer.", function() {
    var count = selectedItems.size;
    var removedItems = items.filter(function(i) { return selectedItems.has(i.id); });
    items = items.filter(function(i) { return !selectedItems.has(i.id); });
    renumberAffectedDrawers(removedItems);
    logAction("eliminacion_masiva", count + " ítems eliminados");
    saveData();
    selectedItems.clear();
    render();
    toast(count + " ítems eliminados");
  });
}
