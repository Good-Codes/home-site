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

node node_modules/prisma/build/index.js migrate deploy
exec node server.js
