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

Use the container-based dev stack when you want frontend hot reload without leaving the project architecture:

```bash
make dev-up
```

`make dev-up` auto-detects `docker compose`, `podman compose`, or `podman-compose`.

On Windows PowerShell, if `make` is not installed yet, use the equivalent Compose helper:

```powershell
.\scripts\dev.cmd up
```

The helper also auto-detects Docker or Podman. Install Podman, start the Podman machine, then open a new terminal before running it.

This keeps the reverse proxy and backend in containers, but runs the frontend with `next dev` inside a container and bind-mounts the source tree so UI edits reload automatically.

For Podman on Windows, verify these first:

```powershell
podman --version
podman machine start
podman compose version
```

If `podman compose version` is not available, install the Compose provider used by your Podman setup, or install `podman-compose`.

When the dev helpers detect Podman, they use `docker/podman/containers.conf` to avoid rootless WSL nftables failures on user-defined bridge networks. They also default the proxy ports and app/API URLs to `8080` and `8443`, because rootless Podman cannot bind `80` or `443` unless your system is configured to allow privileged ports. Access the app at `https://app.kontrak-centralsaga.site:8443` and the API at `https://api.kontrak-centralsaga.site:8443`, or override `PROXY_HTTP_PORT` / `PROXY_HTTPS_PORT`.

Useful commands:

- `make dev-logs` to watch frontend/backend/proxy logs
- `make dev-rebuild` to force a clean restart of the dev stack
- `make dev-down` to stop the dev stack

PowerShell equivalents:

- `.\scripts\dev.cmd logs` to watch frontend/backend/proxy logs
- `.\scripts\dev.cmd rebuild` to force a clean restart of the dev stack
- `.\scripts\dev.cmd down` to stop the dev stack

### Windows + WSL + Podman Without Hosts File

If Windows cannot edit `C:\Windows\System32\drivers\etc\hosts`, use the WSL IP with `nip.io`.
This avoids local DNS/hosts setup entirely.

Run these from Windows PowerShell:

```powershell
wsl --cd /mnt/c/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh up
```

The command prints the current frontend and API URLs. They look like this:

```txt
http://app.<WSL-IP>.nip.io:8080
http://api.<WSL-IP>.nip.io:8080/api/health
```

Common commands:

```powershell
# Start the stack
wsl --cd /mnt/c/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh up

# Stop the stack
wsl --cd /mnt/c/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh down

# Restart/recreate the stack after WSL IP changes
wsl --cd /mnt/c/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh rebuild

# Check running containers
wsl --cd /mnt/c/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh ps

# Watch logs
wsl --cd /mnt/c/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh logs

# Print the current URLs only
wsl --cd /mnt/c/kontrak-central-saga -- bash scripts/wsl-nip-dev.sh url
```

WSL IP addresses can change after restarting Windows or WSL. If the browser says `ERR_CONNECTION_REFUSED`, run `rebuild` and use the newly printed URL.

If PowerShell reports `make`, `podman`, or `openssl` as not recognized, the root issue is missing tooling in `PATH`.
`make` is optional when using `scripts/dev.cmd`, but a Compose-compatible container runtime is required.
To keep using `make dev-up` on Windows, run it from Git Bash/MSYS or another shell where `make`, `sh`, and `podman` are all available in `PATH`.

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
