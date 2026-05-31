#!/bin/bash
# Renew Let's Encrypt cert for banquet.bikafood.com and reload nginx-proxy.
# Run on VPS: ./scripts/renew-ssl.sh
set -euo pipefail

cd "$(dirname "$0")/.."

DOMAIN="${SSL_DOMAIN:-banquet.bikafood.com}"
CERT_STORE="$(pwd)/docker/certbot/conf"
CERT_FILE="${CERT_STORE}/live/${DOMAIN}/fullchain.pem"

echo "=== SSL renewal for ${DOMAIN} ==="

if [ -f "$CERT_FILE" ]; then
  echo "Cert store (${CERT_FILE}):"
  openssl x509 -in "$CERT_FILE" -noout -dates
else
  echo "WARNING: cert not found at $CERT_FILE"
fi

echo ""
echo "Running certbot renew..."
docker compose run --rm --entrypoint certbot certbot renew \
  --webroot -w /var/www/certbot \
  --cert-name "$DOMAIN" \
  --no-random-sleep-on-renew || true

# Force-renew if cert expires within 30 days (handles expired certs certbot skips)
if [ -f "$CERT_FILE" ]; then
  if ! openssl x509 -checkend $((30 * 86400)) -noout -in "$CERT_FILE" 2>/dev/null; then
    echo "Certificate expires within 30 days — forcing renewal..."
    docker compose run --rm --entrypoint certbot certbot certonly \
      --webroot -w /var/www/certbot \
      --cert-name "$DOMAIN" \
      --force-renewal \
      -d "$DOMAIN" \
      --non-interactive \
      --agree-tos \
      --keep-until-expiring
  fi
fi

echo ""
echo "Syncing cert store to nginx-proxy mount (if separate)..."
if docker ps --format '{{.Names}}' | grep -qx 'nginx-proxy'; then
  PROXY_MOUNT=$(docker inspect nginx-proxy --format '{{range .Mounts}}{{if eq .Destination "/etc/letsencrypt"}}{{.Source}}{{end}}{{end}}')
  if [ -n "$PROXY_MOUNT" ] && [ "$PROXY_MOUNT" != "$CERT_STORE" ]; then
    echo "  nginx-proxy mount: $PROXY_MOUNT"
    echo "  cert store:        $CERT_STORE"
    mkdir -p "$PROXY_MOUNT"
    rsync -a --delete "${CERT_STORE}/" "${PROXY_MOUNT}/"
    echo "  synced"
  else
    echo "  nginx-proxy uses same cert store or no /etc/letsencrypt mount"
  fi

  echo ""
  echo "Cert served inside nginx-proxy:"
  docker exec nginx-proxy openssl x509 \
    -in "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" \
    -noout -dates 2>/dev/null || echo "  (could not read in-container cert)"

  echo ""
  echo "Restarting nginx-proxy..."
  docker restart nginx-proxy
  sleep 2
  echo "nginx-proxy restarted"
elif docker compose ps -q nginx >/dev/null 2>&1; then
  docker compose exec -T nginx nginx -s reload 2>/dev/null || docker compose restart nginx
  echo "compose nginx reloaded"
else
  echo "WARNING: no nginx-proxy or compose nginx found — reload manually"
fi

echo ""
if [ -f "$CERT_FILE" ]; then
  echo "Final cert store dates:"
  openssl x509 -in "$CERT_FILE" -noout -dates
fi

echo ""
echo "=== SSL renewal complete ==="
