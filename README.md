# Inventario Lab Física

Sistema de inventario web para el Laboratorio de Física de **UNISANGIL**, en colaboración con **ABC Laboratorios S.A.S.**

## Descripción

Aplicación web de una sola página (SPA) para gestionar el inventario de materiales y equipos del laboratorio de física. Permite registrar, clasificar y hacer seguimiento del estado de cada elemento.

### Características

- **Dos secciones**: Materiales (escritorio, armarios) y Equipos (Kits A–F con módulos ABC)
- **Dashboard** con resumen visual de estados y ubicaciones
- **Vista por cajones/módulos** con barra de estado por colores
- **Estados de inventario**: Presente, Desgastado, Posible faltante, Dañado, Nota, Faltante, Fuera
- **Ubicaciones personalizadas**: crear, editar y eliminar ubicaciones desde la interfaz
- **Búsqueda** en tiempo real por nombre, marca, ubicación u observaciones
- **Exportación CSV** para reportes
- **Códigos de inventario** universitarios por ubicación
- **Modo oscuro** automático (según preferencia del sistema)
- **Responsive**: funciona en escritorio, tablet y celular
- **Protección por contraseña**
- **Sincronización en la nube** con Firebase Firestore (cambios visibles en todos los dispositivos en tiempo real)
- **Modo offline**: funciona sin conexión a internet, sincroniza al reconectarse

## Tecnología

- HTML, CSS y JavaScript puro (vanilla) — sin frameworks ni dependencias
- **Firebase Firestore** como base de datos en la nube (sincronización en tiempo real entre dispositivos)
- `localStorage` como caché offline (la app funciona sin conexión y sincroniza cuando vuelve)
- Fuentes: Google Fonts (DM Sans, Source Sans 3, IBM Plex Mono) con fallback del sistema

## Uso

### Opción 1: GitHub Pages (recomendado)
El sitio se publica automáticamente en: `https://<tu-usuario>.github.io/inventario-lab-fisica/`

### Opción 2: Local
Simplemente abre `index.html` en cualquier navegador moderno. No requiere servidor.

### Opción 3: Servidor web
Copia `index.html` a cualquier servidor web estático (Apache, Nginx, etc.).

## Contraseña
La contraseña por defecto es: `labfisica2024`

## Autor

**Eric Santiago Hernández Rojas**  
Instructor — UNISANGIL  
Trabajo de Grado

## Licencia

Proyecto académico — UNISANGIL.
