#!/bin/sh
# Compila todos os pacotes TypeScript para JavaScript usando esbuild

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ESBUILD="$ROOT/node_modules/esbuild/bin/esbuild"
DIST="$ROOT/dist"

build() {
  name="$1"
  entry="$2"
  echo "→ Compilando $name..."
  "$ESBUILD" "$entry" \
    --bundle \
    --platform=node \
    --target=node22 \
    --outfile="$DIST/$name.js" \
    --external:better-sqlite3 \
    --log-level=warning
}

mkdir -p "$DIST"

build "coordinator" "$ROOT/packages/coordinator/src/index.ts"
build "worker"      "$ROOT/packages/worker/src/index.ts"
build "client"      "$ROOT/packages/client/src/index.ts"

echo ""
echo "Build concluído em $DIST/"
