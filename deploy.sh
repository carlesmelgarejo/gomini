#!/usr/bin/env bash
# Build i (re)arrencada de GoMini al servidor (CloudPanel + PM2).
# El crida el workflow de GitHub Actions després d'actualitzar el codi.
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

echo "==> Instal·lant dependències"
npm install --no-audit --no-fund

echo "==> Compilant (build standalone)"
npm run build

echo "==> Copiant estàtics i configuració dins de .next/standalone"
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true
# .env.local conté les variables (PORT, KATAGO_*, etc.). No és al repo.
cp .env.local .next/standalone/.env.local 2>/dev/null || true

# El server.js standalone llegeix PORT de l'entorn del procés, no del fitxer:
# exportem el PORT del .env.local perquè PM2 (i l'ecosystem) el facin servir.
if [ -f .env.local ]; then
  PORT_LINE="$(grep -E '^PORT=' .env.local | tail -n1 || true)"
  [ -n "$PORT_LINE" ] && export "$PORT_LINE"
fi

echo "==> (Re)arrencant amb PM2 (PORT=${PORT:-3000})"
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

echo "==> Neteja"
rm -rf .next/cache

echo "==> Desplegament complet."
