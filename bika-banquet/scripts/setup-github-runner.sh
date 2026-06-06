#!/bin/bash
# One-time setup: install a GitHub Actions self-hosted runner on this VPS.
# Invoke as root; the runner itself runs as a dedicated non-root user.
#
# Why: GitHub-hosted runners cannot reach this VPS on SSH port 22 (connection
# timeout). A self-hosted runner executes deploy steps locally — no inbound SSH
# from GitHub required.
#
# Prerequisites:
#   1. Create a runner registration token:
#      GitHub → Settings → Actions → Runners → New self-hosted runner → Linux
#   2. Export RUNNER_TOKEN before running this script.
#
# Usage:
#   export RUNNER_TOKEN='AAAA...'
#   ./scripts/setup-github-runner.sh

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Stupelify/Bika-SW-New}"
RUNNER_NAME="${RUNNER_NAME:-bika-banquet-vps}"
RUNNER_LABELS="${RUNNER_LABELS:-self-hosted,linux,bika-banquet}"
RUNNER_USER="${RUNNER_USER:-github-runner}"
RUNNER_DIR="${RUNNER_DIR:-/opt/github-actions-runner}"
APP_DIR="${APP_DIR:-/root/bika-banquet-v2/bika-banquet}"

if [ -z "${RUNNER_TOKEN:-}" ]; then
  echo "ERROR: Set RUNNER_TOKEN from GitHub → Settings → Actions → Runners → New runner"
  exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: Run this script as root (it creates a non-root runner user)"
  exit 1
fi

echo "==> Checking prerequisites"
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker not found"
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose not available"
  exit 1
fi
if ! command -v curl >/dev/null 2>&1 || ! command -v tar >/dev/null 2>&1; then
  echo "ERROR: curl and tar are required"
  exit 1
fi
if [ ! -d "$APP_DIR" ]; then
  echo "ERROR: App directory not found: $APP_DIR"
  exit 1
fi

echo "==> Creating runner user ($RUNNER_USER)"
if ! id "$RUNNER_USER" >/dev/null 2>&1; then
  useradd --system --home-dir "$RUNNER_DIR" --shell /bin/bash "$RUNNER_USER"
fi
usermod -aG docker "$RUNNER_USER"

echo "==> Granting runner access to app directory"
# Runner must read/write the git repo and run docker compose from APP_DIR.
chmod 711 /root 2>/dev/null || true
chmod 711 "$(dirname "$APP_DIR")" 2>/dev/null || true
chown -R root:"$RUNNER_USER" "$APP_DIR"
chmod -R g+rwX "$APP_DIR"
find "$APP_DIR/.git" -type d -exec chmod g+s {} + 2>/dev/null || true

mkdir -p "$RUNNER_DIR"
chown -R "$RUNNER_USER:$RUNNER_USER" "$RUNNER_DIR"

echo "==> Downloading GitHub Actions runner (as $RUNNER_USER)"
ARCH=$(uname -m)
case "$ARCH" in
  x86_64) RUNNER_ARCH="x64" ;;
  aarch64|arm64) RUNNER_ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac
RUNNER_TAR="actions-runner-linux-${RUNNER_ARCH}-2.319.1.tar.gz"
RUNNER_URL="https://github.com/actions/runner/releases/download/v2.319.1/${RUNNER_TAR}"

if [ ! -f "$RUNNER_DIR/config.sh" ]; then
  sudo -u "$RUNNER_USER" curl -fsSL -o "$RUNNER_DIR/$RUNNER_TAR" "$RUNNER_URL"
  sudo -u "$RUNNER_USER" tar -xzf "$RUNNER_DIR/$RUNNER_TAR" -C "$RUNNER_DIR"
fi

echo "==> Configuring runner ($RUNNER_NAME) labels: $RUNNER_LABELS"
sudo -u "$RUNNER_USER" bash -c "cd '$RUNNER_DIR' && ./config.sh \
  --url '$REPO_URL' \
  --token '$RUNNER_TOKEN' \
  --name '$RUNNER_NAME' \
  --labels '$RUNNER_LABELS' \
  --unattended \
  --replace"

echo "==> Installing runner service (svc.sh must run as root)"
cd "$RUNNER_DIR"
./svc.sh install
./svc.sh start
sleep 2
./svc.sh status

if sudo -u "$RUNNER_USER" docker ps >/dev/null 2>&1; then
  echo "==> Docker access OK for $RUNNER_USER"
else
  echo "WARNING: $RUNNER_USER cannot run docker yet — log out/in or reboot may be required for group membership"
fi

echo ""
echo "==> Runner setup complete"
echo "    Verify: GitHub → https://github.com/Stupelify/Bika-SW-New/settings/actions/runners"
echo "    Status should show: $RUNNER_NAME  Idle  labels: self-hosted, Linux, bika-banquet"
echo ""
echo "Queued deploy jobs will start automatically within ~30s."
echo "Watch: GitHub → Actions → Deploy to VPS"
