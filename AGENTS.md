# AGENTS.md

## 1. Project Overview

This project is a web-based system for managing:
- client contracts
- payment terms and validation
- project progress tracking
- reporting and dashboards

Built for: PT Central Saga Mandala

---

## 2. Tech Stack

- Backend: Laravel (API)
- Frontend: Next.js
- Database: PostgreSQL
- Environment: Docker (mandatory)
- Deployment: Dokploy-compatible
- Registry: GHCR
- Routing: Reverse proxy (domain-based)

---

## 3. Architecture

Services:

- backend (Laravel API)
- frontend (Next.js app)
- database (PostgreSQL)
- reverse proxy (routing layer)

Rules:
- services must be separated (no monolith container)
- backend and frontend must be independently deployable
- database must use persistent storage

---

## 4. Development Rules

- Always use Docker (no local-only setup)
- Do not rely on host PHP/Node installation
- Frontend is the main entry point
- Backend is accessed via API only
- Do not expose unnecessary ports

---

## 5. Domain Routing

Preferred patterns:

Option A:
- kontrak-centralsaga.test -> frontend
- kontrak-centralsaga.test/api -> backend

Option B:
- app.kontrak-centralsaga.test -> frontend
- api.kontrak-centralsaga.test -> backend

Use ONE pattern consistently.

---

## 6. Database Rules

- PostgreSQL is mandatory
- Contracts are the root entity
- Payment terms depend on contracts
- Project progress depends on contracts
- Do not break relational consistency

---

## 7. Business Scope Guard

This system includes ONLY:
- contract management
- payment management
- project progress
- reporting
- client portal

DO NOT expand into:
- ERP
- HR
- accounting system
- task management platform

---

## 8. Coding Rules

Backend:
- Follow Laravel best practices
- Use validation for all inputs
- Keep business logic in backend

Frontend:
- Use Next.js patterns
- Do not move business logic to frontend
- Use API as single source of truth

---

## 9. Docker Rules

- Separate containers:
  - backend
  - frontend
  - database
  - proxy

- Use runtime environment variables
- Do not hardcode localhost
- Images must be deployable (not dev-only)

---

## 10. Deployment Rules

- Must be deployable via container images
- Must be compatible with Dokploy
- Must not depend on local file paths
- Must work using environment variables only

---

## 11. GHCR Rules

- Separate images:
  - backend image
  - frontend image

- Built via CI
- Do not rely on manual build

---

## 12. CI/CD Rules

Minimum pipeline:

- PR:
  - lint
  - test
  - build check

- main branch:
  - build images
  - push to GHCR

- deployment:
  - image-based only

---

## 13. Agent Behavior Rules

- Always follow system scope
- Do not invent new modules
- Prefer simple implementation
- Avoid overengineering
- Respect module boundaries

---

## 14. Skill Mapping

Use skills for detailed work:

- contract -> contract-module-planner
- payment -> payment-module-planner
- progress -> project-progress-module-planner
- reporting -> reporting-module-planner
- client -> client-portal-module-planner
- engineering -> engineering-stack-guard

If unsure -> use thesis-system-guard

---

## 15. Final Rule

Keep the system:
- simple
- consistent
- modular
- deployable
