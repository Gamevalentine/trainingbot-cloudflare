#!/usr/bin/env bash
set -euo pipefail
unzip -oq source.zip -d .
npx next build
rm -rf public
mv out public
test -f public/index.html
test -f public/auth/index.html
test -f public/discover/index.html
echo "Ket Noi static export ready"
