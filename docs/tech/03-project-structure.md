# Project Structure Proposal

## Goal

This document defines the recommended engineering structure for the MVP implementation.

The immediate target is to support:

- documentation-first project setup
- PostgreSQL schema-based backend
- SQL workspace APIs
- incident APIs
- future adapter-based expansion

## Suggested Repository Structure

```text
personal-dw-workbench/
├── README.md
├── docs/
│   ├── product/
│   │   ├── 02-system-architecture.md
│   │   ├── 04-page-ia.md
│   │   └── 05-wireframes-sql-incident.md
│   └── tech/
│       ├── 01-data-model.md
│       ├── 02-api-design.md
│       └── 03-project-structure.md
├── sql/
│   └── init_schema.sql
├── openapi/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── response.py
│   │   ├── models/
│   │   │   ├── environment.py
│   │   │   ├── sql_asset.py
│   │   │   ├── incident.py
│   │   │   ├── knowledge.py
│   │   │   └── artifact.py
│   │   ├── schemas/
│   │   │   ├── environment.py
│   │   │   ├── sql_asset.py
│   │   │   ├── incident.py
│   │   │   ├── knowledge.py
│   │   │   └── artifact.py
│   │   ├── routers/
│   │   │   ├── environment.py
│   │   │   ├── sql_workspace.py
│   │   │   ├── incident.py
│   │   │   ├── knowledge.py
│   │   │   ├── dashboard.py
│   │   │   └── search.py
│   │   ├── services/
│   │   │   ├── environment_service.py
│   │   │   ├── sql_workspace_service.py
│   │   │   ├── incident_service.py
│   │   │   ├── knowledge_service.py
│   │   │   └── search_service.py
│   │   └── repositories/
│   │       ├── environment_repo.py
│   │       ├── sql_asset_repo.py
│   │       ├── incident_repo.py
│   │       ├── knowledge_repo.py
│   │       └── artifact_repo.py
│   ├── tests/
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── home/
    │   │   ├── environment-routing/
    │   │   ├── sql-workspace/
    │   │   ├── incident-detail/
    │   │   └── knowledge-assets/
    │   ├── components/
    │   ├── services/
    │   ├── stores/
    │   └── types/
    └── package.json
```

## Backend Module Strategy

The backend should be organized by business domain, not by raw table grouping.

Recommended modules:

- `environment`
- `sql_workspace`
- `incident`
- `knowledge`
- `artifact`
- `dashboard`
- `search`

This structure maps directly to product workflows and makes later expansion clearer.

## Backend Layering

### `routers/`

Responsibilities:

- HTTP routing
- request parsing
- response shaping

### `schemas/`

Responsibilities:

- request and response models
- validation contracts

### `services/`

Responsibilities:

- business logic
- workflow orchestration
- cross-repository composition

### `repositories/`

Responsibilities:

- database access
- CRUD operations
- query composition

### `models/`

Responsibilities:

- ORM entity definitions

### `core/`

Responsibilities:

- config loading
- database session
- common response wrappers

## Frontend Module Strategy

The frontend should follow page-centric design for the MVP.

High-priority pages:

- home
- environment routing
- SQL workspace
- incident detail
- knowledge assets

Recommended shared component groups:

- environment selector
- SQL asset list
- incident timeline
- linked object panel
- result summary panel

## MVP Implementation Order

### Phase 1

- initialize backend project
- connect PostgreSQL
- create environment APIs
- create SQL asset CRUD APIs

### Phase 2

- implement SQL snapshots
- implement query run recording
- implement incident CRUD and trace steps

### Phase 3

- implement file artifacts
- implement external asset references
- implement dashboard and search

### Phase 4

- create frontend shell pages
- implement SQL workspace page
- implement incident detail page

## Non-Goals for First Version

Do not prioritize these in the first iteration:

- full lineage graph engine
- enterprise permission system
- complex multi-user collaboration
- automated company-wide metadata synchronization
- heavy BI dashboard system
