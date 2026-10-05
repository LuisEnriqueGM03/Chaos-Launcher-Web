# 🚀 ChaosLauncher - Backend (NestJS + PostgreSQL + Docker)

Backend modular desarrollado en **NestJS** para el ecosistema **ChaosLauncher**, diseñado para centralizar la gestión de modpacks, versiones, sincronización diferencial de archivos, estado en vivo de servidores Minecraft y distribución de contenido.

---

## 📦 Características Principales

- **Arquitectura Modular Limpia**: Módulos desacoplados para `Modpacks`, `Manifests`, `ServerStatus`, `GitHub`, `Uploads`, `Database` y `Health`.
- **Base de Datos Relacional**: **PostgreSQL 16** gestionado mediante **Prisma ORM**.
- **Contenerización Completa**: `Dockerfile` multi-etapa optimizado en Alpine y `docker-compose.yml` para levantar PostgreSQL y el Backend con un solo comando.
- **Configuración Centralizada (.env)**: Validación estricta en tiempo de arranque mediante `@nestjs/config` y `class-validator`.
- **Compatibilidad 100% con `ChaosLauncher-esc`**:
  - Endpoint `GET /api/v1/modpacks/:tag/manifest` compatible directamente con `differentialSync.ts` y `updateChecker.ts`.
  - Soporte para mods opcionales (shaders Iris, luces dinámicas).
- **Monitoreo de Servidores Minecraft**: Endpoint con caché en memoria configurable para consultar jugadores en línea, estado y MOTD sin saturar la red ni sufrir rate limits.
- **Sincronización con GitHub**: Conexión con repositorios de GitHub para leer `modpack.json`, releases y actualizaciones automáticas.
- **Documentación Interactiva Swagger**: Disponible en `/docs`.
- **skills.sh**: Integrado en `.agents/skills` para optimización de desarrollo asistido.

---

## 🛠️ Requisitos Previos

- **Node.js** >= 20.x
- **Docker** y **Docker Compose** (recomendado para ejecución completa con PostgreSQL)

---

## ⚡ Inicio Rápido con Docker

La forma más rápida y recomendada de levantar el backend junto con PostgreSQL:

```bash
# 1. Posicionarse en la carpeta del backend
cd ChaosLauncher-Backend

# 2. Levantar los contenedores en segundo plano
docker compose up -d --build

# 3. Ver los logs en tiempo real
docker compose logs -f backend
```

Esto levantará:
- **PostgreSQL 16**: `localhost:5432` con volumen persistente `postgres_data`.
- **ChaosLauncher API**: `http://localhost:3000/api/v1`
- **Swagger Docs**: `http://localhost:3000/docs`

Para detener los servicios:
```bash
docker compose down
```

---

## 💻 Ejecución en Desarrollo Local (Sin Docker)

Si cuentas con una instancia local de PostgreSQL:

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita DATABASE_URL en .env con tus credenciales de PostgreSQL

# 3. Generar cliente de Prisma y aplicar migraciones
npx prisma generate
npx prisma migrate dev --name init

# 4. Poblar datos iniciales de prueba (Mimic MC y Chaos Pack)
npm run prisma:seed

# 5. Iniciar en modo desarrollo con hot-reload
npm run start:dev
```

---

## ⚙️ Variables de Entorno (`.env`)

| Variable | Descripción | Valor por defecto |
| :--- | :--- | :--- |
| `NODE_ENV` | Entorno de ejecución (`development` / `production`) | `development` |
| `PORT` | Puerto HTTP del servidor | `3000` |
| `API_PREFIX` | Prefijo global de rutas | `api/v1` |
| `DATABASE_URL` | URL de conexión PostgreSQL para Prisma | `postgresql://...` |
| `CORS_ORIGIN` | Dominios permitidos para CORS (`*` para Electron) | `*` |
| `STATUS_CACHE_TTL_SECONDS` | Segundos de caché para el ping a servidores Minecraft | `30` |
| `GITHUB_TOKEN` | Token personal de GitHub (opcional, para mayor rate limit) | `""` |
| `UPLOAD_DIR` | Directorio en disco para almacenar imágenes | `./uploads` |
| `STATIC_SERVE_PATH` | Prefijo URL para servir imágenes estáticas | `/static` |

---

## 📑 Principales Endpoints de la API

### 🎮 Modpacks
- `GET /api/v1/modpacks`: Lista todos los modpacks para poblar el Sidebar del launcher.
- `GET /api/v1/modpacks/:tag`: Detalle completo del modpack por su slug/tag.
- `POST /api/v1/modpacks`: Crear un nuevo modpack.
- `PATCH /api/v1/modpacks/:tag`: Actualizar colores, RAM, IP o versión.
- `DELETE /api/v1/modpacks/:tag`: Eliminar un modpack.

### 🔄 Manifiestos y Sincronización Diferencial
- `GET /api/v1/modpacks/:tag/manifest`: Devuelve el `ModpackManifest` exacto que consume el cliente de escritorio `ChaosLauncher-esc`.
- `POST /api/v1/modpacks/:tag/versions`: Publica una nueva versión con su lista diferencial de archivos SHA-1.

### 🌐 Estado del Servidor
- `GET /api/v1/modpacks/:tag/server-status`: Consulta el estado en vivo (en línea / desconectado, jugadores, MOTD) con caché.
- `GET /api/v1/modpacks/ping/direct?ip=...&port=25565`: Ping directo a cualquier servidor de Minecraft.

### 🐙 Integración con GitHub
- `POST /api/v1/modpacks/:tag/sync-github`: Lee el archivo `modpack.json` del repositorio conectado y actualiza automáticamente el modpack.
- `GET /api/v1/modpacks/:tag/github-releases`: Consulta los releases del repositorio en GitHub.

### 🖼️ Archivos e Imágenes
- `POST /api/v1/uploads/image?category=icons`: Sube iconos o wallpapers y retorna su URL estática accesible en `/static/...`.

### 🩺 Diagnóstico
- `GET /api/v1/health`: Estado de salud de la API y de la conexión a la base de datos PostgreSQL.
- `GET /docs`: Documentación Swagger OpenAPI interactiva.
