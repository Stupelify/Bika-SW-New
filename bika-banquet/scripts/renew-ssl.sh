#!/bin/bash
# Renew Let's Encrypt cert for banquet.bikafood.com and reload nginx-proxy.
# Run on VPS: ./scripts/renew-ssl.sh
set -euo pipefail

cd "$(dirname "$0")/.."

DOMAIN="${SSL_DOMAIN:-banquet.bikafood.com}"
CERT_DIR="docker/certbot/conf/live/${DOMAIN}/fullchain.pem"

echo "=== SSL renewal for ${DOMAIN} ==="

if [ -f "$CERT_DIR" ]; then
  echo "Current certificate:"
  openssl x509 -in "$CERT_DIR" -noout -dates
else
  echo "WARNING: cert not found at $CERT_DIR (nginx-proxy may use another mount)"
fi

echo ""
echo "Running certbot renew..."
# Override certbot service entrypoint for a one-shot renew.
docker compose run --rm --entrypoint certbot certbot renew \
  --webroot -w /var/www/certbot \
  --cert-name "$DOMAIN" \
  --no-random-sleep-on-renew

echo ""
echo "Reloading reverse proxy..."
if docker ps --format '{{.Names}}' | grep -qx 'nginx-proxy'; then
  docker exec nginx-proxy nginx -s reload 2>/dev/null || docker restart nginx-proxy
  echo "nginx-proxy reloaded"
elif docker compose ps -q nginx >/dev/null 2>&1; then
  docker compose exec -T nginx nginx -s reload 2>/dev/null || docker compose restart nginx
  echo "compose nginx reloaded"
else
  echo "WARNING: no nginx-proxy or compose nginx found — reload manually"
fi

echo ""
echo "New certificate:"
if [ -f "$CERT_DIR" ]; then
  openssl x509 -in "$CERT_DIR" -noout -dates
fi

echo ""
echo "=== SSL renewal complete ==="
