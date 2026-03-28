# Project Infrastructure Overview

This project uses:
- Laravel as backend
- Next.js as frontend
- PostgreSQL as the relational database
- Docker as the standard local and packaging strategy
- reverse proxy for clean domain-based access
- GHCR as the container image registry
- Dokploy-compatible image deployment
- CI/CD from the beginning

## Main goals
- local development should be predictable
- deployment should not require re-architecting
- backend and frontend should be separately deployable
- stateful data should remain in PostgreSQL
- reverse proxy should hide unnecessary port complexity
- all major services should work from image plus environment variables

## Baseline topology
- reverse proxy
- frontend
- backend
- PostgreSQL

## Optional local-only tools
- Portainer
- pgAdmin
- Mailpit
- Redis
- queue worker

These optional tools must never become hard requirements for the core application to run.
