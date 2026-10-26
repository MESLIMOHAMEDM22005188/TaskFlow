#!/usr/bin/env bash
set -euo pipefail

# Repairs an incomplete local lodash installation without reinstalling every
# backend dependency. Run from any directory inside the repository.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND_DIR"

if [ ! -d node_modules/lodash ]; then
  echo "ERROR: node_modules/lodash does not exist. Run npm ci when the host allows it."
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Downloading/extracting lodash@4.17.21 (offline cache first)..."
if ! npm pack lodash@4.17.21 --offline --ignore-scripts --pack-destination "$TMP_DIR" >/dev/null 2>&1; then
  echo "Offline cache miss; trying registry..."
  npm pack lodash@4.17.21 --ignore-scripts --pack-destination "$TMP_DIR"
fi

ARCHIVE="$TMP_DIR/lodash-4.17.21.tgz"
test -s "$ARCHIVE" || { echo "ERROR: lodash archive was not created."; exit 1; }

mkdir "$TMP_DIR/unpacked"
tar -xzf "$ARCHIVE" -C "$TMP_DIR/unpacked"
test -s "$TMP_DIR/unpacked/package/lodash.js" || {
  echo "ERROR: archive does not contain lodash.js."
  exit 1
}

# Replace only lodash's package files; leave the rest of node_modules untouched.
cp -a "$TMP_DIR/unpacked/package/." node_modules/lodash/
node -e "const lodash = require('lodash'); console.log('Lodash repaired:', lodash.VERSION)"
echo "Now run: npm start"
