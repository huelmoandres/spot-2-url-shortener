#!/bin/sh
set -e

export PORT="${PORT:-8080}"

# Replace the full nginx.conf to avoid Alpine's conf.d include being outside http {}
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

php artisan config:cache
php artisan route:cache
php artisan view:cache

php artisan migrate --force

php artisan l5-swagger:generate || echo "Swagger generation skipped"

exec "$@"
