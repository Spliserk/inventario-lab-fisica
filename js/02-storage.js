// 02-storage.js — Persistencia (localStorage + Firestore)
// Parte de App Inventory. Script clásico (scope global compartido).
// ═══════════════════════════════════════
//  STORAGE (LocalStorage + Firestore)
// ═══════════════════════════════════════
function storageGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch(e) { return null; }
}
function storageSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}

function saveData() {
  // Always save to localStorage (offline cache)
  storageSet("inv_items", items);
  storageSet("inv_nextId", nextId);
  storageSet("inv_locCodes", locCodes);
  storageSet("inv_customMatLocs", customMaterialesLocs);
  storageSet("inv_customEqLocs", customEquiposLocs);
  storageSet("inv_drawerNotes", drawerNotes);
  storageSet("inv_trash", trash);

  // Save to Firestore if available
  if (firestoreReady && db) {
    savingToFirestore = true;
    ignoreNextSnapshot = true;
    const dataDoc = {
      items: items,
      nextId: nextId,
      locCodes: locCodes,
      customMaterialesLocs: customMaterialesLocs,
      customEquiposLocs: customEquiposLocs,
      drawerNotes: drawerNotes,
      trash: trash,
      dataVersion: parseInt(storageGet("inv_dataVersion")) || 13,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: navigator.userAgent.substring(0, 50)
    };
    const labDocId = currentLabId || "lab_fisica";
    db.collection("inventario").doc(labDocId).set(dataDoc).then(() => {
      savingToFirestore = false;
      showSyncStatus("☁️ Sincronizado", "ok");
    }).catch(err => {
      savingToFirestore = false;
      console.warn("Firestore save error:", err);
      showSyncStatus("⚠️ Solo local", "err");
    });
  }
}

function applyLocalData(saved) {
  if (saved && saved.length > 0) {
    items = saved;
    // Migration v9: assign sections, remove old EQ-/Ref- items
    items = items.filter(i => {
      if (!i.location) return true;
      if (i.location.startsWith("EQ-") || i.location.startsWith("Ref-")) return false;
      return true;
    });
    items.forEach(i => {
      if (i.location && ["Kit A","Kit B","Kit C","Kit D","Kit E","Kit F"].includes(i.location)) {
        i.section = "equipos";
      } else {
        i.section = "materiales";
      }
    });
    nextId = storageGet("inv_nextId") || (Math.max(...items.map(i => parseInt(i.id)||0)) + 1);
    const eqCount = items.filter(i => i.section === "equipos").length;
    if (eqCount === 0) loadDefaultEquipos();
    const dataVer = storageGet("inv_dataVersion") || 0;
    if (dataVer < 10) {
      const materiales = items.filter(i => i.section === "materiales");
      items = materiales;
      loadDefaultEquipos();
      storageSet("inv_dataVersion", 10);
    }
    applyPhotoFindings();
    // Migration v11: Replace Mesa de Fuerzas items with correct ABC manual data
    const dataVer2 = storageGet("inv_dataVersion") || 0;
    if (dataVer2 < 11) {
      migrateMesaFuerzas();
      storageSet("inv_dataVersion", 11);
    }
    // Migration v12: Replace Calorimetría items with correct ABC manual data (2 bandejas)
    const dataVer3 = storageGet("inv_dataVersion") || 0;
    if (dataVer3 < 13) {
      migrateCalorimetria();
      storageSet("inv_dataVersion", 13);
    }
    // Migration v14: Replace Mecánica items with correct ABC manual data
    const dataVer4 = storageGet("inv_dataVersion") || 0;
    if (dataVer4 < 14) {
      migrateMecanica();
      storageSet("inv_dataVersion", 14);
    }
    // Migration v15: status cleanup + serial→placa rename
    const dataVer5 = storageGet("inv_dataVersion") || 0;
    if (dataVer5 < 15) {
      migrateV15();
      storageSet("inv_dataVersion", 15);
    }
  } else {
    loadDefaultMateriales();
    loadDefaultEquipos();
    storageSet("inv_dataVersion", 15);
  }
}

// Migration v11: Replace ONLY Mesa de Fuerzas items in all kits
// Preserves all other modules' states and all materiales data
function migrateMesaFuerzas() {
  const kits = ["Kit A","Kit B","Kit C","Kit D","Kit E","Kit F"];
  // Remove all existing Mesa de Fuerzas items
  items = items.filter(i => !(i.section === "equipos" && kits.includes(i.location) && i.drawer === "Mesa de Fuerzas"));
  // Recalculate nextId before generating new items
  nextId = Math.max(0, ...items.map(i => parseInt(i.id)||0)) + 1;
  // Generate correct Mesa de Fuerzas items per ABC manual
  kits.forEach(kit => {
    const mfItems = getMesaFuerzasItems(kit);
    items.push(...mfItems);
  });
  // Migration v11 complete
}

// Migration v12: Replace Calorimetría items with correct ABC manual data
// Items grouped by physical tray (bandeja izquierda/derecha) via observations field
function migrateCalorimetria() {
  const kits = ["Kit A","Kit B","Kit C","Kit D","Kit E","Kit F"];
  // Remove all existing Calorimetría items (any format: old, or split bandeja)
  items = items.filter(i => !(i.section === "equipos" && kits.includes(i.location) && (i.drawer === "Calorimetría" || i.drawer === "Calorimetría — Bandeja 1" || i.drawer === "Calorimetría — Bandeja 2")));
  nextId = Math.max(0, ...items.map(i => parseInt(i.id)||0)) + 1;
  kits.forEach(kit => {
    const calItems = getCalorimetriaItems(kit);
    items.push(...calItems);
  });
  // Migration v12-13 complete
}

function getCalorimetriaItems(kit) {
  const cal = "Calorimetría";
  const base = [];
  let id = nextId || (Math.max(0, ...items.map(i => parseInt(i.id)||0)) + 1);
  function add(num, name, brand, qty, status, obs) {
    base.push({id:String(id++), name:name, brand:brand, quantity:qty, status:status, observations:obs, section:"equipos", location:kit, drawer:cal, num:num});
    nextId = id;
  }
  // — Bandeja izquierda (instrumentos alargados y accesorios pequeños) —
  add(1,"Soporte metálico triangular, varilla de 70 cm","ABC",1,"Presente","Bandeja izquierda");
  add(2,"Refrigerante recto de Liebig de 200 mm","ABC",1,"Presente","Bandeja izquierda");
  add(3,"Dilatómetro de metales (pirómetro)","ABC",1,"Presente","Bandeja izquierda");
  add(4,"Aparato de Ingenhousz","ABC",1,"Presente","Bandeja izquierda");
  add(5,"Agitador de vidrio","ABC",1,"Presente","Bandeja izquierda");
  add(6,"Escala centimétrica","ABC",1,"Presente","Bandeja izquierda");
  add(7,"Tubos de vidrio","ABC",2,"Presente","Bandeja izquierda");
  add(8,"Termómetros para laboratorio","ABC",2,"Presente","Bandeja izquierda");
  add(9,"Tubos de ensayo refractario","ABC",3,"Presente","Bandeja izquierda");
  add(10,"Cilindros de aluminio de 25 g","ABC",2,"Presente","Bandeja izquierda");
  add(11,"Cilindros de cobre de 25 g","ABC",2,"Presente","Bandeja izquierda");
  add(12,"Tapón de caucho T-0 con perforación para tubo de 6 mm","ABC",1,"Presente","Bandeja izquierda");
  add(13,"Tapón de caucho T-4 para balón de destilación, con orificio para termómetro","ABC",1,"Presente","Bandeja izquierda");
  add(14,"Tapón de caucho T-4 para balón de destilación","ABC",1,"Presente","Bandeja izquierda");
  add(15,"Tapón de caucho T-6 sin perforaciones","ABC",1,"Presente","Bandeja izquierda");
  add(16,"Tapón T-6 con orificio para termómetro","ABC",1,"Presente","Bandeja izquierda");
  add(17,"Tapón de caucho T-1 para balón de 50 ml","ABC",1,"Presente","Bandeja izquierda");
  add(18,"Nueces o pinzas para sujeción N-4011C","ABC",2,"Presente","Bandeja izquierda");
  add(19,"Pinza para tubos de ensayo en madera","ABC",1,"Presente","Bandeja izquierda");
  add(20,"Pinzas para erlenmeyers, balones, etc","ABC",2,"Presente","Bandeja izquierda");
  add(21,"Pinza para bureta sencilla E-1006","ABC",1,"Presente","Bandeja izquierda");
  add(22,"Jeringa plástica","ABC",1,"Presente","Bandeja izquierda");
  add(23,"Manguera de látex de 3 x 7 mm (1 m long.)","ABC",1,"Presente","Bandeja izquierda");
  add(24,"Manguera de caucho para laboratorio de 8 x 12 mm (2 m)","ABC",1,"Presente","Bandeja izquierda");
  add(25,"Puntas de conexión juego x 2","ABC",1,"Presente","Bandeja izquierda");
  // — Bandeja derecha (aparatos grandes y vidriería) —
  add(26,"Balanza","ABC",1,"Presente","Bandeja derecha");
  add(27,"Calorímetro de Joule","ABC",1,"Presente","Bandeja derecha");
  add(28,"Anillo y bola de Gravesande","ABC",1,"Presente","Bandeja derecha");
  add(29,"Pulsómetro de Franklin","ABC",1,"Presente","Bandeja derecha");
  add(30,"Erlenmeyer","ABC",1,"Presente","Bandeja derecha");
  add(31,"Balón de destilación corriente","ABC",1,"Presente","Bandeja derecha");
  add(32,"Balón fondo redondo","ABC",1,"Presente","Bandeja derecha");
  add(33,"Vaso de precipitado","ABC",1,"Presente","Bandeja derecha");
  add(34,"Mechero de alcohol","ABC",1,"Presente","Bandeja derecha");
  add(35,"Trípode en hierro","ABC",1,"Presente","Bandeja derecha");
  add(36,"Malla en alambre galvanizado c/ asbesto","ABC",1,"Presente","Bandeja derecha");
  add(37,"Azul de metileno indic. color. frasco x 25 g","ABC",1,"Presente","Bandeja derecha");
  add(38,"Parafina sólida en trozos de 100 g","ABC",1,"Presente","Bandeja derecha");
  add(39,"Manual guía de experimentación","ABC",1,"Presente","Bandeja derecha");
  return base;
}

// Migration v14: Replace Mecánica items with correct ABC manual data
function migrateV15() {
  // 1. Migrate statuses: Posible faltante, Fuera → Faltante; Nota → No Préstamo
  items.forEach(i => {
    if (i.status === "Posible faltante" || i.status === "Fuera") i.status = "Faltante";
    if (i.status === "Nota") i.status = "No Préstamo";
    // 2. Migrate serial → placa (if placa not yet set)
    if (!i.placa && i.serial) { i.placa = i.serial; i.serial = ""; }
    if (!i.serialFabricante) i.serialFabricante = "";
    if (!i.placa) i.placa = "";
  });
}

function migrateMecanica() {
  const kits = ["Kit A","Kit B","Kit C","Kit D","Kit E","Kit F"];
  items = items.filter(i => !(i.section === "equipos" && kits.includes(i.location) && i.drawer === "Mecánica"));
  nextId = Math.max(0, ...items.map(i => parseInt(i.id)||0)) + 1;
  kits.forEach(kit => {
    const mecItems = getMecanicaItems(kit);
    items.push(...mecItems);
  });
  // Migration v14 complete
}

function getMecanicaItems(kit) {
  const mec = "Mecánica";
  const base = [];
  let id = nextId || (Math.max(0, ...items.map(i => parseInt(i.id)||0)) + 1);
  function add(num, name, brand, qty, status, obs) {
    base.push({id:String(id++), name:name, brand:brand, quantity:qty, status:status, observations:obs, section:"equipos", location:kit, drawer:mec, num:num});
    nextId = id;
  }
  // — Contenido principal Módulo de Mecánica —
  add(1,"Aparato de péndulo con juego de cuatro","ABC",1,"Presente","");
  add(2,"Aparato para la determinación de momentos y fuerzas","ABC",1,"Presente","");
  add(3,"Calibrador Vernier en acero","ABC",1,"Presente","");
  add(4,"Carrete de hilo","ABC",1,"Presente","");
  add(5,"Carros dinámicos (Juego de 2)","ABC",2,"Presente","");
  add(6,"Cronómetro plástico","ABC",1,"Presente","");
  add(7,"Dinamómetros","ABC",3,"Presente","");
  add(8,"Disparador o tiro parabólico","ABC",1,"Presente","");
  add(9,"Escala centimétrica","ABC",1,"Presente","");
  add(10,"Esfera de madera pequeña con gancho","ABC",1,"Presente","");
  add(11,"Esferas de madera grande con gancho","ABC",2,"Presente","");
  add(12,"Esferómetro de demostración","ABC",1,"Presente","");
  add(13,"Figuras centro de gravedad juego por 4","ABC",1,"Presente","");
  add(14,"Giroscopio modelo sencillo","ABC",1,"Presente","");
  add(15,"Nuez con gancho N-4015 GA","ABC",1,"Presente","");
  add(16,"Nuez o pinza para sujeción fija N-4011C","ABC",1,"Presente","");
  add(17,"Nuez o pinza para sujeción giratoria N-4055GI","ABC",1,"Presente","");
  add(18,"Pesas con gancho en juego 6 unidades","ABC",1,"Presente","");
  add(19,"Plano inclinado con juego de accesorios","ABC",1,"Presente","");
  add(20,"Polea diferencial","ABC",1,"Presente","");
  add(21,"Poleas sencillas con gancho","ABC",3,"Presente","");
  add(22,"Polea en paralelo (juego de 2)","ABC",1,"Presente","");
  add(23,"Polea en paralelo (juego de 3)","ABC",1,"Presente","");
  add(24,"Polipastos de 3 poleas triescalonadas","ABC",2,"Presente","");
  add(25,"Registrador de tiempo (ticómetro)","ABC",1,"Presente","");
  add(26,"Regla graduada de 50 cm acrílica","ABC",1,"Presente","");
  add(27,"Resortes de diferente elongación","ABC",3,"Presente","");
  add(28,"Tornillo micrométrico en acero inoxidable 0 a 25","ABC",1,"Presente","");
  add(29,"Torre inclinada de estabilidad","ABC",1,"Presente","");
  // — Aro de Muller y accesorios —
  add(30,"Anillo con mango","ABC",1,"Presente","Aro de Muller");
  add(31,"Aros metálicos","ABC",2,"Presente","Aro de Muller");
  add(32,"Bases triangulares","ABC",2,"Presente","Aro de Muller");
  add(33,"Dedal con hilo","ABC",1,"Presente","Aro de Muller");
  add(34,"Esferas de acero, cojinete para dedal","ABC",2,"Presente","Aro de Muller");
  add(35,"Nueces dobles N-4011C","ABC",2,"Presente","Aro de Muller");
  add(36,"Pesas para momento con prisionero / juego","ABC",4,"Presente","Aro de Muller");
  add(37,"Pesas para movimiento en juego","ABC",4,"Presente","Aro de Muller");
  add(38,"Polea sencilla con mango","ABC",1,"Presente","Aro de Muller");
  add(39,"Porta pesas","ABC",1,"Presente","Aro de Muller");
  add(40,"Prensa de mesa en aluminio","ABC",1,"Presente","Aro de Muller");
  add(41,"Tensores graduables con hilo","ABC",3,"Presente","Aro de Muller");
  add(42,"Tope para aro de Muller","ABC",1,"Presente","Aro de Muller");
  add(43,"Varillas, una con orificio superior","ABC",2,"Presente","Aro de Muller");
  add(44,"Varillas de rotación","ABC",2,"Presente","Aro de Muller");
  add(45,"Varilla metálica de 70 cm","ABC",1,"Presente","Aro de Muller");
  return base;
}

function getMesaFuerzasItems(kit) {
  const mf = "Mesa de Fuerzas";
  const base = [];
  let id = nextId || (Math.max(0, ...items.map(i => parseInt(i.id)||0)) + 1);
  function add(num, name, brand, qty, status, obs) {
    base.push({id:String(id++), name:name, brand:brand, quantity:qty, status:status, observations:obs, section:"equipos", location:kit, drawer:mf, num:num});
    nextId = id;
  }
  add(1,"Soporte en hierro tipo H con 4 tornillos en la base, para su nivelación","ABC",1,"Presente","");
  add(2,"Varilla cromada, con rosca","ABC",1,"Presente","");
  add(3,"Arandelas en bronce, una fija y una móvil","ABC",2,"Presente","");
  add(4,"Tuerca cabeza redonda en bronce","ABC",1,"Presente","");
  add(5,"Mesa circular con doble graduación, divisiones de 1°, de 0 hasta 360°, plato de 30 cm de diámetro","ABC",1,"Presente","");
  add(6,"Prensas móviles metálicas con poleas","ABC",3,"Presente","");
  add(7,"Pesas con ranura de 200 gramos en bronce","ABC",3,"Presente","");
  add(8,"Pesas con ranura de 100 gramos en bronce","ABC",3,"Presente","");
  add(9,"Pesas con ranura de 50 gramos en bronce","ABC",3,"Presente","");
  add(10,"Pesas con ranura de 20 gramos de bronce","ABC",3,"Presente","");
  add(11,"Porta Pesas de 6 cm de largo en bronce con hilo","ABC",3,"Presente","");
  add(12,"Platillo en acero inoxidable de 7 cm de diámetro","ABC",1,"Presente","");
  add(13,"Anillo en cobre","ABC",1,"Presente","");
  add(14,"Manual guía","ABC",1,"Presente","");
  add(15,"Estuche de lujo en madera","ABC",1,"Presente","");
  return base;
}

function loadData() {
  // Step 1: Load from localStorage immediately (fast, offline-ready)
  const saved = storageGet("inv_items");
  applyLocalData(saved);
  const savedCodes = storageGet("inv_locCodes");
  if (savedCodes) locCodes = savedCodes;
  const savedMatLocs = storageGet("inv_customMatLocs");
  if (savedMatLocs) customMaterialesLocs = savedMatLocs;
  const savedEqLocs = storageGet("inv_customEqLocs");
  if (savedEqLocs) customEquiposLocs = savedEqLocs;
  const savedDrNotes = storageGet("inv_drawerNotes");
  if (savedDrNotes) drawerNotes = savedDrNotes;
  const savedTrash = storageGet("inv_trash");
  if (savedTrash) trash = savedTrash;
  // Step 2: If Firestore is available, fetch latest data and set up real-time listener
  if (firestoreReady && db) {
    showSyncStatus("☁️ Conectando...", "warn");
    // Initial fetch
    const labDocId = currentLabId || "lab_fisica";
    db.collection("inventario").doc(labDocId).get().then(doc => {
      if (doc.exists) {
        const d = doc.data();
        items = d.items || [];
        nextId = d.nextId || (Math.max(...items.map(i => parseInt(i.id)||0)) + 1);
        locCodes = d.locCodes || {};
        customMaterialesLocs = d.customMaterialesLocs || [];
        customEquiposLocs = d.customEquiposLocs || [];
        drawerNotes = d.drawerNotes || {};
        trash = d.trash || [];
        // Migration v11: fix Mesa de Fuerzas in Firestore data too
        const fsVer = d.dataVersion || 0;
        if (fsVer < 11) {
          migrateMesaFuerzas();
        }
        // Migration v12: fix Calorimetría in Firestore data too (2 bandejas)
        if (fsVer < 13) {
          migrateCalorimetria();
        }
        // Migration v14: fix Mecánica in Firestore data too
        if (fsVer < 14) {
          migrateMecanica();
        }
        // Migration v15: status cleanup + serial→placa rename
        if (fsVer < 15) {
          migrateV15();
          saveData();
          db.collection("inventario").doc(labDocId).update({ dataVersion: 15 }).catch(()=>{});
          storageSet("inv_dataVersion", 15);
        }
        // Update localStorage cache
        storageSet("inv_items", items);
        storageSet("inv_nextId", nextId);
        storageSet("inv_locCodes", locCodes);
        storageSet("inv_customMatLocs", customMaterialesLocs);
        storageSet("inv_customEqLocs", customEquiposLocs);
        storageSet("inv_drawerNotes", drawerNotes);
        storageSet("inv_trash", trash);
        render();
        showSyncStatus("☁️ Sincronizado", "ok");
      } else if (labDocId === "lab_fisica") {
        // Migration: try loading from old "data" doc
        db.collection("inventario").doc("data").get().then(oldDoc => {
          if (oldDoc.exists) {
            const d = oldDoc.data();
            items = d.items || [];
            nextId = d.nextId || 1;
            locCodes = d.locCodes || {};
            customMaterialesLocs = d.customMaterialesLocs || [];
            customEquiposLocs = d.customEquiposLocs || [];
            drawerNotes = d.drawerNotes || {};
            trash = d.trash || [];
            saveData(); // Save to new lab_fisica doc
            showSyncStatus("☁️ Datos migrados", "ok");
          } else {
            saveData();
            showSyncStatus("☁️ Datos subidos", "ok");
          }
          render();
        }).catch(() => { saveData(); render(); });
      } else {
        // New empty lab
        items = [];
        nextId = 1;
        locCodes = {};
        customMaterialesLocs = [];
        customEquiposLocs = [];
        drawerNotes = {};
        trash = [];
        render();
        showSyncStatus("☁️ Lab vacío", "ok");
      }
    }).catch(err => {
      console.warn("Firestore initial load error:", err);
      showSyncStatus("⚠️ Modo offline", "err");
    });

    // Real-time listener for changes from other devices
    setupRealtimeSync();
  }

  // Save to localStorage (for first-time defaults)
  storageSet("inv_items", items);
  storageSet("inv_nextId", nextId);
}

function initConnectionMonitor() {
  // Detect network changes instantly via browser events
  window.addEventListener("online", () => {
    if (firestoreReady && db) {
      updateSyncIndicator("syncing", "Reconectando...");
      // Verify Firestore is reachable
      db.collection("_connectivity").doc("ping")
        .set({ t: Date.now() }, { merge: true })
        .then(() => updateSyncIndicator("online", "Conectado"))
        .catch(() => updateSyncIndicator("offline", "Sin conexión"));
    } else {
      updateSyncIndicator("online", "Local");
    }
  });
  window.addEventListener("offline", () => {
    updateSyncIndicator("offline", "Sin conexión");
  });
  // Set initial state based on browser
  if (!navigator.onLine) {
    updateSyncIndicator("offline", "Sin conexión");
  }
  // Periodic Firestore ping as fallback
  if (!firestoreReady || !db) return;
  const connRef = db.collection("_connectivity").doc("ping");
  setInterval(async () => {
    try {
      await connRef.set({ t: Date.now() }, { merge: true });
      if (syncState !== "online") updateSyncIndicator("online", "Conectado");
    } catch(e) {
      updateSyncIndicator("offline", "Sin conexión");
    }
  }, 30000);
}

function setupRealtimeSync() {
  if (!firestoreReady || !db) return;
  if (firestoreUnsubscribe) firestoreUnsubscribe(); // cleanup previous

  const labDocId = currentLabId || "lab_fisica";
  firestoreUnsubscribe = db.collection("inventario").doc(labDocId).onSnapshot(doc => {
    if (!doc.exists) return;
    // Skip snapshots triggered by our own saves (debounced window)
    if (ignoreNextSnapshot) {
      ignoreNextSnapshot = false;
      return;
    }
    // Don't overwrite data while user has modal or dropdown open
    if (!document.getElementById("modalBg").hidden || document.getElementById("activeStatusDropdown")) {
      return;
    }
    const d = doc.data();
    if (!d.items) return;

    items = d.items;
    // Inline migration for snapshot data
    items.forEach(i => {
      if (i.status === "Posible faltante" || i.status === "Fuera") i.status = "Faltante";
      if (i.status === "Nota") i.status = "No Préstamo";
      if (!i.placa && i.serial) { i.placa = i.serial; i.serial = ""; }
    });
    nextId = d.nextId || nextId;
    locCodes = d.locCodes || {};
    customMaterialesLocs = d.customMaterialesLocs || [];
    customEquiposLocs = d.customEquiposLocs || [];
    drawerNotes = d.drawerNotes || {};
    trash = d.trash || [];
    // Update localStorage cache
    storageSet("inv_items", items);
    storageSet("inv_nextId", nextId);
    storageSet("inv_locCodes", locCodes);
    storageSet("inv_customMatLocs", customMaterialesLocs);
    storageSet("inv_customEqLocs", customEquiposLocs);
    storageSet("inv_drawerNotes", drawerNotes);
    storageSet("inv_trash", trash);
    render();
    showSyncStatus("🔄 Actualizado", "ok");
  }, err => {
    console.warn("Firestore listener error:", err);
  });
}
