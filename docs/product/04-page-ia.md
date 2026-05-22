# Page Information Architecture

## Navigation

The main navigation should stay minimal and map directly to the system architecture:

- `Home`
- `Environment Routing`
- `Modeling and Development`
- `Analysis and Traceback`
- `Knowledge Assets`
- `Settings`

This keeps product navigation aligned with the `three vertical layers plus one horizontal layer` structure.

## 1. Home

The home page is not a management dashboard. It is a personal work-entry page.

Main goals:

- show current working environment
- help resume unfinished work
- surface pending incidents
- expose frequently used assets and shortcuts

Recommended sections:

### Current Environment Card

Display:

- current company
- current environment
- network mode
- SQL dialect
- capability summary
- quick entry links

### Recent Work

Display:

- recent SQL assets
- recent query runs
- recent incident cards
- recent knowledge notes

### Pending Incidents

Display:

- unresolved incidents
- newly created incidents
- high-priority incidents

### Frequent Assets

Display:

- favorite SQL assets
- common tables
- common tasks
- common templates

### Quick Actions

Actions:

- create SQL
- create incident
- create model draft
- create knowledge note
- import result file

### Global Search

Support one search box for:

- SQL
- incident
- knowledge note
- file
- external asset reference

## 2. Environment Routing

This page represents the `Capability Routing Layer`.

Recommended views:

- environment list
- environment detail
- capability matrix

### Environment List

Each card should show:

- company name
- environment name
- network mode
- query mode
- capability summary
- last used time

### Environment Detail

Display:

- basic environment info
- SQL dialect
- time variable rules
- company-specific constraints
- common databases and assets
- external platform entrypoints

### Capability Matrix

Show the six core capabilities:

- `query`
- `metadata`
- `task`
- `log`
- `asset_link`
- `artifact`

For each capability, show:

- level
- source type
- adapter used
- fallback path

## 3. Modeling and Development

This page represents the `Modeling and Code Development Layer`.

Recommended tabs:

- SQL Workspace
- Model Drafts
- Templates and Snippets
- Development Snapshots

### SQL Workspace

Purpose:

- create, edit, organize, and reuse SQL assets
- attach execution result context
- connect SQL with incidents and assets

### Model Drafts

Purpose:

- record domain, layer, grain, and table design ideas
- preserve modeling decisions outside company internal tools

### Templates and Snippets

Purpose:

- manage reusable SQL and troubleshooting patterns

Suggested categories:

- modeling templates
- analysis templates
- debug templates
- utility snippets
- company-specific templates

### Development Snapshots

Purpose:

- review SQL history
- compare logic changes
- preserve important working versions

## 4. Analysis and Traceback

This page represents the `Data Analysis and Issue Traceback Layer`.

Recommended tabs:

- Query Results
- Analysis Notes
- Incident Cards
- Traceback Chain
- Review Records

### Query Results

Support result sources from:

- direct query execution
- pasted summaries
- imported files
- external page references

### Analysis Notes

Purpose:

- record observations
- preserve intermediate reasoning
- convert result review into structured notes

### Incident Cards

Purpose:

- manage issue lifecycle
- preserve symptoms, evidence, root cause, and actions

### Traceback Chain

Purpose:

- show structured evidence path
- connect SQL, tasks, logs, and files

First version does not need full lineage graph. A structured chain view is enough.

### Review Records

Purpose:

- convert incidents into reusable lessons
- summarize recurring issue patterns

## 5. Knowledge Assets

This page represents the cross-layer reusable knowledge system.

Recommended tabs:

- Knowledge Base
- Unified Assets
- File Center
- Tag View

### Knowledge Base

Suggested categories:

- modeling specifications
- metric definitions
- troubleshooting SOPs
- company-specific notes
- analysis summaries
- postmortem conclusions

### Unified Assets

Provide one index page for:

- SQL assets
- model drafts
- incident cards
- notes
- templates
- files
- external asset references

### File Center

Manage:

- CSV
- Excel
- screenshots
- logs
- result snapshots

### Tag View

Show grouped objects by theme, such as:

- retention
- task failure
- order domain
- high-frequency issue

## 6. Settings

Settings should contain system-level controls only.

Recommended sections:

- environment configuration
- adapter configuration
- storage configuration
- search configuration
- import and export configuration
- masking and local retention policy

## MVP Priority Pages

### P0

- Home
- Environment Routing
- SQL Workspace
- Incident Card Detail
- Knowledge Base

### P1

- Model Drafts
- File Center
- Unified Assets
- Query Results

### P2

- Traceback Chain
- Review Records
- Tag View
- Development Snapshots
