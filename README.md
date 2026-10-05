# Chaos Launcher — Web (Backend + Frontend)

Monorepo del backend (NestJS + Prisma + PostgreSQL) y del Studio web (Next.js) de Chaos Launcher.
El launcher de escritorio vive en otro repositorio: `Chaos-Launcher-Esc`.

```
ChaosLauncher-Backend/   API NestJS
ChaosLauncher-Front/     Studio y catálogo web (Next.js)
docker-compose.yml       postgres + backend + front + watchtower
.env.example             variables del compose
.github/workflows/       publica las imágenes en GHCR
```

## Arrancar con Docker

```bash
cp .env.example .env     # rellena POSTGRES_PASSWORD, SUPERADMIN_PASSWORD y JWT_SECRET
docker compose up -d
```

- Front: http://localhost:3001 · API: http://localhost:3000/api/v1 · Swagger: http://localhost:3000/docs
- Sin imágenes publicadas todavía (o para probar cambios locales): `docker compose up -d --build`
- Logs: `docker compose logs -f backend`

## Auto-actualización

1. Haces `git push` a `main` con cambios en el backend o en el front.
2. GitHub Actions (`docker-publish.yml`) construye la imagen y la publica en `ghcr.io/<owner>/chaos-launcher-{backend,front}:latest`.
3. **Watchtower** (servicio del compose) revisa GHCR cada `WATCHTOWER_POLL_INTERVAL` segundos, descarga la imagen nueva y reinicia solo ese servicio. PostgreSQL no se toca.

Si las imágenes son **privadas** (por defecto lo son si el repositorio es privado), define `GHCR_USER` y
`GHCR_TOKEN` (token *classic* con permiso `read:packages`) en `.env` para que Watchtower pueda descargarlas
— y para el primer `docker compose up` en un servidor, ejecuta antes `docker login ghcr.io`.

## Base de datos

El backend ejecuta `prisma db push` al arrancar: crea las tablas y aplica cambios de esquema que no borren datos.
Si un cambio los borraría, el contenedor se detiene con un error en lugar de perderlos.

## Notas de despliegue

- `BACKEND_PUBLIC_URL` debe ser la dirección pública del backend: se guarda en las imágenes subidas y la usa el launcher.
- Con HTTPS pon `COOKIE_SECURE=true`; con HTTP simple, `false`.
- Los datos viven en los volúmenes `postgres_data` y `uploads_data`.
