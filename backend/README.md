# Backend

## Overview

This backend is the MVP FastAPI service for the Personal DW Workbench project.

Current scope:

- environment APIs
- SQL workspace APIs
- incident APIs
- knowledge note APIs
- dashboard API
- search API

## Setup

### 1. Create virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Default development mode uses SQLite:

```bash
DATABASE_URL=sqlite:///./personal_dw_workbench.db
```

If you want PostgreSQL later, update `DATABASE_URL` manually.

### 3. Initialize database schema

For SQLite development mode:

```bash
source .venv/bin/activate
python init_db.py
python seed_data.py
```

For PostgreSQL mode, you can still use:

```bash
psql -U postgres -d personal_dw_workbench -f ../sql/init_schema.sql
```

## Run

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Health Check

```bash
curl http://127.0.0.1:8000/health
```

## Notes

- The current implementation focuses on project skeleton and MVP routes.
- Some modules still use simple repository logic and will need stronger filtering, validation, and error handling in later iterations.
- SQLite is recommended for local MVP validation when PostgreSQL is not available.
- `seed_data.py` inserts one demo environment, one SQL asset, one incident, and one knowledge note for local testing.
