ifeq ($(OS),Windows_NT)
SHELL := C:/Progra~1/Git/bin/sh.exe
else
SHELL := /bin/sh
endif

.PHONY: up down rebuild ps fresh health test-local boost-mcp boost-stdio boost-inspector e2e-up e2e-seed e2e-bootstrap e2e-down tls-dev-cert dev-build dev-up dev-down dev-rebuild dev-logs dev-auto

E2E_FRONTEND_APP_DOMAIN := app.127.0.0.1.nip.io
E2E_BACKEND_APP_DOMAIN := api.127.0.0.1.nip.io
E2E_PROXY_HTTP_PORT := 8080
E2E_BACKEND_APP_URL := http://$(E2E_BACKEND_APP_DOMAIN):$(E2E_PROXY_HTTP_PORT)
E2E_FRONTEND_APP_URL := http://$(E2E_FRONTEND_APP_DOMAIN):$(E2E_PROXY_HTTP_PORT)
E2E_NEXT_PUBLIC_API_BASE_URL := http://$(E2E_BACKEND_APP_DOMAIN):$(E2E_PROXY_HTTP_PORT)
E2E_SANCTUM_STATEFUL_DOMAINS := localhost,127.0.0.1,$(E2E_FRONTEND_APP_DOMAIN)
E2E_COMPOSE_ENV := FRONTEND_APP_DOMAIN=$(E2E_FRONTEND_APP_DOMAIN) BACKEND_APP_DOMAIN=$(E2E_BACKEND_APP_DOMAIN) PROXY_HTTP_PORT=$(E2E_PROXY_HTTP_PORT) BACKEND_APP_URL=$(E2E_BACKEND_APP_URL) FRONTEND_APP_URL=$(E2E_FRONTEND_APP_URL) NEXT_PUBLIC_API_BASE_URL=$(E2E_NEXT_PUBLIC_API_BASE_URL) SANCTUM_STATEFUL_DOMAINS=$(E2E_SANCTUM_STATEFUL_DOMAINS)

ifndef COMPOSE_CMD
COMPOSE_CMD := $(shell if command -v docker >/dev/null 2>&1; then printf '%s' 'docker compose'; elif command -v podman >/dev/null 2>&1 && podman compose version >/dev/null 2>&1; then printf '%s' 'podman compose'; elif command -v podman-compose >/dev/null 2>&1; then printf '%s' 'podman-compose'; fi)
endif

ifeq ($(strip $(COMPOSE_CMD)),)
$(error No supported compose command found. Install Docker/OrbStack (docker compose), Podman with podman compose, or podman-compose. You can also run make COMPOSE_CMD='podman compose' <target>)
endif

PODMAN_CONTAINERS_CONF := $(CURDIR)/docker/podman/containers.conf
PODMAN_COMPOSE_ENV :=
DEV_COMPOSE_ENV :=
ifneq (,$(findstring podman,$(COMPOSE_CMD)))
PODMAN_COMPOSE_ENV := env CONTAINERS_CONF=$(PODMAN_CONTAINERS_CONF)
DEV_COMPOSE_ENV := env CONTAINERS_CONF=$(PODMAN_CONTAINERS_CONF) PROXY_HTTP_PORT=$${PROXY_HTTP_PORT:-8080} PROXY_HTTPS_PORT=$${PROXY_HTTPS_PORT:-8443} FRONTEND_APP_URL=$${FRONTEND_APP_URL:-https://app.kontrak-centralsaga.site:$${PROXY_HTTPS_PORT:-8443}} BACKEND_APP_URL=$${BACKEND_APP_URL:-https://api.kontrak-centralsaga.site:$${PROXY_HTTPS_PORT:-8443}} NEXT_PUBLIC_API_BASE_URL=$${NEXT_PUBLIC_API_BASE_URL:-https://api.kontrak-centralsaga.site:$${PROXY_HTTPS_PORT:-8443}} SANCTUM_STATEFUL_DOMAINS=$${SANCTUM_STATEFUL_DOMAINS:-localhost,127.0.0.1,app.kontrak-centralsaga.site,app.kontrak-centralsaga.site:$${PROXY_HTTPS_PORT:-8443}}
endif

up:
	$(MAKE) tls-dev-cert
	$(PODMAN_COMPOSE_ENV) $(COMPOSE_CMD) up -d --build

dev-up:
	$(MAKE) tls-dev-cert
	$(MAKE) dev-build
	$(DEV_COMPOSE_ENV) $(COMPOSE_CMD) -f docker-compose.dev.yml up -d

dev-build:
	@if printf '%s' "$(COMPOSE_CMD)" | grep -q 'podman'; then \
		podman build -t kontrak-central-saga-frontend-dev -f frontend/Dockerfile.dev frontend; \
		podman build -t kontrak-central-saga-backend-dev -f backend/Dockerfile backend; \
	else \
		$(COMPOSE_CMD) -f docker-compose.dev.yml build; \
	fi

down:
	$(PODMAN_COMPOSE_ENV) $(COMPOSE_CMD) down

dev-down:
	$(DEV_COMPOSE_ENV) $(COMPOSE_CMD) -f docker-compose.dev.yml down

rebuild:
	$(MAKE) tls-dev-cert
	$(PODMAN_COMPOSE_ENV) $(COMPOSE_CMD) up -d --build --force-recreate

dev-rebuild:
	$(MAKE) tls-dev-cert
	$(MAKE) dev-build
	$(DEV_COMPOSE_ENV) $(COMPOSE_CMD) -f docker-compose.dev.yml up -d --force-recreate

ps:
	$(PODMAN_COMPOSE_ENV) $(COMPOSE_CMD) ps

dev-logs:
	$(DEV_COMPOSE_ENV) $(COMPOSE_CMD) -f docker-compose.dev.yml logs -f frontend backend proxy

fresh:
	$(PODMAN_COMPOSE_ENV) $(COMPOSE_CMD) exec -T backend php artisan migrate:fresh --seed --force

health:
	$(PODMAN_COMPOSE_ENV) $(COMPOSE_CMD) exec -T backend php -r "echo file_get_contents('http://127.0.0.1/api/health');"

test-local:
	cd backend && php artisan test --compact

boost-mcp: boost-inspector

boost-stdio:
	cd backend && php artisan boost:mcp

boost-inspector:
	cd backend && php artisan mcp:inspector laravel-boost --host=127.0.0.1 --port=6277

e2e-up:
	$(MAKE) tls-dev-cert
	$(E2E_COMPOSE_ENV) $(PODMAN_COMPOSE_ENV) $(COMPOSE_CMD) up -d --build
	$(E2E_COMPOSE_ENV) $(PODMAN_COMPOSE_ENV) $(COMPOSE_CMD) exec -T backend php -r "for (\$$i = 0; \$$i < 30; \$$i++) { if (@file_get_contents('http://127.0.0.1/api/health') !== false) { exit(0); } sleep(1); } fwrite(STDERR, 'Backend health check failed'.PHP_EOL); exit(1);"

e2e-seed:
	$(E2E_COMPOSE_ENV) $(PODMAN_COMPOSE_ENV) $(COMPOSE_CMD) exec -T backend php artisan migrate --force
	$(E2E_COMPOSE_ENV) $(PODMAN_COMPOSE_ENV) $(COMPOSE_CMD) exec -T backend php artisan db:seed --class=Database\\Seeders\\E2eAuthUserSeeder --force

e2e-bootstrap: e2e-up e2e-seed

e2e-down:
	$(E2E_COMPOSE_ENV) $(PODMAN_COMPOSE_ENV) $(COMPOSE_CMD) down

# Auto-find available port and run
dev-auto:
	@HTTP_PORT=$$(python3 -c "import socket; s=socket.socket(); s.bind(('', 0)); print(s.getsockname()[1]); s.close()"); \
	HTTPS_PORT=$$((HTTP_PORT + 1)); \
	echo ""; \
	echo "========================================"; \
	echo "🚀 Menjalankan Kontrak Central Saga"; \
	echo "========================================"; \
	echo ""; \
	echo "📡 HTTP Port:  $$HTTP_PORT"; \
	echo "📡 HTTPS Port: $$HTTPS_PORT"; \
	echo ""; \
	$(MAKE) tls-dev-cert; \
	PROXY_HTTP_PORT=$$HTTP_PORT PROXY_HTTPS_PORT=$$HTTPS_PORT $(PODMAN_COMPOSE_ENV) $(COMPOSE_CMD) up -d --build; \
	echo ""; \
	echo "✅ Server berjalan!"; \
	echo ""; \
	echo "🌐 URL Akses (gunakan HTTPS):"; \
	echo "   Frontend: https://app.kontrak-centralsaga.site:$$HTTPS_PORT"; \
	echo "   Backend:  https://api.kontrak-centralsaga.site:$$HTTPS_PORT"; \
	echo ""; \
	echo "⚠️  Pastikan domain di /etc/hosts:"; \
	echo "   127.0.0.1 app.kontrak-centralsaga.site api.kontrak-centralsaga.site"; \
	echo ""; \
	echo "🛑 Untuk berhenti: make down"; \
	echo ""

tls-dev-cert:
	@mkdir -p docker/proxy/certs
	@rm -f docker/proxy/certs/local-dev.crt docker/proxy/certs/local-dev.key
	@if command -v mkcert >/dev/null 2>&1; then \
		cd docker/proxy/certs && mkcert -cert-file local-dev.crt -key-file local-dev.key app.kontrak-centralsaga.site api.kontrak-centralsaga.site; \
	else \
		if command -v openssl >/dev/null 2>&1; then \
			MSYS_NO_PATHCONV=1 openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
				-keyout docker/proxy/certs/local-dev.key \
				-out docker/proxy/certs/local-dev.crt \
				-subj "/CN=app.kontrak-centralsaga.site" \
				-addext "subjectAltName=DNS:app.kontrak-centralsaga.site,DNS:api.kontrak-centralsaga.site"; \
		elif command -v podman >/dev/null 2>&1; then \
			MSYS_NO_PATHCONV=1 podman run --rm --mount type=bind,source=$$(pwd)/docker/proxy/certs,target=/certs docker.io/alpine/openssl:latest req \
				-x509 -nodes -days 365 -newkey rsa:2048 \
				-keyout /certs/local-dev.key \
				-out /certs/local-dev.crt \
				-subj "/CN=app.kontrak-centralsaga.site" \
				-addext "subjectAltName=DNS:app.kontrak-centralsaga.site,DNS:api.kontrak-centralsaga.site"; \
		else \
			echo "No local certificate generator found. Install mkcert/openssl or Podman."; \
			exit 1; \
		fi; \
	fi
