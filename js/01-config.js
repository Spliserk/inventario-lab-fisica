// 01-config.js — Estructuras de datos, estado, roles, config de EmailJS y Firebase
// Parte de App Inventory. Script clásico (scope global compartido).
// ═══════════════════════════════════════
//  DATA STRUCTURES
// ═══════════════════════════════════════

const EQUIPOS_MODULES = ["Acústica","Calorimetría","Mecánica","Ondas","Electrónica II","Mesa de Fuerzas","Óptica","Electricidad y Magnetismo"];

const EQUIPOS_LOCATIONS = [
  { id: "Kit A", name: "Kit A", icon: "📦", drawers: EQUIPOS_MODULES },
  { id: "Kit B", name: "Kit B", icon: "📦", drawers: EQUIPOS_MODULES },
  { id: "Kit C", name: "Kit C", icon: "📦", drawers: EQUIPOS_MODULES },
  { id: "Kit D", name: "Kit D", icon: "📦", drawers: EQUIPOS_MODULES },
  { id: "Kit E", name: "Kit E", icon: "📦", drawers: EQUIPOS_MODULES },
  { id: "Kit F", name: "Kit F", icon: "📦", drawers: EQUIPOS_MODULES },
];

const MATERIALES_LOCATIONS = [
  { id: "Escritorio", name: "Escritorio", icon: "🗄", drawers: ["Cajón 1","Cajón 2","Cajón 3","Cajón 4","Cajón 5","Cajón 6","Cajón 7","Cajón 8","Cajón 9","Cajón 10","Cajón 11","Cajón 12"] },
  { id: "Armario Gris", name: "Armario Gris", icon: "🗃", drawers: ["Piso 1","Piso 2","Piso 3","Piso 4","Piso 5"] },
  { id: "Materiales por fuera", name: "Materiales por fuera", icon: "📋", drawers: ["Mesa de laboratorio"] },
];

const STATUSES = ["Presente","Desgastado","Dañado","No Préstamo","Faltante","Prestado"];
const STATUS_CLS = {
  "Presente":"st-presente","Desgastado":"st-desgastado",
  "Dañado":"st-dañado",
  "No Préstamo":"st-no-prestamo","Faltante":"st-faltante",
  "Prestado":"st-prestado"
};

// ═══════════════════════════════════════
//  STATE
// ═══════════════════════════════════════
let section = "materiales"; // "materiales" | "equipos"
let items = [];
let nextId = 1;
let currentLoc = null;
let currentDrawer = null;
let currentFilter = null;
let viewMode = "dashboard"; // "dashboard" | "list"
let locCodes = {}; // { "Kit F": "INV-12345", ... } códigos de inventario por ubicación
let customMaterialesLocs = [];
let customEquiposLocs = [];
let drawerNotes = {}; // { "Kit A::Mesa de Fuerzas": "Cerradura dañada", ... }
let trash = []; // papelera de items eliminados
let currentLocFilter = null;   // combined filter: location (used during search)
let currentDrawerFilter = null; // combined filter: drawer (used during search)
let expandedModules = {};
try {
  const savedExpandedModules = localStorage.getItem("inv_expanded_modules");
  if (savedExpandedModules) {
    const parsedExpandedModules = JSON.parse(savedExpandedModules);
    if (parsedExpandedModules && typeof parsedExpandedModules === "object" && !Array.isArray(parsedExpandedModules)) {
      expandedModules = parsedExpandedModules;
    }
  }
} catch(e) {}

function saveExpandedModules() {
  try { localStorage.setItem("inv_expanded_modules", JSON.stringify(expandedModules)); } catch(e) {}
}
let collapsedNavLocs = {};
try {
  const savedCollapsedNavLocs = localStorage.getItem("inv_collapsed_nav_locs");
  if (savedCollapsedNavLocs) {
    const parsedCollapsedNavLocs = JSON.parse(savedCollapsedNavLocs);
    if (parsedCollapsedNavLocs && typeof parsedCollapsedNavLocs === "object" && !Array.isArray(parsedCollapsedNavLocs)) {
      collapsedNavLocs = parsedCollapsedNavLocs;
    }
  }
} catch(e) {}

function saveCollapsedNavLocs() {
  try { localStorage.setItem("inv_collapsed_nav_locs", JSON.stringify(collapsedNavLocs)); } catch(e) {}
}

// ═══════════════════════════════════════
//  USER ROLES
// ═══════════════════════════════════════
let userRole = null;     // "superadmin" | "admin" | "laboratorista" | "usuario"
let userName = null;     // nombre para mostrar del usuario logueado
let currentUid = null;   // uid de Firebase Auth del usuario logueado
let currentUsername = null; // nombre de usuario (login) del usuario logueado
let userEmail = null;    // correo del usuario logueado
let userLabId = null;    // lab principal (compatibilidad); primero de userLabIds
let userLabIds = [];     // laboratorios asignados al laboratorista (puede ser varios)
let userLabName = null;  // nombre del lab asignado
let currentLabId = null; // lab actualmente visualizado (admin/laboratorista puede cambiar)
let laboratorios = [];   // lista de laboratorios [{id, name, code, ...}]

// ── Roles y permisos ──
// "superadmin" y "admin" tienen los MISMOS poderes; la única diferencia es que
// el superadmin NO se puede eliminar. Usa isAdmin() para los permisos.
function isAdmin() { return userRole === "superadmin" || userRole === "admin"; }
function roleHasAdminPowers(role) { return role === "superadmin" || role === "admin"; }

// Laboratorios a los que el usuario actual tiene acceso (los admin acceden a todos).
function userLabList() {
  if (userLabIds && userLabIds.length) return userLabIds;
  return userLabId ? [userLabId] : [];
}
// ¿El usuario actual puede operar en este laboratorio?
function canAccessLab(labId) { return isAdmin() || userLabList().includes(labId); }

// Helper: can this user edit inventory?
function canEdit() { return isAdmin() || userRole === "laboratorista" || userRole === "editor"; }
// Helper: is this a read-only user? (includes legacy "lector" role)
function isReadOnly() { return !canEdit(); }

// ═══════════════════════════════════════
//  EMAILJS CONFIG
// ═══════════════════════════════════════
const EMAILJS_PUBLIC_KEY = "j-9F57RF1dwx3l1Us";
const EMAILJS_SERVICE_ID = "service_q2h2vyc";
const EMAILJS_TEMPLATE_ID = "template_zo62y1n";

// Inicializar EmailJS
try {
  if (typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY !== "TU_PUBLIC_KEY") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    // EmailJS inicializado
  }
} catch(e) {
  console.warn("EmailJS init failed:", e);
}
let solicitudes = [];    // loan requests array (from Firestore)

// ═══════════════════════════════════════
//  FIREBASE CONFIG
// ═══════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyBftjnuVvS6m5FviOQp9fxTlT6fYdr48Tw",
  authDomain: "inventario-lab-fisica.firebaseapp.com",
  projectId: "inventario-lab-fisica",
  storageBucket: "inventario-lab-fisica.firebasestorage.app",
  messagingSenderId: "841319727634",
  appId: "1:841319727634:web:c2922e036803168cec0ecb"
};

let db = null;
let auth = null;
let firestoreReady = false;
let firestoreUnsubscribe = null;
let savingToFirestore = false;
let ignoreNextSnapshot = false;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  firestoreReady = true;
  // Enable offline persistence for Firestore
  db.enablePersistence({ synchronizeTabs: true }).catch(err => {
    // Firestore persistence already enabled
  });
} catch(e) {
  console.warn("Firebase init failed, using localStorage only:", e);
}

function showSyncStatus(msg, color) {
  const el = document.getElementById("syncIndicator");
  if (!el) return;
  const state = color === "ok" ? "online" : color === "err" ? "offline" : "syncing";
  updateSyncIndicator(state, msg);
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { updateSyncIndicator("online"); }, 3000);
}
