# 🧪 Inventario Lab Física — UNISANGIL

Sistema web de gestión de inventario para laboratorios de la Universidad de San Gil (UNISANGIL), Sede Yopal. Aplicación de página única (SPA) construida con ~5.600 líneas de HTML/CSS/JavaScript vanilla y Firebase Firestore como backend en la nube.

> Desarrollado como parte de la Práctica de Desempeño Profesional (Trabajo de Grado) en colaboración con ABC Laboratorios S.A.S.

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
- Protección por contraseña
- Sincronización en la nube con Firebase Firestore
- Modo offline con localStorage que sincroniza al reconectar
- Material Design 3 con Google Material Symbols

---

## Tecnologías

| Tecnología | Uso |
|------------|-----|
| HTML/CSS/JavaScript | Frontend completo en un solo archivo |
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
├── index.html    # Aplicación completa (SPA de archivo único)
└── README.md     # Este archivo
```

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
