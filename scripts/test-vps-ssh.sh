#!/usr/bin/env bash
# Test SSH connectivity to a VPS without disabling host-key verification.
set -Eeuo pipefail

usage() {
  cat <<'USAGE'
Usage: test-vps-ssh.sh <vps_host> [vps_user] [vps_port] [ssh_key_path]

Defaults:
  vps_user     ubuntu
  vps_port     22
  ssh_key_path ~/.ssh/id_rsa

Environment:
  SSH_CONNECT_TIMEOUT  Connection timeout in seconds (default: 10)
USAGE
}

VPS_HOST="${1:-}"
VPS_USER="${2:-ubuntu}"
VPS_PORT="${3:-22}"
SSH_KEY_PATH="${4:-$HOME/.ssh/id_rsa}"
SSH_CONNECT_TIMEOUT="${SSH_CONNECT_TIMEOUT:-10}"

if [[ -z "$VPS_HOST" ]]; then
  usage >&2
  exit 2
fi
if [[ "$VPS_HOST" == -* || "$VPS_USER" == -* || "$VPS_HOST" =~ [[:space:]] || "$VPS_USER" =~ [[:space:]] ]]; then
  echo "ERROR: VPS host and user must be non-empty SSH destination values without whitespace or leading hyphens." >&2
  exit 2
fi

if [[ ! "$VPS_PORT" =~ ^[0-9]{1,5}$ ]] || (( VPS_PORT < 1 || VPS_PORT > 65535 )); then
  echo "ERROR: VPS port must be an integer between 1 and 65535." >&2
  exit 2
fi
if [[ ! "$SSH_CONNECT_TIMEOUT" =~ ^[0-9]+$ ]] || (( SSH_CONNECT_TIMEOUT < 1 )); then
  echo "ERROR: SSH_CONNECT_TIMEOUT must be a positive integer." >&2
  exit 2
fi

# Expand only a leading ~/; avoid eval on user-controlled input.
case "$SSH_KEY_PATH" in
  "~") SSH_KEY_PATH="$HOME" ;;
  "~/"*) SSH_KEY_PATH="$HOME/${SSH_KEY_PATH#~/}" ;;
esac

if [[ ! -f "$SSH_KEY_PATH" ]]; then
  echo "ERROR: SSH private key not found: $SSH_KEY_PATH" >&2
  exit 1
fi
if ! command -v ssh >/dev/null 2>&1; then
  echo "ERROR: ssh is not installed or not on PATH." >&2
  exit 1
fi

# OpenSSH rejects overly permissive private-key files.
chmod 600 "$SSH_KEY_PATH"

echo "Testing SSH connection to $VPS_USER@$VPS_HOST:$VPS_PORT ..."
ssh \
  -i "$SSH_KEY_PATH" \
  -p "$VPS_PORT" \
  -o BatchMode=yes \
  -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=accept-new \
  -o ConnectTimeout="$SSH_CONNECT_TIMEOUT" \
  "$VPS_USER@$VPS_HOST" \
  'printf "Connected host: "; hostname; printf "Uptime: "; uptime'

echo "SUCCESS: SSH connectivity verified."
