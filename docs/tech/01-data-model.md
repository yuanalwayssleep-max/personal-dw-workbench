# Data Model

## Design Principles

The data model is designed for MVP first and supports future expansion.

Main principles:

- environment is the primary isolation dimension
- incident is a first-class object
- SQL is a reusable asset, not a temporary text blob
- external objects must be referenceable even when they cannot be fully synchronized
- structured relations are preferred over hard-coded page coupling

## Core Entity Groups

### 1. Environment and Routing

- `workspace_environment`
- `environment_entrypoint`
- `capability_profile`
- `url_template`
- `adapter_registry`

Purpose:

- describe company environments
- define capability matrix
- maintain platform entrypoints
- support adapter routing

### 2. SQL and Development Assets

- `sql_asset`
- `sql_snapshot`
- `query_run_record`
- `model_draft`
- `table_design`
- `field_design`

Purpose:

- manage reusable SQL
- preserve history snapshots
- record query execution results
- store lightweight model design drafts

### 3. Incident and Traceback

- `incident_card`
- `trace_step`
- `incident_link`
- `analysis_note`

Purpose:

- record issue symptoms
- preserve traceback timeline
- connect SQL, files, links, and notes
- store analysis conclusions

### 4. Knowledge and Templates

- `knowledge_note`
- `snippet_template`

Purpose:

- accumulate reusable troubleshooting and modeling knowledge
- store SQL and debug templates

### 5. Files and External References

- `file_artifact`
- `external_asset_ref`

Purpose:

- support file import and export scenarios
- support closed-company environments via external links and references

### 6. Common Support

- `tag_definition`
- `object_tag_relation`
- `activity_log`
- `search_index_entry`

Purpose:

- support tagging
- support global search
- preserve personal work activity

## Core Relationships

### Environment Root

`workspace_environment` is the root entity for most work objects.

Main downstream relations:

- one environment -> many entrypoints
- one environment -> many capabilities
- one environment -> many SQL assets
- one environment -> many incidents
- one environment -> many notes
- one environment -> many files

### SQL Asset Relations

`sql_asset` owns:

- snapshots
- query run records

And it can be linked to incidents through `incident_link`.

### Incident Relations

`incident_card` owns:

- trace steps
- linked SQL
- linked files
- linked external assets
- linked knowledge notes

This makes incident the main object of the traceback loop.

## MVP-Priority Tables

For the first implementation phase, prioritize these tables:

1. `workspace_environment`
2. `environment_entrypoint`
3. `capability_profile`
4. `sql_asset`
5. `sql_snapshot`
6. `query_run_record`
7. `incident_card`
8. `trace_step`
9. `incident_link`
10. `knowledge_note`
11. `file_artifact`
12. `external_asset_ref`

These are sufficient to support:

- environment switching
- SQL workspace
- query result recording
- incident trace workflow
- file and evidence attachment
- knowledge accumulation

## Object Design Notes

### SQL Asset

`sql_asset` should support at least:

- title
- type
- content
- summary
- tags
- favorite state
- environment

Recommended types:

- `analysis`
- `model`
- `debug`
- `template`

### Query Run Record

`query_run_record` should not assume direct execution only.

It must support:

- direct query
- portal jump
- copy and paste execution
- file import
- manual result summary

### Incident Card

`incident_card` is a core business object. It should support:

- symptom description
- impact scope
- root cause
- fix action
- review note
- status lifecycle

Recommended statuses:

- `open`
- `investigating`
- `pending_verify`
- `resolved`
- `closed`

### Incident Link

`incident_link` is the bridge table that connects local and external objects.

It should support both:

- `target_id` for local structured objects
- `target_ref` for external pages and manual references

This is necessary for closed internal company systems.
