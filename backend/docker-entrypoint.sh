#!/bin/sh
set -e

echo "⏳ Esperando a que la base de datos PostgreSQL esté lista..."
until npx prisma db push --skip-generate; do
  echo "PostgreSQL no está disponible aún - reintentando en 2 segundos..."
  sleep 2
done

echo "🌱 Verificando inicialización de datos por defecto (seeding)..."
npx ts-node src/prisma/seed.ts || true

echo "🚀 Arrancando servidor Backend..."
exec node dist/index.js
