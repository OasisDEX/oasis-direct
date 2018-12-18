#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
cd ../../

./node_modules/.bin/http-server -p 3000 ./build &
server_pid=$!

yarn cypress:run:ci
# disable metamask tests since they are not stable
# yarn metamask-e2e:run

kill -9 $server_pid
