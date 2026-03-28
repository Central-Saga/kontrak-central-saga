# Reverse Proxy Rules

## Goal
Provide clean local and deployable routing for frontend and backend services.

## Preferred patterns

### Pattern A
- kontrak-centralsaga.test -> Next.js frontend
- kontrak-centralsaga.test/api -> Laravel backend

Use when the team wants one main domain.

### Pattern B
- app.kontrak-centralsaga.test -> Next.js frontend
- api.kontrak-centralsaga.test -> Laravel backend

Use when the team wants clearer service separation and closer production parity.

## Routing rules
- frontend should be the main user-facing app
- backend API should be routed intentionally
- do not mix random public ports into the developer experience if a domain-based approach is chosen

## Local domain notes
- local custom domains require host resolution setup
- document the host mapping rules for the team
- keep the chosen domain pattern consistent

## Auth and CORS notes
If using split domains:
- be explicit about allowed origins
- handle cookies, sessions, or tokens carefully

If using a shared root domain with an API path:
- simplify routing and same-site behavior where possible
