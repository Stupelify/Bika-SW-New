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

if [ -f ./.runner ]; then
  echo "Runner already configured in $RUNNER_DIR — restarting service"
else
  echo "==> Configuring runner ($RUNNER_NAME)"
  ./config.sh \
    --url "$REPO_URL" \
    --token "$RUNNER_TOKEN" \
    --name "$RUNNER_NAME" \
    --labels "$RUNNER_LABELS" \
    --unattended \
    --replace
fi

./svc.sh install
./svc.sh start
./svc.sh status

echo ""
echo "Runner installed. Verify in GitHub → Settings → Actions → Runners."
echo "Future pushes to master will deploy via the self-hosted runner."
echo ""
echo "Deploy manually right now (without waiting for CI):"
echo "  cd /root/bika-banquet-v2/bika-banquet && git pull && ./scripts/ci-deploy.sh"
