from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.response import ok
from app.schemas.project import WorkspaceProjectCreate, WorkspaceProjectUpdate
from app.services.project_service import ProjectService

router = APIRouter(tags=["project"])
service = ProjectService()


@router.get("/projects")
def list_projects(db: Session = Depends(get_db)):
    return ok({"items": [item.model_dump() for item in service.list_projects(db)]})


@router.post("/projects")
def create_project(payload: WorkspaceProjectCreate, db: Session = Depends(get_db)):
    item = service.create_project(db, payload)
    return ok(item.model_dump())


@router.get("/projects/{project_id}/history")
def list_project_history(project_id: str, db: Session = Depends(get_db)):
    return ok({"items": [item.model_dump() for item in service.list_history(db, project_id)]})


@router.put("/projects/{project_id}")
def update_project(project_id: str, payload: WorkspaceProjectUpdate, db: Session = Depends(get_db)):
    item = service.update_project(db, project_id, payload)
    return ok(item.model_dump())


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    service.delete_project(db, project_id)
    return Response(status_code=204)
