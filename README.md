# 🧪 App Inventory — UNISANGIL

**App Inventory** es un sistema web de gestión de inventario para laboratorios de la Universidad de San Gil (UNISANGIL), Sede Yopal. Aplicación de página única (SPA) en HTML/CSS/JavaScript vanilla (organizada en `css/` y módulos `js/` por área) con Firebase Auth y Firestore como backend en la nube.

> Desarrollado como parte de Trabajo de Grado

---

## Características principales

### Gestión multilaboratorio
- Soporte para múltiples laboratorios con inventarios completamente independientes
- Panel administrativo con vista general de todos los laboratorios
- Cada laboratorio tiene sus propias ubicaciones, secciones, ítems y códigos de inventario

### Sistema de roles
| Rol | Permisos |
|-----|----------|
| **Superadministrador** | Gestión total: crear/eliminar laboratorios, administrar usuarios, ver todos los inventarios, operaciones masivas |
| **Laboratorista** | Gestión completa del inventario de su laboratorio asignado |
| **Usuario** | Consulta del inventario y solicitud de préstamos |

### Inventario
- Dos secciones por laboratorio: **Materiales** (mesas, gabinetes) y **Equipos** (Kits A–F con módulos ABC)
- Dashboard con resumen visual por estado y ubicación
- Vista por cajón/módulo con barras de estado codificadas por color
- Ubicaciones personalizables (crear, editar, eliminar)
- Creación masiva de secciones (ej: "Cajón" × 10 genera Cajón 1 a Cajón 10)
- Búsqueda en tiempo real por nombre, marca, ubicación u observaciones
- Códigos de inventario universitario por ubicación

### Estados de ítems
| Estado | Color | Descripción |
|--------|-------|-------------|
| Presente | 🟢 Verde | Disponible en su ubicación |
| Desgastado | 🟡 Amarillo | Funcional pero con desgaste |
| Dañado | 🔴 Rojo | Requiere reparación o reemplazo |
| No Préstamo | 🟣 Morado | No disponible para préstamo |
| Faltante | ⚫ Gris | No se encuentra en el inventario |
| Prestado | 🔵 Azul | En préstamo activo |

### Sistema de préstamos
- Modalidad por **horas** y por **días**
- Solicitudes de préstamo con flujo de aprobación
- Seguimiento del estado de cada préstamo
- Los usuarios pueden solicitar; los laboratoristas y superadmin aprueban/rechazan

### Notificaciones
- Notificaciones bidireccionales por correo electrónico vía **EmailJS**
- Alertas al solicitar, aprobar o rechazar préstamos

### Exportación e importación
- **Exportar CSV**: descarga el inventario de la sección activa en formato CSV (UTF-8 con BOM)
- **Importar CSV**: carga masiva de ítems desde archivos CSV (detecta automáticamente delimitador `,` o `;`)
- **Backup JSON**: exportación/importación completa del inventario en formato JSON
- Plantilla de importación incluida (`plantilla_importacion_inventario.csv`)

### Columnas del CSV
```
Ubicación, Código Inventario, Cajón, N.°, Material, Marca, N.° Placa, Serial Fabricante, Cantidad, Estado, Observaciones
```

### Otras funcionalidades
- Bitácora de auditoría con registro de todas las acciones
- Modo oscuro automático (sigue la preferencia del sistema) con toggle manual
- Diseño responsive (móvil, tablet, escritorio)
- Autenticación con **Firebase Auth** y roles validados en el servidor mediante reglas de Firestore
- Sincronización en la nube con Firebase Firestore
- Modo offline con localStorage que sincroniza al reconectar
- Material Design 3 con Google Material Symbols

---

## Tecnologías

| Tecnología | Uso |
|------------|-----|
| HTML/CSS/JavaScript | Frontend vanilla organizado en css/ y js/ por área |
| Firebase Firestore | Base de datos en la nube en tiempo real |
| Firebase Auth | Autenticación de usuarios (email/contraseña) |
| EmailJS | Envío de correos electrónicos desde el cliente |
| Google Fonts | Tipografías DM Sans, Source Sans 3, IBM Plex Mono |
| Material Symbols | Iconografía |
| GitHub Pages | Hosting estático |

---

## Uso

### Opción 1 — GitHub Pages (recomendado)

Visita: **[https://spliserk.github.io/inventario-lab-fisica/](https://spliserk.github.io/inventario-lab-fisica/)**

### Opción 2 — Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Spliserk/inventario-lab-fisica.git
   ```
2. Abre `index.html` en cualquier navegador moderno.

### Opción 3 — Servidor web

Copia `index.html` a cualquier servidor web estático (Apache, Nginx, Vercel, Netlify, etc.).

---

## Estructura del proyecto

```
inventario-lab-fisica/
├── index.html            # Estructura HTML (carga css/ y js/)
├── css/
│   └── styles.css        # Todos los estilos
├── js/                   # Lógica por área (scripts clásicos, en orden)
│   ├── 01-config.js      # Datos, estado, roles, config de EmailJS/Firebase
│   ├── 02-storage.js     # Persistencia (localStorage + Firestore)
│   ├── 03-auth.js        # Autenticación (Firebase Auth) y auditoría
│   ├── 04-ui-state.js    # Indicador de sync y selección masiva
│   ├── 05-seed-data.js   # Datos semilla de materiales/equipos
│   ├── 06-rendering.js   # Renderizado de vistas
│   ├── 07-labs.js        # Gestión de laboratorios
│   ├── 08-navigation.js  # Navegación, edición en línea, modales
│   ├── 09-inventory-tools.js  # Export CSV, móvil, códigos, ubicaciones
│   ├── 10-login-users.js # Login y gestión de usuarios
│   ├── 11-loans.js       # Préstamos y notificaciones
│   ├── 12-backup-print.js# Backup, impresión, bitácora
│   └── 13-init.js        # Arranque (service worker + auth listener)
├── icons/                # Iconos de la PWA
├── manifest.webmanifest  # Manifiesto PWA (instalable)
├── sw.js                 # Service worker (offline)
├── firestore.rules       # Reglas de seguridad de Firestore
├── scripts/              # Herramientas: migración a Auth, generador de iconos
├── docs/
│   └── SEGURIDAD.md      # Guía de seguridad, despliegue y migración
└── README.md             # Este archivo
```

> **Nota sobre la arquitectura:** los archivos de `js/` son *scripts clásicos* (no módulos ES),
> cargados en orden en `index.html`. Comparten un único scope global, por lo que las funciones
> siguen siendo accesibles desde los `onclick` del HTML. El orden de carga importa: `01` define
> la config y `13` arranca la app al final.

---

## Seguridad

La autenticación usa **Firebase Auth** (email + contraseña) y los roles se validan en el
servidor con las reglas de `firestore.rules` — no se pueden saltar desde el cliente. El login
se hace por nombre de usuario (resuelto a email mediante el mapa `usernames`).

> ⚠️ **Antes de usar en producción** hay que publicar las reglas de Firestore y crear el primer
> superadmin. Todo el procedimiento (despliegue paso a paso y migración de usuarios existentes
> sin perder datos) está en **[`docs/SEGURIDAD.md`](docs/SEGURIDAD.md)**.

---

## Plantilla de importación

Para importar ítems a un laboratorio nuevo o vacío, utiliza la plantilla CSV incluida en la carpeta de entregables o crea un archivo `.csv` con las siguientes columnas:

| Columna | Obligatoria | Descripción |
|---------|:-----------:|-------------|
| Material | ✅ | Nombre del ítem |
| Ubicación | | Nombre de la ubicación (si vacío, usa la seleccionada) |
| Código Inventario | | Código institucional de la ubicación |
| Cajón | | Sección/cajón/piso dentro de la ubicación |
| N.° | | Número de orden del ítem |
| Marca | | Marca del equipo o material |
| N.° Placa | | Número de placa institucional |
| Serial Fabricante | | Número serial del fabricante |
| Cantidad | | Cantidad (por defecto: 1) |
| Estado | | Estado del ítem (por defecto: Presente) |
| Observaciones | | Notas adicionales |

> **Nota:** El sistema detecta automáticamente si el CSV usa coma (`,`) o punto y coma (`;`) como delimitador. Se recomienda guardar desde Excel como "CSV UTF-8 (delimitado por comas)".

---

## Autor

**Kilmert Adrian Guzmán Montañez**
Estudiante de Ingeniería Electrónica — UNISANGIL, Sede Yopal
Práctica de Desempeño Profesional (Trabajo de Grado), 2026

---

## Licencia

Proyecto académico de la Universidad de San Gil (UNISANGIL). Todos los derechos reservados.
