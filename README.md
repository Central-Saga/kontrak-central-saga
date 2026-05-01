# kontrak-central-saga

Web-based system for managing client contracts, payment validation, project progress, reporting, and client portal for PT Central Saga Mandala.

## Local Access

Preferred local domains:

- `https://app.kontrak-centralsaga.site` - Next.js frontend
- `https://api.kontrak-centralsaga.site` - Laravel API

Add these to your hosts file for local development:

- `127.0.0.1 app.kontrak-centralsaga.site`
- `127.0.0.1 api.kontrak-centralsaga.site`

For automated E2E/bootstrap flows, the project still uses `app.127.0.0.1.nip.io` and `api.127.0.0.1.nip.io` overrides through `make e2e-bootstrap`.

If ports `80` or `443` are already occupied on your machine, change `PROXY_HTTP_PORT` / `PROXY_HTTPS_PORT` in `.env` (for example `8080` and `8443`).

Local HTTPS is terminated by the nginx proxy container using dev certificates in `docker/proxy/certs/`.
Run `make tls-dev-cert` once if you need to regenerate the local certificate for the `.site` domains.

- If `mkcert` is installed, the generated certificate will be locally trusted.
- If `mkcert` is not installed, the fallback is a self-signed certificate and your browser may show a warning until you trust it manually.

## Local Dev With Hot Reload

Use the Docker-based dev stack when you want frontend hot reload without leaving the project architecture:

```bash
make dev-up
```

This keeps the reverse proxy and backend in Docker, but runs the frontend with `next dev` inside a container and bind-mounts the source tree so UI edits reload automatically.

Useful commands:

- `make dev-logs` to watch frontend/backend/proxy logs
- `make dev-rebuild` to force a clean restart of the dev stack
- `make dev-down` to stop the dev stack

Access the app through:

- `https://app.kontrak-centralsaga.site`
- `https://api.kontrak-centralsaga.site`

## Dokploy / SSL

- Frontend image: `ghcr.io/<owner>/kontrak-central-saga-frontend`
- Backend image: `ghcr.io/<owner>/kontrak-central-saga-backend`
- Recommended domains in Dokploy: `app.<your-domain>` for frontend and `api.<your-domain>` for backend
- SSL should terminate at Dokploy/Traefik using custom domains and Let's Encrypt
- Set runtime envs explicitly in Dokploy, especially `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_BASE_URL`, `SERVER_API_BASE_URL`, `APP_URL`, and `SANCTUM_STATEFUL_DOMAINS`
- Use `.env.dokploy.example` in this repo as the starting template for Dokploy runtime variables

## Brand Assets

Upload the final logo to `frontend/public/brand/logo.svg` (preferred) or replace it with a PNG file at the same path you choose in the frontend branding component.

## Structure

- `backend` - Laravel API
- `frontend` - Next.js app
- `docker` - reverse proxy and infra config
- `postman` - import-ready Postman collection and environment

## Postman

Import these files into Postman:

- `postman/Kontrak Central Saga API.postman_collection.json`
- `postman/Kontrak Central Saga.local.postman_environment.json`
