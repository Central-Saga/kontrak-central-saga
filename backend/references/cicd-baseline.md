# CI/CD Baseline

## Initial workflow expectations
A simple and reliable baseline is better than an advanced but fragile pipeline.

## Pull request flow
- install dependencies
- lint
- run relevant tests
- verify builds where practical

## Main branch flow
- build backend image
- build frontend image
- tag images
- push images to GHCR

## Deployment flow
- deploy from image tags
- keep the deployment path image-based
- allow manual approval if needed

## Design principles
- keep the pipeline readable
- avoid duplicate logic
- keep backend and frontend build steps explicit
- make failures obvious
- preserve traceability from commit to image
