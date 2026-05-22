from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.common import ORMModel


class IncidentCreate(BaseModel):
    environment_id: int
    title: str
    incident_type: str
    severity: str = "medium"
    status: str = "open"
    symptom_desc: Optional[str] = None
    impact_scope: Optional[str] = None


class IncidentUpdate(BaseModel):
    title: str
    incident_type: str
    severity: str
    status: str
    symptom_desc: Optional[str] = None
    impact_scope: Optional[str] = None
    root_cause: Optional[str] = None
    fix_action: Optional[str] = None
    review_note: Optional[str] = None


class IncidentStatusUpdate(BaseModel):
    status: str


class IncidentRead(ORMModel):
    id: int
    environment_id: int
    title: str
    incident_type: str
    severity: str
    status: str
    symptom_desc: Optional[str] = None
    impact_scope: Optional[str] = None
    root_cause: Optional[str] = None
    fix_action: Optional[str] = None
    review_note: Optional[str] = None
    discovered_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class TraceStepCreate(BaseModel):
    action_type: str
    action_desc: str
    evidence_ref: Optional[str] = None
    intermediate_conclusion: Optional[str] = None


class TraceStepUpdate(BaseModel):
    action_type: str
    action_desc: str
    evidence_ref: Optional[str] = None
    intermediate_conclusion: Optional[str] = None


class TraceStepRead(ORMModel):
    id: int
    incident_id: int
    step_no: int
    action_type: str
    action_desc: str
    evidence_ref: Optional[str] = None
    intermediate_conclusion: Optional[str] = None
    created_at: datetime


class IncidentLinkCreate(BaseModel):
    target_type: str
    target_id: Optional[int] = None
    target_ref: Optional[str] = None
    link_role: Optional[str] = None


class IncidentLinkRead(ORMModel):
    id: int
    incident_id: int
    target_type: str
    target_id: Optional[int] = None
    target_ref: Optional[str] = None
    link_role: Optional[str] = None
    created_at: datetime
