# ----------------------------------------------
# 1. DEPENDENCIAS
# ----------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ----------------------------------------------
# 2. BUILD
# ----------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Valores que Next incrusta al compilar (cambiar alguno exige reconstruir la imagen).
# Por defecto el navegador llama a /api/v1 del propio front y Next lo reenvía al backend interno.
ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_APP_NAME="ChaosLauncher Web Studio"
ARG NEXT_PUBLIC_DEFAULT_SERVER_IP=
ARG NEXT_PUBLIC_LAUNCHER_REPO=LuisEnriqueGM03/Chaos-Launcher-Esc
ARG NEXT_PUBLIC_WINGET_PACKAGE_ID=ChaosStudio.ChaosLauncher
ARG NEXT_PUBLIC_WINGET_LIVE=false
ARG BACKEND_INTERNAL_URL=http://backend:3000

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_DEFAULT_SERVER_IP=$NEXT_PUBLIC_DEFAULT_SERVER_IP \
    NEXT_PUBLIC_LAUNCHER_REPO=$NEXT_PUBLIC_LAUNCHER_REPO \
    NEXT_PUBLIC_WINGET_PACKAGE_ID=$NEXT_PUBLIC_WINGET_PACKAGE_ID \
    NEXT_PUBLIC_WINGET_LIVE=$NEXT_PUBLIC_WINGET_LIVE \
    BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ----------------------------------------------
# 3. RUNTIME
# ----------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0

RUN apk add --no-cache dumb-init

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3001

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
