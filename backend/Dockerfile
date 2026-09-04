FROM node:20-alpine

WORKDIR /app

# Instalar OpenSSL para Prisma Client en Alpine
RUN apk add --no-cache openssl

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalación de dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Generar cliente de Prisma y compilar TypeScript
RUN npx prisma generate
RUN npm run build

# Otorgar permisos de ejecución al entrypoint
RUN chmod +x ./docker-entrypoint.sh

# Exponer puerto del Backend API
EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
