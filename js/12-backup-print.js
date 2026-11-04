// 12-backup-print.js — Backup, impresión, bitácora y título
// Parte de App Inventory. Script clásico (scope global compartido).
// ═══════════════════════════════════════
//  BACKUP & RESTORE
// ═══════════════════════════════════════
function exportBackup() {
  const backup = {
    version: "backup_v1",
    date: new Date().toISOString(),
    section: section,
    items: items,
    nextId: nextId,
    locCodes: locCodes,
    drawerNotes: drawerNotes,
    customMaterialesLocs: customMaterialesLocs,
    customEquiposLocs: customEquiposLocs
  };
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventario-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  logAction("exportar_backup", `${items.length} ítems`);
  toast("Backup descargado");
}

function importBackup() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,.csv,.xlsx,.xls";
  input.style.display = "none";
  document.body.appendChild(input);
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) { document.body.removeChild(input); return; }
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      toast("Formato Excel no soportado directamente. Guárdelo como CSV (UTF-8) desde Excel y vuelva a importar.");
      document.body.removeChild(input);
      return;
    }
    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        if (ext === 'json') {
          importFromJSON(ev.target.result);
        } else if (ext === 'csv') {
          importFromCSV(ev.target.result);
        } else {
          toast("Formato no soportado. Use .json o .csv");
        }
      } catch(err) {
        console.error("Import error:", err);
        toast("Error al importar: " + err.message);
      }
    };
    reader.readAsText(file);
    document.body.removeChild(input);
  };
  input.click();
}

function importFromJSON(text) {
  const data = JSON.parse(text);
  if (!data.items || !Array.isArray(data.items)) {
    toast("JSON inválido: no contiene ítems"); return;
  }
  showConfirm(`¿Importar ${data.items.length} ítems desde backup? Los datos actuales serán reemplazados.`, function() {
    items = data.items;
    nextId = data.nextId || Math.max(0, ...items.map(i=>parseInt(i.id)||0)) + 1;
    if (data.locCodes) locCodes = data.locCodes;
    if (data.drawerNotes) drawerNotes = data.drawerNotes;
    if (data.customMaterialesLocs) customMaterialesLocs = data.customMaterialesLocs;
    if (data.customEquiposLocs) customEquiposLocs = data.customEquiposLocs;
    logAction("importar_backup", `${items.length} ítems desde JSON`);
    saveData(); render();
    toast(`${items.length} ítems importados`);
  });
}

function importFromCSV(text) {
  // Strip BOM if present
  text = text.replace(/^﻿/, "");
  // Detect delimiter: if first line has more semicolons than commas, use semicolon
  const firstLine = text.split("\n")[0] || "";
  const delim = (firstLine.split(";").length > firstLine.split(",").length) ? ";" : ",";

  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) { toast("CSV vacío"); return; }
  // Parse header
  const header = parseCSVLine(lines[0], delim);
  const nameIdx = header.findIndex(h => /material|nombre|name/i.test(h));
  const locIdx = header.findIndex(h => /ubicaci|location/i.test(h));
  const codIdx = header.findIndex(h => /c[oó]digo.*inv|cod.*inv/i.test(h));
  const drawerIdx = header.findIndex(h => /caj[oó]n|drawer|secci[oó]n|piso/i.test(h));
  const statusIdx = header.findIndex(h => /estado|status/i.test(h));
  const brandIdx = header.findIndex(h => /marca|brand/i.test(h));
  const placaIdx = header.findIndex(h => /placa/i.test(h));
  const serialIdx = header.findIndex(h => /serial.*fabric|fabric.*serial/i.test(h));
  const serialFallbackIdx = placaIdx === -1 ? header.findIndex(h => /serial/i.test(h)) : -1;
  const qtyIdx = header.findIndex(h => /cant|quantity|qty/i.test(h));
  const obsIdx = header.findIndex(h => /observ|obs|notas/i.test(h));
  const numIdx = header.findIndex(h => /^n\.?\s*°?\s*$|^num/i.test(h));

  if (nameIdx === -1) { toast("CSV debe tener columna 'Material' o 'Nombre'"); return; }

  const newItems = [];
  let startId = nextId;
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i], delim);
    if (!cols[nameIdx]?.trim()) continue;
    const loc = cols[locIdx]?.trim() || currentLoc || "Sin ubicación";
    // If Código Inventario column exists, store locCode mapping
    if (codIdx !== -1 && cols[codIdx]?.trim()) {
      locCodes[loc] = cols[codIdx].trim();
    }
    newItems.push({
      id: String(startId++),
      section: section,
      location: loc,
      drawer: cols[drawerIdx]?.trim() || currentDrawer || "Sin sección",
      num: parseInt(cols[numIdx]) || i,
      name: cols[nameIdx].trim(),
      brand: cols[brandIdx]?.trim() || "",
      placa: cols[placaIdx]?.trim() || cols[serialFallbackIdx]?.trim() || "",
      serial: "",
      serialFabricante: cols[serialIdx]?.trim() || "",
      quantity: cols[qtyIdx]?.trim() || "1",
      status: cols[statusIdx]?.trim() || "Presente",
      observations: cols[obsIdx]?.trim() || ""
    });
  }

  if (newItems.length === 0) { toast("No se encontraron ítems en el CSV"); return; }

  showConfirm(`Se encontraron ${newItems.length} ítems en el CSV. ¿Agregar al inventario actual?`, function() {
    nextId = startId;
    items.push(...newItems);
    logAction("importar_csv", `${newItems.length} ítems desde CSV`);
    saveData(); render();
    toast(`${newItems.length} ítems importados desde CSV`);
  });
}

function parseCSVLine(line, delim) {
  if (!delim) delim = ",";
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === delim && !inQuotes) {
      result.push(current); current = "";
    } else if (c !== '\r') {
      current += c;
    }
  }
  result.push(current);
  return result;
}

// ═══════════════════════════════════════
//  PRINT
// ═══════════════════════════════════════
function printInventory() {
  // Set print date
  const dateEl = document.getElementById("printDate");
  if (dateEl) dateEl.textContent = "Generado: " + new Date().toLocaleDateString("es-CO", { year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit" });
  window.print();
}

// ═══════════════════════════════════════
//  AUDIT LOG VIEW
// ═══════════════════════════════════════
async function openAuditLog(global) {
  if (!firestoreReady) { toast("Sin conexión"); return; }
  if (global && isAdmin()) {
    if (firestoreUnsubscribe) { firestoreUnsubscribe(); firestoreUnsubscribe = null; }
    currentLabId = null;
  }
  currentLoc = null; currentDrawer = null;
  viewMode = "audit";

  const el = document.getElementById("content");
  el.innerHTML = '<div style="max-width:700px;margin:0 auto;padding:20px"><h2 style="font-family:var(--sans);font-size:18px;margin-bottom:16px">Historial de Cambios</h2><p style="color:var(--text-sec)">Cargando...</p></div>';

  try {
    const snap = await db.collection("historial").orderBy("timestamp","desc").limit(100).get();
    let html = '<div style="max-width:700px;margin:0 auto;padding:20px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
    html += '<h2 style="font-family:var(--sans);font-size:18px;margin:0">Historial de Cambios</h2>';
    html += `<button class="btn btn-sm" onclick="${isAdmin()?'goToAdminHome()':'goToDashboard()'}">← Volver</button></div>`;

    if (snap.empty) {
      html += '<p style="color:var(--text-sec);text-align:center;padding:30px 0">No hay registros aún</p>';
    } else {
      html += '<div style="border:1px solid var(--border-light);border-radius:var(--radius);overflow:hidden">';
      snap.forEach(doc => {
        const d = doc.data();
        const date = d.timestamp ? new Date(d.timestamp.seconds * 1000).toLocaleString("es-CO") : "—";
        html += `<div class="log-entry">
          <div style="display:flex;justify-content:space-between"><span class="log-action">${esc(d.action)}</span><span class="log-time">${date}</span></div>
          <div class="log-detail">${esc(d.details)}</div>
          <div style="font-size:11px;color:var(--text-dim)">👤 ${esc(d.user)} · ${esc(d.section||"")}</div>
        </div>`;
      });
      html += '</div>';
    }
    html += '</div>';
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div style="max-width:700px;margin:0 auto;padding:20px"><p style="color:var(--red)">Error cargando historial</p></div>';
  }
}

// ═══════════════════════════════════════
//  LOAN COUNT PER ITEM
// ═══════════════════════════════════════
function getActiveLoans(itemId) {
  return solicitudes.filter(s => s.itemId === itemId && (s.status === "pendiente" || s.status === "aprobada")).length;
}

// ═══════════════════════════════════════
//  TITLE NOTIFICATION
// ═══════════════════════════════════════
function updateTitleBadge() {
  const relevant = getSolicitudesForRole();
  const pending = relevant.filter(s => s.status === "pendiente").length;
  const lab = laboratorios.find(l => l.id === currentLabId);
  const base = lab ? lab.name : "App Inventory";
  document.title = pending > 0 ? `(${pending}) ${base}` : base;
}
