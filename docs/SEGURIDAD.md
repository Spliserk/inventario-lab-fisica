# 🔐 Seguridad y migración a Firebase Auth

Esta guía explica el modelo de seguridad nuevo y cómo desplegarlo **sin perder datos**.

---

## ¿Qué cambió y por qué?

### El problema del esquema anterior
La app **no usaba autenticación real**. El login consultaba la colección `usuarios`
desde el navegador y comparaba un hash ahí mismo. Para que eso funcionara, las reglas
de Firestore tenían que estar **abiertas** (lectura/escritura para cualquiera). Consecuencias:

- Cualquiera podía leer **todas las contraseñas** (hashes) desde la consola del navegador.
  El salt era fijo y público, SHA-256 de una sola pasada, contraseñas de 4 caracteres →
  se rompían en segundos.
- Cualquiera podía **borrar o alterar todo el inventario** sin siquiera abrir la app.
- El "token" de sesión era base64 falsificable → cualquiera se hacía superadmin.

### La solución
| Antes | Ahora |
|-------|-------|
| Auth casera con hashes en Firestore | **Firebase Auth** (email + contraseña) |
| Reglas abiertas a todo el mundo | **Reglas de Firestore** que validan roles en el servidor |
| Superadmin `admin`/`admin123` público | Primer superadmin creado a mano, en privado |
| Roles chequeados solo en el cliente | Roles en `/usuarios/{uid}`, validados en `firestore.rules` |
| "Token" base64 falsificable | Sesión real gestionada por Firebase |

El login **sigue siendo por nombre de usuario**: la app resuelve el usuario a su email
mediante el mapa `/usernames/{usuario}` y luego autentica contra Firebase Auth.

---

## Modelo de datos

| Colección | Contenido | Quién escribe (según reglas) |
|-----------|-----------|------------------------------|
| `usuarios/{uid}` | `{username, displayName, email, role, labId}` — el id ES el uid de Auth | superadmin; o el propio usuario (campos no sensibles) |
| `usernames/{usuario}` | `{email, uid}` — mapa para login por usuario | superadmin; o el dueño al registrarse |
| `laboratorios/{labId}` | datos del laboratorio | superadmin |
| `inventario/{labId}` | ítems del inventario | superadmin, o laboratorista **de ese lab** |
| `solicitudes/{id}` | préstamos | crea cualquiera autenticado; aprueba el staff |
| `historial/{id}` | bitácora | crea cualquiera; inmutable (no se edita/borra) |

---

## 🚀 Despliegue (en orden)

### Paso 1 — Habilitar Firebase Authentication
1. [Firebase Console](https://console.firebase.google.com/) → proyecto **inventario-lab-fisica**.
2. **Authentication** → **Comenzar** → pestaña **Sign-in method**.
3. Habilita **Correo electrónico/contraseña** y guarda.

### Paso 2 — Publicar las reglas de Firestore
1. **Firestore Database** → pestaña **Reglas**.
2. Pega el contenido completo de [`firestore.rules`](../firestore.rules).
3. **Publicar**.

> A partir de aquí, nadie sin sesión puede leer ni escribir nada (salvo el ping de
> conexión). La app dejará de funcionar hasta crear el primer superadmin (Paso 3).

### Paso 3 — Crear el primer superadmin (a mano, una sola vez)
Como las reglas exigen ser superadmin para crear superadmins, el primero se crea en la consola.
El superadmin **no necesita un correo real**: el login es por nombre de usuario y usamos un
email *sintético* interno (`admin@appinventory.local`) solo como identificador de Firebase Auth.

1. **Authentication** → **Users** → **Add user**:
   - **Email:** `admin@appinventory.local` *(no es una bandeja real, es solo el identificador)*
   - **Password:** una contraseña fuerte (mín. 6 caracteres).
   - Copia el **User UID** que aparece en la lista.
2. **Firestore Database** → abre la colección `usuarios` (ya existe con tus usuarios
   actuales) → **Agregar documento**.
   > ⚠️ **Importante:** este documento NO se parece a los que ya tienes. Tus documentos
   > actuales tienen un **ID automático** y un campo `password` (formato viejo). El del
   > superadmin debe tener como **ID el UID** de Authentication y **NO lleva `password`**
   > (la contraseña la guarda Authentication). No uses "ID automático": pega el UID.
   - **ID del documento:** pega el **UID** del paso anterior (NO "ID automático").
   - Campos:
     | Campo | Tipo | Valor |
     |-------|------|-------|
     | `username` | string | `admin` (el que usarás para entrar) |
     | `displayName` | string | `Administrador` |
     | `email` | string | *(déjalo vacío — es el correo de contacto, opcional)* |
     | `role` | string | `superadmin` |
     | `labId` | null | *(elige el tipo "null")* |
3. Crea la colección `usernames`:
   - **ID del documento:** el `username` del paso anterior (ej. `admin`).
   - Campos: `email` (string, **`admin@appinventory.local`** — el mismo email sintético de Auth)
     y `uid` (string, el UID).
4. Entra a la app con **usuario `admin`** y tu contraseña (no escribes el correo en ningún lado).

> 💡 El mismo truco sirve para cualquier cuenta sin correo: desde el panel de "Nuevo usuario"
> deja el campo correo vacío y la app generará el email sintético automáticamente. Esas cuentas
> no reciben notificaciones ni pueden usar "¿Olvidó su contraseña?" (no tienen bandeja real).

### Paso 4 — Migrar los usuarios existentes
Las contraseñas viejas **no se pueden recuperar** (están hasheadas). Cada usuario deberá
fijar una nueva. El script automatiza la creación de las cuentas de Auth:

```bash
cd scripts
npm init -y && npm install firebase-admin
# Descarga la clave: Console → ⚙ → Cuentas de servicio → Generar clave privada
# Guárdala como scripts/serviceAccountKey.json
node migrate-to-auth.mjs --dry-run     # simula: muestra qué haría
node migrate-to-auth.mjs --links       # ejecuta y además imprime enlaces de reset
```

El script, por cada usuario con email válido: crea su cuenta de Auth, reescribe su perfil
en `/usuarios/{uid}`, crea su entrada en `/usernames`, y genera un enlace de
restablecimiento. Reporta aparte los usuarios **sin email** (migrarlos a mano, igual que
el Paso 3). Entrega a cada persona su enlace, o indícales usar **"¿Olvidó su contraseña?"**
en la pantalla de login.

> ⚠️ La clave `serviceAccountKey.json` da control total del proyecto. Ya está en `.gitignore`.
> No la compartas ni la subas al repo.

### Paso 5 — Verificar
- [ ] Login por usuario + contraseña funciona.
- [ ] "¿Olvidó su contraseña?" envía correo.
- [ ] Un usuario (rol `usuario`) **no** puede editar inventario (prueba a crear un ítem).
- [ ] Un laboratorista solo ve/edita **su** laboratorio.
- [ ] Desde la consola del navegador, sin sesión, `db.collection("usuarios").get()` **falla**.

---

## Limitaciones conocidas (sin backend)
- **Eliminar un usuario** borra su perfil (`/usuarios`, `/usernames`) y le quita el acceso
  de inmediato, pero su cuenta de Firebase Auth queda huérfana. Purgarla requiere la consola
  (Authentication → Users → eliminar) o el Admin SDK.
- **Cambiar el email de login** de otro usuario requiere el script/consola (no desde la app),
  porque cambiar el email de Auth exige privilegios de administrador del lado servidor.
- **Lectura de `/usuarios`:** cualquier usuario *autenticado* puede leer los perfiles
  (nombre, email, rol, lab) — ya no contienen contraseñas. Es necesario para que el cliente
  notifique por correo al staff cuando llega una solicitud (sin backend que lo haga). La
  escritura sí está restringida. Si quieres ocultar también los emails del staff, mueve el
  envío de correos a una Cloud Function y restringe la lectura a staff + dueño.
- Los roles se validan con lecturas `get()` dentro de las reglas. Es correcto y seguro;
  si en el futuro hay muchísimos usuarios, se puede migrar a **custom claims** con una
  Cloud Function (mejora de rendimiento, no de seguridad).

---

## Datos que son públicos por diseño (y está bien)
- El `apiKey` de Firebase en `index.html` **no es un secreto**: identifica el proyecto, no
  da acceso. Quien protege los datos son las **reglas**.
- El *public key* de EmailJS es público por diseño. Revisa los límites de envío en tu panel
  de EmailJS para evitar abuso.
