# Docker Standards

## General rules
- use one Dockerfile per main app service
- keep backend and frontend in separate images
- prefer multi-stage builds when they improve image quality
- keep runtime images smaller than build images when practical
- do not rely on host machine dependencies

## Service naming
Prefer explicit names such as:
- app-backend
- app-frontend
- app-db
- app-proxy

## Volumes
Use named volumes only for:
- PostgreSQL data
- optional persistent app storage if required

Do not create unnecessary volumes for everything.

## Ports
For local development:
- expose only what is necessary
- prefer proxy-based access instead of memorizing many ports

For deployment:
- expose only the reverse proxy publicly unless platform routing replaces it

## Networks
Use explicit app network naming.
Keep service communication internal where possible.

## Healthchecks
Use healthchecks when they improve reliability, especially for:
- backend
- frontend
- PostgreSQL
- proxy

## Build expectations
Each image should be usable for:
- local validation
- CI build
- GHCR publishing
- Dokploy deployment
