from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.response import ok
from app.schemas.incident import (
    IncidentCreate,
    IncidentLinkCreate,
    IncidentLinkRead,
    IncidentRead,
    IncidentStatusUpdate,
    IncidentUpdate,
    TraceStepCreate,
    TraceStepRead,
    TraceStepUpdate,
)
from app.services.incident_service import IncidentService

router = APIRouter(tags=["incident"])
service = IncidentService()


@router.get("/incidents")
def list_incidents(db: Session = Depends(get_db)):
    items = [IncidentRead.model_validate(item).model_dump() for item in service.list_incidents(db)]
    return ok({"items": items})


@router.get("/incidents/{incident_id}")
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    item = service.get_incident(db, incident_id)
    return ok(IncidentRead.model_validate(item).model_dump())


@router.post("/incidents")
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    item = service.create_incident(db, payload)
    return ok(IncidentRead.model_validate(item).model_dump())


@router.put("/incidents/{incident_id}")
def update_incident(incident_id: int, payload: IncidentUpdate, db: Session = Depends(get_db)):
    item = service.update_incident(db, incident_id, payload)
    return ok(IncidentRead.model_validate(item).model_dump())


@router.post("/incidents/{incident_id}/status")
def update_incident_status(incident_id: int, payload: IncidentStatusUpdate, db: Session = Depends(get_db)):
    item = service.update_status(db, incident_id, payload.status)
    return ok(IncidentRead.model_validate(item).model_dump())


@router.post("/incidents/{incident_id}/trace-steps")
def create_trace_step(incident_id: int, payload: TraceStepCreate, db: Session = Depends(get_db)):
    item = service.create_trace_step(db, incident_id, payload)
    return ok(TraceStepRead.model_validate(item).model_dump())


@router.get("/incidents/{incident_id}/trace-steps")
def list_trace_steps(incident_id: int, db: Session = Depends(get_db)):
    items = [TraceStepRead.model_validate(item).model_dump() for item in service.list_trace_steps(db, incident_id)]
    return ok({"items": items})


@router.put("/incidents/{incident_id}/trace-steps/{step_id}")
def update_trace_step(incident_id: int, step_id: int, payload: TraceStepUpdate, db: Session = Depends(get_db)):
    item = service.update_trace_step(db, incident_id, step_id, payload)
    return ok(TraceStepRead.model_validate(item).model_dump())


@router.post("/incidents/{incident_id}/links")
def create_incident_link(incident_id: int, payload: IncidentLinkCreate, db: Session = Depends(get_db)):
    item = service.create_link(db, incident_id, payload)
    return ok(IncidentLinkRead.model_validate(item).model_dump())


@router.get("/incidents/{incident_id}/links")
def list_incident_links(incident_id: int, db: Session = Depends(get_db)):
    items = [IncidentLinkRead.model_validate(item).model_dump() for item in service.list_links(db, incident_id)]
    return ok({"items": items})
