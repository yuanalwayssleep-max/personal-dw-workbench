# Personal DW Workbench

## Overview

`Personal DW Workbench` is a personal data warehouse work system for an individual warehouse engineer working across multiple companies and multiple internal environments.

The system focuses on common daily work instead of enterprise-wide platform scope:

- environment switching across companies
- SQL development and reuse
- lightweight modeling drafts
- data analysis and troubleshooting
- issue tracing and experience accumulation

The product principle is:

- personal-first
- cross-company reusable
- lightweight but closed-loop
- no hard dependency on direct database access

## Architecture

The system uses a `three vertical layers plus one horizontal layer` architecture:

- `Capability Routing Layer`
- `Modeling and Code Development Layer`
- `Data Analysis and Issue Traceback Layer`
- `Foundation Support Layer`

Core workflow:

`environment adapt -> modeling/development -> analysis/verification -> issue traceback -> knowledge accumulation`

## Current Document Structure

- `docs/product/02-system-architecture.md`
- `docs/tech/01-data-model.md`
- `docs/tech/02-api-design.md`
- `sql/init_schema.sql`

## MVP Scope

The first version focuses on:

- environment management
- SQL workspace
- query run recording
- incident cards
- trace steps
- knowledge notes
- file and external asset references

## Next Steps

Suggested implementation order:

1. initialize backend project structure
2. create PostgreSQL schema
3. implement environment module
4. implement SQL workspace module
5. implement incident module
6. implement dashboard and search
