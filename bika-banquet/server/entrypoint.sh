#!/bin/sh
set -e

echo "Starting server..."
exec node_modules/.bin/pm2-runtime dist/server.js -i max
