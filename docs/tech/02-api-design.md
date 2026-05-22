# API Design

## API Scope

This document covers the MVP API design for the two most important product workflows:

- SQL workspace
- incident card and traceback

Base path:

- `/api/v1`

## Response Contract

Standard response:

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

Pagination response:

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "page": 1,
    "page_size": 20,
    "total": 100
  }
}
```

## Environment APIs

### `GET /api/v1/environments`

Purpose:

- list selectable company environments

### `GET /api/v1/environments/{id}`

Purpose:

- get environment detail
- return basic info, entrypoints, and capability summary

### `GET /api/v1/environments/{id}/entrypoints`

Purpose:

- provide quick links to query, task, metadata, and log portals

### `GET /api/v1/environments/{id}/capabilities`

Purpose:

- return capability matrix for UI behavior and routing decisions

## SQL Workspace APIs

### `GET /api/v1/sql-assets`

Purpose:

- list SQL assets for workspace left panel

Suggested filters:

- `environment_id`
- `sql_type`
- `keyword`
- `is_favorite`
- `page`
- `page_size`

### `GET /api/v1/sql-assets/{id}`

Purpose:

- get SQL detail for workspace editor and right-side context panel

Should include:

- SQL base info
- latest snapshot
- latest query runs
- linked incidents

### `POST /api/v1/sql-assets`

Purpose:

- create SQL asset

### `PUT /api/v1/sql-assets/{id}`

Purpose:

- update SQL asset

### `POST /api/v1/sql-assets/{id}/favorite`

Purpose:

- mark or unmark favorite

### `POST /api/v1/sql-assets/{id}/snapshots`

Purpose:

- save SQL snapshot

### `GET /api/v1/sql-assets/{id}/snapshots`

Purpose:

- list history snapshots

### `GET /api/v1/sql-assets/{id}/snapshots/{snapshot_id}`

Purpose:

- get one snapshot detail

### `POST /api/v1/query-runs`

Purpose:

- record a query run, portal action, imported result, or manual result summary

### `GET /api/v1/sql-assets/{id}/query-runs`

Purpose:

- list query run records for one SQL asset

### `POST /api/v1/sql-assets/{id}/create-incident`

Purpose:

- create incident card directly from SQL workspace context

## Incident APIs

### `GET /api/v1/incidents`

Purpose:

- list incident cards

Suggested filters:

- `environment_id`
- `incident_type`
- `status`
- `severity`
- `keyword`
- `page`
- `page_size`

### `GET /api/v1/incidents/{id}`

Purpose:

- get incident detail

Should include:

- base info
- trace steps
- linked SQL
- linked files
- linked external assets
- linked notes

### `POST /api/v1/incidents`

Purpose:

- create incident manually

### `PUT /api/v1/incidents/{id}`

Purpose:

- update incident core fields

### `POST /api/v1/incidents/{id}/status`

Purpose:

- update incident status only

### `POST /api/v1/incidents/{id}/trace-steps`

Purpose:

- append traceback step

### `GET /api/v1/incidents/{id}/trace-steps`

Purpose:

- list traceback timeline

### `PUT /api/v1/incidents/{id}/trace-steps/{step_id}`

Purpose:

- update one traceback step

### `DELETE /api/v1/incidents/{id}/trace-steps/{step_id}`

Purpose:

- remove one traceback step if needed

### `POST /api/v1/incidents/{id}/links`

Purpose:

- link SQL, files, external assets, or notes to an incident

### `GET /api/v1/incidents/{id}/links`

Purpose:

- return grouped linked objects for the evidence panel

### `DELETE /api/v1/incidents/{id}/links/{link_id}`

Purpose:

- remove one incident relation

## File and External Asset APIs

### `POST /api/v1/files`

Purpose:

- upload CSV, Excel, screenshot, log, or text artifact

### `GET /api/v1/files/{id}`

Purpose:

- get file detail for incident and asset views

### `POST /api/v1/external-assets`

Purpose:

- create external table, task, log, dashboard, or document reference

### `GET /api/v1/external-assets/{id}`

Purpose:

- get external reference detail

## Knowledge APIs

### `GET /api/v1/knowledge-notes`

Purpose:

- list knowledge notes

### `POST /api/v1/knowledge-notes`

Purpose:

- create knowledge note

### `PUT /api/v1/knowledge-notes/{id}`

Purpose:

- update knowledge note

### `POST /api/v1/incidents/{id}/generate-knowledge-note`

Purpose:

- create a knowledge note draft from incident outcome

## Dashboard and Search APIs

### `GET /api/v1/dashboard/home`

Purpose:

- return aggregated home page data

Suggested content:

- current environment summary
- recent SQL assets
- pending incidents
- recent notes
- quick entrypoints

### `GET /api/v1/search`

Purpose:

- perform global search across assets

Suggested object groups:

- SQL assets
- incidents
- knowledge notes
- external assets
- files

## Implementation Priority

### P0

- environments list and detail
- SQL asset CRUD
- SQL snapshot creation
- query run creation
- incident CRUD
- trace step creation
- incident link creation
- file upload
- external asset creation
- home dashboard aggregation

### P1

- snapshot history query
- query run list
- quick incident creation from SQL
- incident status update
- incident links query
- knowledge note CRUD
- generate knowledge note from incident
- global search
