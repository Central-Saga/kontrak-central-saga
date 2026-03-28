# Local Development Conventions

## Goal
Make local onboarding predictable and close enough to deployment architecture.

## Preferred local experience
- start services with a Docker-based workflow
- access the app through a configured local domain
- avoid remembering many raw ports when proxy routing is available
- use consistent service names and env file strategy

## Optional local tools
Optional tools may include:
- Portainer
- pgAdmin
- Mailpit

These tools are helpful for development, but the app must not require them to function.

## Team consistency
- document first-run setup
- document local host mapping if custom domains are used
- document how frontend talks to backend
- document where PostgreSQL data lives
