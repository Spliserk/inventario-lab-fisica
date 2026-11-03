#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
//  Migración: esquema de auth casero  →  Firebase Auth
// ───────────────────────────────────────────────────────────────────
//  Para cada doc de la colección /usuarios (esquema viejo con campo
//  "password" hasheado), este script:
//    1. Crea (o reutiliza) una cuenta en Firebase Auth con su email.
//    2. Reescribe el perfil como /usuarios/{uid} SIN el campo password.
//    3. Crea el mapa /usernames/{username} = { email, uid }.
//    4. Elimina el doc viejo (de id autogenerado) si quedó duplicado.
//    5. Genera un enlace de restablecimiento de contraseña (las viejas
//       no se pueden recuperar: están hasheadas).
//
//  Las contraseñas NO se migran (imposible: son hashes). Cada usuario
//  debe fijar una nueva con el enlace, o con "¿Olvidó su contraseña?".
//
//  USO:
//    1. Firebase Console → ⚙ Configuración del proyecto → Cuentas de
//       servicio → "Generar nueva clave privada". Guarda el JSON como
//       scripts/serviceAccountKey.json  (NO lo subas a git).
//    2. cd scripts && npm init -y && npm install firebase-admin
//    3. node migrate-to-auth.mjs --dry-run      (simula, no escribe nada)
//       node migrate-to-auth.mjs                (ejecuta la migración)
//       node migrate-to-auth.mjs --links        (además imprime enlaces de reset)
// ═══════════════════════════════════════════════════════════════════

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const DRY_RUN = process.argv.includes("--dry-run");
const PRINT_LINKS = process.argv.includes("--links");

const KEY_PATH = new URL("./serviceAccountKey.json", import.meta.url);
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(KEY_PATH, "utf8"));
} catch (e) {
  console.error("❌ No se encontró scripts/serviceAccountKey.json");
  console.error("   Descárgalo de Firebase Console → Cuentas de servicio → Generar clave privada.");
  process.exit(1);
}

initializeApp({ cert: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

function randomPassword() {
  return "Temp-" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase() + "!9";
}

async function ensureAuthUser(email, displayName) {
  try {
    const existing = await auth.getUserByEmail(email);
    return { uid: existing.uid, created: false };
  } catch (e) {
    if (e.code !== "auth/user-not-found") throw e;
    const u = await auth.createUser({
      email,
      emailVerified: false,
      password: randomPassword(),
      displayName: displayName || undefined,
      disabled: false,
    });
    return { uid: u.uid, created: true };
  }
}

async function main() {
  console.log(DRY_RUN ? "🔎 MODO SIMULACIÓN (no se escribe nada)\n" : "🚀 Migrando usuarios a Firebase Auth\n");

  const snap = await db.collection("usuarios").get();
  console.log(`Encontrados ${snap.size} perfiles en /usuarios\n`);

  const report = { migrados: 0, yaMigrados: 0, sinEmail: [], errores: [], links: [] };

  for (const doc of snap.docs) {
    const data = doc.data();
    const username = (data.username || "").trim().toLowerCase();
    const email = (data.email || "").trim().toLowerCase();
    const displayName = data.displayName || username;
    const role = data.role || "usuario";
    const labId = data.labId || null;

    // Un doc cuyo id ya luce como un uid de Auth (sin campo password) ya está migrado.
    if (!data.password && doc.id.length > 20) { report.yaMigrados++; continue; }

    if (!username) { report.errores.push(`${doc.id}: sin username`); continue; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      report.sinEmail.push(`@${username} (doc ${doc.id})`);
      continue;
    }

    try {
      if (DRY_RUN) {
        console.log(`• @${username} <${email}> → ${role}${labId ? " / " + labId : ""}`);
        report.migrados++;
        continue;
      }

      const { uid, created } = await ensureAuthUser(email, displayName);

      await db.collection("usuarios").doc(uid).set({
        username, displayName, email, role, labId,
        createdAt: data.createdAt || FieldValue.serverTimestamp(),
        migratedAt: FieldValue.serverTimestamp(),
      });
      await db.collection("usernames").doc(username).set({ email, uid });

      // Borra el doc viejo de id autogenerado (ya no coincide con el uid).
      if (doc.id !== uid) await db.collection("usuarios").doc(doc.id).delete();

      if (PRINT_LINKS) {
        const link = await auth.generatePasswordResetLink(email);
        report.links.push(`@${username} <${email}>:\n   ${link}`);
      }

      console.log(`✅ @${username} <${email}> → uid ${uid} ${created ? "(cuenta nueva)" : "(cuenta existente)"}`);
      report.migrados++;
    } catch (e) {
      console.error(`❌ @${username}: ${e.message}`);
      report.errores.push(`@${username}: ${e.message}`);
    }
  }

  console.log("\n──────── RESUMEN ────────");
  console.log(`Migrados:       ${report.migrados}`);
  console.log(`Ya migrados:    ${report.yaMigrados}`);
  if (report.sinEmail.length) {
    console.log(`\n⚠️  Sin email válido (migrar a mano desde la consola):`);
    report.sinEmail.forEach(u => console.log("   - " + u));
  }
  if (report.errores.length) {
    console.log(`\n❌ Errores:`);
    report.errores.forEach(u => console.log("   - " + u));
  }
  if (PRINT_LINKS && report.links.length) {
    console.log(`\n🔗 Enlaces de restablecimiento (entrégalos a cada usuario):`);
    report.links.forEach(l => console.log("   " + l + "\n"));
  }
  console.log("\nListo. Recuerda: cada usuario debe fijar su contraseña con el enlace");
  console.log('o con "¿Olvidó su contraseña?" en la pantalla de login.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
