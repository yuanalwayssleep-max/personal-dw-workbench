from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.core.database import Base, engine
from app.models.company import Company
from app.models.environment import CapabilityProfile, EnvironmentEntrypoint, WorkspaceEnvironment
from app.models.history import EntityChangeLog
from app.models.incident import IncidentCard, IncidentLink, TraceStep
from app.models.knowledge import BusinessGlossary, GlossaryProjectLink, KnowledgeNote, KnowledgeStandard, MetricDefinition, MetricProjectLink, StandardProjectLink
from app.models.project import ProjectEnvironmentLink, WorkspaceProject
from app.models.sql_asset import QueryRunRecord, SqlAsset, SqlSnapshot
from app.models.warehouse_model import WarehouseModel, WarehouseModelProjectLink
from app.routers import company, dashboard, environment, incident, knowledge, project, search, sql_workspace, warehouse_model


def create_app() -> FastAPI:
    _ = (
        Company, WorkspaceProject, ProjectEnvironmentLink, WorkspaceEnvironment, EnvironmentEntrypoint, CapabilityProfile,
        SqlAsset, SqlSnapshot, QueryRunRecord, IncidentCard, TraceStep, IncidentLink, KnowledgeNote, KnowledgeStandard,
        StandardProjectLink, BusinessGlossary, GlossaryProjectLink, MetricDefinition, MetricProjectLink, EntityChangeLog,
        WarehouseModel, WarehouseModelProjectLink,
    )
    Base.metadata.create_all(bind=engine)
    _run_startup_migrations()

    app = FastAPI(
        title="Personal DW Workbench API",
        version="0.1.0",
        description="MVP backend for the personal data warehouse workbench.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10\.238\.8\.51)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(company.router, prefix="/api/v1")
    app.include_router(project.router, prefix="/api/v1")
    app.include_router(environment.router, prefix="/api/v1")
    app.include_router(sql_workspace.router, prefix="/api/v1")
    app.include_router(incident.router, prefix="/api/v1")
    app.include_router(knowledge.router, prefix="/api/v1")
    app.include_router(warehouse_model.router, prefix="/api/v1")
    app.include_router(dashboard.router, prefix="/api/v1")
    app.include_router(search.router, prefix="/api/v1")

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


def _run_startup_migrations() -> None:
    inspector = inspect(engine)
    if "warehouse_model" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("warehouse_model")}
    missing_columns = {
        "model_database_name": "ALTER TABLE warehouse_model ADD COLUMN model_database_name VARCHAR(128)",
        "model_table_name": "ALTER TABLE warehouse_model ADD COLUMN model_table_name VARCHAR(128)",
        "model_business_domain": "ALTER TABLE warehouse_model ADD COLUMN model_business_domain VARCHAR(64)",
        "model_data_domain": "ALTER TABLE warehouse_model ADD COLUMN model_data_domain VARCHAR(64)",
        "model_layer": "ALTER TABLE warehouse_model ADD COLUMN model_layer VARCHAR(64)",
    }

    with engine.begin() as connection:
        for column_name, ddl in missing_columns.items():
            if column_name not in existing_columns:
                connection.execute(text(ddl))


app = create_app()
