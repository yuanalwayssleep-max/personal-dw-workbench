# Wireframes: SQL Workspace and Incident Detail

## Scope

This document covers the MVP low-fidelity wireframe structure for the two most important product pages:

- SQL Workspace
- Incident Detail

These two pages support the core workflow:

`select environment -> write SQL -> record result -> create incident -> append traceback -> accumulate knowledge`

## 1. SQL Workspace

### Page Goal

The SQL workspace is not only a text editor. It is a structured working page for:

- SQL creation
- SQL reuse
- environment-aware development
- result recording
- incident creation

### Layout

Recommended layout:

- left asset list
- center editor area
- right context panel

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Top Bar: environment | search | new SQL | save | snapshot | create incident │
├───────────────┬──────────────────────────────────────┬──────────────────────┤
│ Left List     │ Center Editor                        │ Right Context         │
│               │                                      │                      │
│ SQL list      │ title                                │ basic info           │
│ filters       │ tags                                 │ linked incidents     │
│ favorites     │ environment hint                     │ linked assets        │
│ recent        │ SQL editor                           │ snapshot history     │
│               │ operation bar                        │ run history          │
│               │ collapsible result area              │ work notes           │
└───────────────┴──────────────────────────────────────┴──────────────────────┘
```

### Top Bar

Suggested controls:

- environment switcher
- global search
- new SQL
- save
- save snapshot
- copy SQL
- create incident
- link existing incident
- import result
- open external query portal

Execution behavior should depend on environment capability.

Possible actions:

- direct execute
- copy for execution
- jump to portal
- import result file

### Left List

Purpose:

- navigate reusable SQL assets
- switch between drafts and historical queries

Recommended filters:

- type
- environment
- favorite
- tags
- recent

Recommended list item fields:

- title
- SQL type
- environment
- updated time
- tags
- linked incident indicator

### Center Editor

Recommended sections:

#### SQL Header

- title
- type
- tags
- summary

#### Environment Hint

Display:

- current company
- current environment
- SQL dialect
- time variable style
- available execution mode

#### SQL Editor

Support:

- syntax highlighting
- snippet insertion
- template expansion
- variable hints
- comments

#### Operation Bar

Suggested actions:

- save
- save snapshot
- format
- copy
- insert template
- attach asset
- create analysis note
- create incident

#### Result Panel

Use a collapsible area under the editor.

Support:

- direct result table
- imported result summary
- pasted result summary
- external result link

Suggested actions:

- convert to analysis note
- convert to incident

### Right Context Panel

Recommended blocks:

#### Basic Info

- current environment
- SQL type
- create time
- update time
- source

#### Linked Objects

- incidents
- tables
- tasks
- notes
- model drafts

#### Snapshot History

- version list
- change note
- open one version

#### Run and Result

- recent runs
- latest result summary
- external portal links

#### Work Notes

- temporary assumptions
- constraints
- follow-up checks

### Key User Flows

#### Flow A: Create SQL from Template

1. open template from left list
2. create new SQL from template
3. adapt to selected environment
4. save as SQL asset

#### Flow B: Create Incident from Debug SQL

1. edit debug SQL
2. record result or anomaly summary
3. click `create incident`
4. auto-fill incident initial context

#### Flow C: Convert Result into Analysis Note

1. record query result
2. write observation and conclusion
3. save as analysis note

## 2. Incident Detail

### Page Goal

The incident detail page is the center of issue tracing and review accumulation.

It should support:

- symptom recording
- evidence collection
- step-by-step traceback
- root cause preservation
- fix tracking
- postmortem accumulation

### Layout

Recommended layout:

- top status bar
- left main narrative area
- right evidence and relation panel

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Top Status: title | status | severity | environment | update | close        │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ Left Main Area                       │ Right Evidence Panel                 │
│                                      │                                      │
│ symptom                              │ linked SQL                          │
│ impact scope                         │ linked tables/tasks/logs            │
│ traceback timeline                   │ files and attachments               │
│ root cause                           │ external links                      │
│ fix action                           │ related knowledge                   │
│ review summary                       │ similar incidents                   │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Top Status Bar

Suggested fields:

- title
- incident type
- status
- severity
- environment
- discovered time
- updated time

Suggested actions:

- edit
- add traceback step
- attach relation
- mark resolved
- convert to knowledge note
- copy summary

### Left Main Area

Recommended sections:

#### Symptom

Fields:

- issue description
- trigger context
- discovery method
- initial assumption

#### Impact Scope

Fields:

- affected tables or metrics
- affected time range
- business scope
- downstream impact

#### Traceback Timeline

Each step should include:

- step number
- action type
- action description
- evidence
- intermediate conclusion
- created time

#### Root Cause

Fields:

- root cause category
- detailed root cause
- evidence summary
- confirmation state

#### Fix Action

Fields:

- fix plan
- execution method
- verification result
- follow-up observation

#### Review Summary

Fields:

- lesson learned
- future prevention
- whether to create template
- whether it is company-specific

### Right Evidence Panel

Recommended blocks:

#### Linked SQL

- title
- type
- update time
- open action

#### Linked Tables / Tasks / Logs

- grouped references
- mark as key evidence

#### Files and Attachments

- CSV / Excel
- screenshots
- log snippets
- result snapshots

#### External Links

- query portal
- task portal
- log portal
- metadata portal
- requirement docs

#### Related Knowledge

- SOP notes
- similar review notes
- company-specific constraints

#### Similar Incidents

First version can recommend by:

- tags
- keywords
- same environment
- same asset

### Key User Flows

#### Flow A: Create Incident from SQL Workspace

1. click `create incident` in SQL workspace
2. auto-fill environment, linked SQL, result summary, and symptom draft
3. continue editing incident detail

#### Flow B: Append Traceback Step

1. click `add traceback step`
2. select action type
3. attach evidence
4. write intermediate conclusion
5. save into timeline

#### Flow C: Convert Incident to Knowledge Note

1. click `convert to knowledge note`
2. generate note draft from symptom, root cause, and fix action
3. continue editing in knowledge base
