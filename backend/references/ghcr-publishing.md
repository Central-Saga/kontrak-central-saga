# GHCR Publishing

## Image separation
Prefer:
- ghcr.io/<org-or-user>/kontrak-backend
- ghcr.io/<org-or-user>/kontrak-frontend

## Tagging guidance
Prefer predictable tags such as:
- latest for the main stable branch if used intentionally
- sha-based tags for traceability
- version tags for releases

## Publishing expectations
- images are built in CI
- images are pushed automatically from approved branches or releases
- no manual local build workflow should become the primary publishing path

## Security notes
- use registry authentication through CI secrets
- avoid leaking secrets into build logs
