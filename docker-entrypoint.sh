#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

if [ -z "${AUTH_SECRET:-}" ]; then
  echo "AUTH_SECRET is required" >&2
  exit 1
fi

echo "Applying database migrations..."
n=0
until node node_modules/prisma/build/index.js migrate deploy; do
  n=$((n + 1))
  if [ "$n" -ge 15 ]; then
    echo "prisma migrate deploy failed after ${n} attempts" >&2
    exit 1
  fi
  echo "Database not ready, retrying (${n}/15)..."
  sleep 2
done

if [ -f prisma/seed.cjs ]; then
  echo "Seeding database..."
  node prisma/seed.cjs
fi

echo "Starting Next.js on ${HOSTNAME:-0.0.0.0}:${PORT:-3002}..."
exec node server.js
