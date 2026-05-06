#!/usr/bin/env sh
set -eu

action="${1:-up}"
project_root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
wsl_ip="$(hostname -I | awk '{print $1}')"

if [ -z "$wsl_ip" ]; then
  echo "Could not detect the WSL IP address." >&2
  exit 1
fi

export CONTAINERS_CONF="$project_root/docker/podman/containers.conf"
export FRONTEND_APP_DOMAIN="app.${wsl_ip}.nip.io"
export BACKEND_APP_DOMAIN="api.${wsl_ip}.nip.io"
export FRONTEND_APP_URL="http://${FRONTEND_APP_DOMAIN}:8080"
export BACKEND_APP_URL="http://${BACKEND_APP_DOMAIN}:8080"
export NEXT_PUBLIC_API_BASE_URL="$BACKEND_APP_URL"
export LOCAL_TLS_ENABLED="false"
export PROXY_HTTP_PORT="8080"
export PROXY_HTTPS_PORT="8443"
export SANCTUM_STATEFUL_DOMAINS="localhost,127.0.0.1,${FRONTEND_APP_DOMAIN}"

cd "$project_root"

case "$action" in
  up)
    make tls-dev-cert
    make dev-build
    podman compose -f docker-compose.dev.yml up -d
    ;;
  rebuild|restart)
    make tls-dev-cert
    make dev-build
    podman compose -f docker-compose.dev.yml up -d --force-recreate
    ;;
  down)
    podman compose -f docker-compose.dev.yml down
    ;;
  logs)
    podman compose -f docker-compose.dev.yml logs -f frontend backend proxy
    ;;
  ps|status)
    podman compose -f docker-compose.dev.yml ps
    ;;
  seed)
    podman compose -f docker-compose.dev.yml exec -T backend php artisan migrate --force
    podman compose -f docker-compose.dev.yml exec -T backend php artisan db:seed --force
    ;;
  fresh-seed)
    podman compose -f docker-compose.dev.yml exec -T backend php artisan migrate:fresh --seed --force
    ;;
  url)
    ;;
  *)
    echo "Usage: bash scripts/wsl-nip-dev.sh [up|rebuild|restart|down|logs|ps|seed|fresh-seed|url]" >&2
    exit 1
    ;;
esac

cat <<EOF

Frontend: http://${FRONTEND_APP_DOMAIN}:8080
API:      http://${BACKEND_APP_DOMAIN}:8080/api/health

Panduan seeding:
  bash scripts/wsl-nip-dev.sh seed
    Jalankan migration dan DatabaseSeeder tanpa reset data.

  bash scripts/wsl-nip-dev.sh fresh-seed
    Reset database, lalu jalankan semua migration dan seeder.

Akun starter:
  admin@centralsaga.test / password
  finance@centralsaga.test / password
  pm@centralsaga.test / password
  client@centralsaga.test / password
EOF
