# Dokploy Compatibility

## Core assumptions
Services should be deployable from container images and runtime environment variables.

## Compatibility rules
- backend and frontend images should be independently deployable
- no dependency on local bind mounts in production assumptions
- no dependency on interactive setup after container start
- stateful services must define persistence clearly
- ports and service names should remain understandable
- environment injection should happen cleanly
- reverse proxy assumptions should not conflict with platform routing choices

## Anti-patterns
- building only for local compose and not for image-based deployment
- assuming localhost inside services
- hardcoding environment values
- coupling deploy success to optional tooling like Portainer
