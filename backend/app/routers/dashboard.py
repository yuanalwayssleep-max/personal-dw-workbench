from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.response import ok
from app.services.environment_service import EnvironmentService
from app.services.incident_service import IncidentService
from app.services.knowledge_service import KnowledgeService
from app.services.sql_workspace_service import SqlWorkspaceService

router = APIRouter(tags=["dashboard"])

environment_service = EnvironmentService()
sql_service = SqlWorkspaceService()
incident_service = IncidentService()
knowledge_service = KnowledgeService()


@router.get("/dashboard/home")
def get_home_dashboard(db: Session = Depends(get_db)):
    environments = environment_service.list_environments(db)
    sql_assets = sql_service.list_sql_assets(db)
    incidents = incident_service.list_incidents(db)
    notes = knowledge_service.list_notes(db)
    return ok(
        {
            "current_environment": environments[0].id if environments else None,
            "recent_sql_assets": [{"id": item.id, "title": item.title} for item in sql_assets[:5]],
            "pending_incidents": [{"id": item.id, "title": item.title, "status": item.status} for item in incidents[:5]],
            "recent_notes": [{"id": item.id, "title": item.title} for item in notes[:5]],
        }
    )
