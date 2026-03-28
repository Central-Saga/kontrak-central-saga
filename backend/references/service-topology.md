# Service Topology

## Required services
- reverse proxy
- Laravel backend
- Next.js frontend
- PostgreSQL database

## Optional services
- queue worker
- scheduler
- Redis
- Portainer
- pgAdmin
- Mailpit

Optional services must be clearly marked as optional.

## Dependency logic
- frontend depends on backend API availability
- backend depends on PostgreSQL
- reverse proxy routes traffic to frontend and backend
- PostgreSQL stores persistent application data

## Deployment principle
The project should still function correctly without optional developer tools.
