#!/bin/bash
# One-time setup: install a GitHub Actions self-hosted runner on this VPS.
# Run as root from the app directory after SSH-ing in manually.
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
RUNNER_DIR="${RUNNER_DIR:-/opt/github-actions-runner}"

if [ -z "${RUNNER_TOKEN:-}" ]; then
  echo "ERROR: Set RUNNER_TOKEN from GitHub → Settings → Actions → Runners → New runner"
  exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: Run as root"
  exit 1
fi

echo "==> Checking prerequisites"
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker not found — install Docker before setting up the runner"
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose not available"
  exit 1
fi
if ! docker ps >/dev/null 2>&1; then
  echo "ERROR: docker ps failed — ensure Docker daemon is running"
  exit 1
fi

# Runner service dependencies (skip apt if curl+tar already present — avoids noisy
# duplicate-mirror warnings on some VPS images).
if command -v apt-get >/dev/null 2>&1 \
    && { ! command -v curl >/dev/null 2>&1 || ! command -v tar >/dev/null 2>&1; }; then
  echo "==> Installing curl/tar (apt warnings about duplicate mirrors are harmless)"
  apt-get install -y -qq curl tar ca-certificates 2>/dev/null \
    || apt-get install -y curl tar ca-certificates
fi

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [ ! -f ./config.sh ]; then
  echo "==> Downloading GitHub Actions runner"
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64) RUNNER_ARCH="x64" ;;
    aarch64|arm64) RUNNER_ARCH="arm64" ;;
    *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
  esac
  curl -fsSL -o actions-runner-linux-${RUNNER_ARCH}-2.319.1.tar.gz \
    https://github.com/actions/runner/releases/download/v2.319.1/actions-runner-linux-${RUNNER_ARCH}-2.319.1.tar.gz
  tar xzf actions-runner-linux-${RUNNER_ARCH}-2.319.1.tar.gz
fi

echo "==> Configuring runner ($RUNNER_NAME) labels: $RUNNER_LABELS"
./config.sh \
  --url "$REPO_URL" \
  --token "$RUNNER_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "$RUNNER_LABELS" \
  --unattended \
  --replace

./svc.sh install
./svc.sh start
sleep 2
./svc.sh status

echo ""
echo "==> Runner setup complete"
echo "    Verify: GitHub → https://github.com/Stupelify/Bika-SW-New/settings/actions/runners"
echo "    Status should show: bika-banquet-vps  Idle  labels: self-hosted, Linux, bika-banquet"
echo ""
echo "Queued deploy jobs will start automatically within ~30s."
echo "Watch: GitHub → Actions → Deploy to VPS"
echo ""
echo "Manual deploy (optional):"
echo "  cd /root/bika-banquet-v2/bika-banquet && git pull && ./scripts/ci-deploy.sh"
