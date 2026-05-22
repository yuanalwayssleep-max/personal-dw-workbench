from __future__ import annotations

from sqlalchemy import inspect, text

from app.core.database import Base, engine
from app.models.artifact import ExternalAssetRef, FileArtifact
from app.models.company import Company
from app.models.environment import CapabilityProfile, EnvironmentEntrypoint, WorkspaceEnvironment
from app.models.history import EntityChangeLog
from app.models.project import ProjectEnvironmentLink, WorkspaceProject
from app.models.incident import IncidentCard, IncidentLink, TraceStep
from app.models.knowledge import (
    BusinessGlossary,
    GlossaryProjectLink,
    KnowledgeNote,
    KnowledgeStandard,
    MetricDefinition,
    MetricProjectLink,
    StandardProjectLink,
)
from app.models.sql_asset import QueryRunRecord, SqlAsset, SqlSnapshot


def main() -> None:
    # Importing the models above registers all tables on Base.metadata.
    _ = (
        Company,
        WorkspaceProject,
        ProjectEnvironmentLink,
        WorkspaceEnvironment,
        EnvironmentEntrypoint,
        CapabilityProfile,
        SqlAsset,
        SqlSnapshot,
        QueryRunRecord,
        IncidentCard,
        TraceStep,
        IncidentLink,
        KnowledgeNote,
        KnowledgeStandard,
        StandardProjectLink,
        BusinessGlossary,
        GlossaryProjectLink,
        MetricDefinition,
        MetricProjectLink,
        FileArtifact,
        ExternalAssetRef,
        EntityChangeLog,
    )
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        columns = {item["name"] for item in inspect(connection).get_columns("workspace_environment")}
        if "environment_type" not in columns:
            connection.execute(
                text("alter table workspace_environment add column environment_type varchar(32) not null default '系统'")
            )
        if "account_name" not in columns:
            connection.execute(text("alter table workspace_environment add column account_name varchar(128)"))
        if "account_password" not in columns:
            connection.execute(text("alter table workspace_environment add column account_password varchar(256)"))
        metric_columns = {item["name"] for item in inspect(connection).get_columns("metric_definition")} if inspect(connection).has_table("metric_definition") else set()
        if metric_columns and "field_type" not in metric_columns:
            connection.execute(text("alter table metric_definition add column field_type varchar(32) not null default 'string'"))
    print("database_initialized")


if __name__ == "__main__":
    main()
