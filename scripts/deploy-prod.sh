#!/usr/bin/env bash
set -ex
cd "$(dirname "$0")"
cd ..

yarn build
echo "oasis.direct" > ./build/CNAME

gh-pages -d ./build