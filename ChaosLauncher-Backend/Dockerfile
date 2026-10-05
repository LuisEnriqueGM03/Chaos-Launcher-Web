# ----------------------------------------------
# 1. BUILD STAGE
# ----------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma/

RUN npm ci

COPY src ./src/

# Generar cliente de Prisma y compilar NestJS
RUN npx prisma generate
RUN npm run build

# ----------------------------------------------
# 2. PRODUCTION RUNTIME
# ----------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

RUN apk add --no-cache openssl dumb-init

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
# Cliente generado + CLI de Prisma (misma versión que el proyecto) para sincronizar el esquema al arrancar.
# Sin esto, `npx prisma` descargaría en cada arranque la última versión, que puede ser incompatible.
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /usr/src/app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /usr/src/app/prisma ./prisma

# Carpeta para uploads con permisos
RUN mkdir -p uploads && chown -R node:node /usr/src/app

USER node

EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
# El proyecto no usa migraciones versionadas: `db push` crea/actualiza las tablas y
# se niega a aplicar cambios que borrarían datos (no usa --accept-data-loss).
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --skip-generate && node dist/main.js"]
