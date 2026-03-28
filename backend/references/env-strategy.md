# Environment Strategy

## Main principle
Environment configuration must be explicit, documented, and separated by environment.

## Environment groups
- local
- staging or preview if used
- production

## Backend environment
Typical categories:
- app settings
- database connection
- storage settings
- queue or mail settings if used
- trusted origins or CORS settings

## Frontend environment
Separate:
- public browser-safe variables
- private server-only variables

Do not expose secrets through frontend runtime variables.

## Documentation rule
Always maintain example environment files or setup notes for the team.

## Secret handling
- never commit real secrets
- use CI or deployment secret injection
- keep local developer onboarding simple and documented
