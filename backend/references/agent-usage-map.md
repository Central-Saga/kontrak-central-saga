# Agent Usage Map

## Core context agent
- thesis-system-guard
  - use for scope checking
  - use for feature alignment
  - use when the team is unsure whether a request still fits the project

## Business module agents
- contract-module-planner
  - use for contract entities, statuses, flows, and contract pages
- payment-module-planner
  - use for payment terms, payment proof, validation, and overdue flow
- project-progress-module-planner
  - use for progress tracking and milestone visibility
- reporting-module-planner
  - use for dashboards, reports, summaries, and role-based monitoring
- client-portal-module-planner
  - use for client-facing access, visibility, and client-safe workflows

## Engineering agent
- engineering-stack-guard
  - use for Docker, PostgreSQL, reverse proxy, GHCR, Dokploy, env, and CI/CD planning

## Usage rule
- if the question is about overall scope, always start with thesis-system-guard
- if the question is about one module, use the matching module planner
- if the question is about deployment or environment setup, use engineering-stack-guard
- if two agents seem relevant, preserve business scope first, then validate engineering setup
