# ⚔️ ChaosLauncher - Frontend Web (Next.js + Minecraft Design System)

Plataforma web y estudio de creación de modpacks para el ecosistema **ChaosLauncher**, desarrollada con **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS** y un sistema de diseño **100% temático de Minecraft**.

---

## 🏛️ Arquitectura: Clean Architecture + Feature-Driven

El proyecto sigue una arquitectura limpia estructurada por features funcionales y capas de abstracción:

```text
src/
├── core/                       <-- Core: Capa transversal independiente
│   ├── config/env.ts           <-- Validación estricta de variables de entorno (.env)
│   ├── http/api-client.ts      <-- Cliente Axios con interceptor JWT
│   └── types/                  <-- Modelos de dominio y contratos de API
├── features/                   <-- Feature-Driven Modules
│   ├── auth/                   <-- Autenticación (Login, Registro con SkinPicker)
│   ├── modpacks/               <-- Catálogo, Formulario de Forja y Edición
│   ├── server-status/          <-- Monitoreo de servidores Minecraft en vivo
│   └── users/                  <-- Panel de Superadmin para gestión de creadores
├── shared/                     <-- Primitivas de UI estilo Minecraft
│   ├── components/             <-- MinecraftButton, MinecraftCard, MinecraftPanel, MinecraftSlot, MinecraftInput, Navbar
│   └── utils/cn.ts
└── app/                        <-- Next.js App Router (Páginas y layouts)
    ├── globals.css             <-- Sistema de diseño Minecraft completo
    ├── layout.tsx              <-- AuthProvider y Navbar global
    ├── page.tsx                <-- Catálogo y Hero estilo Nether
    ├── login/page.tsx          <-- Portal de inicio de sesión
    ├── register/page.tsx       <-- Registro de nuevos creadores
    ├── dashboard/page.tsx      <-- Studio de modpacks
    ├── dashboard/modpacks/new/ <-- Forjar nuevo modpack
    ├── dashboard/modpacks/[tag]/edit/ <-- Editar modpack
    └── admin/users/page.tsx    <-- Panel de Superadmin
```

---

## 🎨 Sistema de Diseño Estilo Minecraft

Portado directamente desde `ChaosLauncher-esc`:
- **Botones con relieve 3D**:
  - `minecraft-btn-green`: Botón verde oficial (Jugar / Confirmar)
  - `minecraft-btn-lava`: Botón carmesí/lava (Tema oficial de Chaos)
  - `minecraft-btn-amber`: Botón ámbar/oro (Mimic MC / Opciones)
  - `minecraft-btn-gray`: Botón gris neutro
- **Ranuras de inventario**: `minecraft-slot` con profundidad pixelada para avatares y logos.
- **Paneles y Tarjetas**: `minecraft-panel` y `minecraft-card`.
- **Campos de texto**: `minecraft-input` con foco lava y sombras pixeladas.
- **Sombras de texto oficiales**: `minecraft-text-shadow`, `minecraft-text-shadow-lava`, `minecraft-text-shadow-amber`.

---

## ⚙️ Variables de Entorno (`.env.local`)

El frontend utiliza estrictamente variables de entorno:

```env
# URL base de la API de ChaosLauncher-Backend
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Título de la aplicación
NEXT_PUBLIC_APP_NAME="ChaosLauncher Web Studio"

# IP del servidor por defecto
NEXT_PUBLIC_DEFAULT_SERVER_IP=mimicsv.glemtrod.com
```

---

## 🚀 Inicio Rápido en Desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo en el puerto 3001
npm run dev
```

La aplicación estará disponible en: **`http://localhost:3001`**

---

## 👑 Acceso como Superadmin

Para ingresar con privilegios de **Superadmin**:
- **Usuario**: `admin` (o el configurado en el `.env` del backend)
- **Contraseña**: (la definida en `SUPERADMIN_PASSWORD` del backend)
- Al iniciar sesión tendrás acceso a la pestaña **ADMINISTRACIÓN** (`/admin/users`) para forjar nuevas cuentas de creadores o administrar usuarios.
