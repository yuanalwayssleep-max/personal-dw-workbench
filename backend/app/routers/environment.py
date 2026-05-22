from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.response import ok
from app.schemas.environment import EnvironmentCreate, EnvironmentDetailRead, EnvironmentRead, EnvironmentUpdate
from app.services.environment_service import EnvironmentService

router = APIRouter(tags=["environment"])
service = EnvironmentService()


@router.get("/environments")
def list_environments(db: Session = Depends(get_db)):
    items = [EnvironmentRead.model_validate(item).model_dump() for item in service.list_environments(db)]
    return ok({"items": items})


@router.get("/environments/{environment_id}")
def get_environment(environment_id: int, db: Session = Depends(get_db)):
    environment = service.get_environment(db, environment_id)
    if environment is None:
        return ok(None, message="environment not found")
    return ok(EnvironmentDetailRead.model_validate(environment).model_dump())


@router.get("/environments/{environment_id}/entrypoints")
def get_environment_entrypoints(environment_id: int, db: Session = Depends(get_db)):
    environment = service.get_environment(db, environment_id)
    if environment is None:
        return ok({"items": []}, message="environment not found")
    items = [entry.model_dump() for entry in EnvironmentDetailRead.model_validate(environment).entrypoints]
    return ok({"items": items})


@router.get("/environments/{environment_id}/capabilities")
def get_environment_capabilities(environment_id: int, db: Session = Depends(get_db)):
    environment = service.get_environment(db, environment_id)
    if environment is None:
        return ok({"items": []}, message="environment not found")
    items = [cap.model_dump() for cap in EnvironmentDetailRead.model_validate(environment).capabilities]
    return ok({"items": items})


@router.post("/environments")
def create_environment(payload: EnvironmentCreate, db: Session = Depends(get_db)):
    item = service.create_environment(db, payload)
    return ok(EnvironmentRead.model_validate(item).model_dump())


@router.get("/environments/{environment_id}/history")
def list_environment_history(environment_id: int, db: Session = Depends(get_db)):
    return ok({"items": [item.model_dump() for item in service.list_history(db, environment_id)]})


@router.put("/environments/{environment_id}")
def update_environment(environment_id: int, payload: EnvironmentUpdate, db: Session = Depends(get_db)):
    item = service.update_environment(db, environment_id, payload)
    return ok(EnvironmentRead.model_validate(item).model_dump())


@router.delete("/environments/{environment_id}", status_code=204)
def delete_environment(environment_id: int, db: Session = Depends(get_db)):
    service.delete_environment(db, environment_id)
    return Response(status_code=204)
