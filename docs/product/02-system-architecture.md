# System Architecture

## Product Positioning

This system is a personal data warehouse workbench for one engineer who may work across multiple companies and multiple internal environments.

It does not aim to replace enterprise internal platforms. It provides a stable personal work layer above company-specific portals, platforms, and access constraints.

Core goals:

- adapt to different company environments
- improve daily SQL and modeling efficiency
- reduce issue locating time
- accumulate reusable personal knowledge and troubleshooting assets

## Architecture Summary

The system adopts a `three vertical layers plus one horizontal layer` architecture.

### Vertical Layer 1: Capability Routing Layer

This layer hides company-specific differences and exposes unified work capabilities.

Core modules:

- environment manager
- capability registry
- routing dispatcher
- adapter plugin layer

Supported capability categories:

- `query`
- `metadata`
- `task`
- `log`
- `asset_link`
- `artifact`

This layer must support graceful degradation:

- direct access
- portal jump
- copy/paste bridge
- file import/export
- manual fallback

### Vertical Layer 2: Modeling and Code Development Layer

This layer is the production layer for the engineer's daily outputs.

Core modules:

- model design area
- SQL workspace
- template and snippet area
- development snapshot area

Core outputs:

- model drafts
- SQL assets
- metric definitions
- table design drafts
- debug scripts
- development snapshots

### Vertical Layer 3: Data Analysis and Issue Traceback Layer

This layer consumes results, validates logic, and closes the troubleshooting loop.

Core modules:

- result analysis area
- lightweight analysis area
- incident card area
- traceback chain area
- postmortem accumulation area

Core outputs:

- analysis conclusions
- anomaly judgments
- root causes
- fix actions
- review notes

### Horizontal Layer: Foundation Support Layer

This layer provides shared infrastructure across all vertical layers.

Core modules:

- configuration center
- unified asset center
- search and retrieval center
- knowledge center
- tagging and relation center
- file and result storage center
- cache and local index center
- activity log center

## Core Workflow

The product main workflow is:

1. select company environment
2. route available capability path
3. create or edit SQL/model/debug content
4. get result via direct execution, portal jump, file import, or manual input
5. analyze result and validate assumptions
6. create incident card if anomaly exists
7. append trace steps, evidence, and conclusions
8. convert outcome into reusable knowledge

Short form:

`environment adapt -> development -> analysis -> traceback -> accumulation`

## Adapter Strategy

The system should not assume direct database access. Adapter design must support multiple company realities.

Recommended adapter modes:

- `Direct Adapter`
- `Portal Adapter`
- `Clipboard Adapter`
- `File Adapter`
- `Manual Adapter`

Each environment exposes a capability matrix rather than a fixed technical integration contract.

Example capability levels:

- `L0`: unsupported
- `L1`: manual or jump only
- `L2`: semi-automatic
- `L3`: structured automatic support

## Main Pages

Recommended navigation:

- Home
- Environment Routing
- Modeling and Development
- Analysis and Traceback
- Knowledge Assets
- Settings

Most important MVP pages:

- SQL Workspace
- Incident Detail Page

## Boundary Principles

The system should follow these boundaries:

- do not attempt to bypass company security boundaries
- prefer storing work context over storing raw company data
- support local accumulation of methods, notes, templates, and links
- keep external company resources as references when direct integration is not available
