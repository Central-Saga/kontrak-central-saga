#!/usr/bin/env sh
set -eu

cd /var/www/html

mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

if [ ! -d public/storage ]; then
    rm -f public/storage
    ln -s /var/www/html/storage/app/public public/storage 2>/dev/null || true
fi

chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R ug+rwX storage bootstrap/cache 2>/dev/null || true

php artisan config:clear >/dev/null 2>&1 || true

if command -v su >/dev/null 2>&1; then
    su -s /bin/sh -c 'touch storage/app/public/.disk-check && rm -f storage/app/public/.disk-check' www-data \
        || echo "Warning: Laravel public disk is not writable by www-data." >&2
fi

exec "$@"
