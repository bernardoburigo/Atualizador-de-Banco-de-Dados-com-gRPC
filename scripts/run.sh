#!/bin/sh
# Wrapper para executar um arquivo JavaScript compilado com o node correto

NODE="/lib64/ld-linux-x86-64.so.2 /home/bernardoburigo/.nvm/versions/node/v22.16.0/bin/node"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "$1" ]; then
  echo "Uso: ./scripts/run.sh <coordinator|worker|client> [args...]"
  exit 1
fi

TARGET="$1"
shift

exec $NODE "$ROOT/dist/$TARGET.js" "$@"
