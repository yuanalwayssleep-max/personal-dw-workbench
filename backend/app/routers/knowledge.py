from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.response import ok
from app.schemas.business_glossary import BusinessGlossaryCreate, BusinessGlossaryUpdate
from app.schemas.knowledge import KnowledgeNoteCreate, KnowledgeNoteRead
from app.schemas.knowledge_standard import KnowledgeStandardCreate, KnowledgeStandardUpdate
from app.schemas.metric_definition import MetricDefinitionCreate, MetricDefinitionUpdate
from app.services.business_glossary_service import BusinessGlossaryService
from app.services.knowledge_service import KnowledgeService
from app.services.knowledge_standard_service import KnowledgeStandardService
from app.services.metric_definition_service import MetricDefinitionService

router = APIRouter(tags=["knowledge"])
service = KnowledgeService()
standard_service = KnowledgeStandardService()
glossary_service = BusinessGlossaryService()
metric_service = MetricDefinitionService()


@router.get("/knowledge-notes")
def list_knowledge_notes(db: Session = Depends(get_db)):
    items = [KnowledgeNoteRead.model_validate(item).model_dump() for item in service.list_notes(db)]
    return ok({"items": items})


@router.post("/knowledge-notes")
def create_knowledge_note(payload: KnowledgeNoteCreate, db: Session = Depends(get_db)):
    item = service.create_note(db, payload)
    return ok(KnowledgeNoteRead.model_validate(item).model_dump())


@router.get("/knowledge-standards")
def list_knowledge_standards(db: Session = Depends(get_db)):
    return ok({"items": [item.model_dump() for item in standard_service.list_standards(db)]})


@router.get("/knowledge-standards/{standard_id}")
def get_knowledge_standard(standard_id: int, db: Session = Depends(get_db)):
    item = standard_service.get_standard(db, standard_id)
    return ok(item.model_dump())


@router.get("/knowledge-standards/{standard_id}/history")
def list_knowledge_standard_history(standard_id: int, db: Session = Depends(get_db)):
    return ok({"items": [item.model_dump() for item in standard_service.list_history(db, standard_id)]})


@router.post("/knowledge-standards")
def create_knowledge_standard(payload: KnowledgeStandardCreate, db: Session = Depends(get_db)):
    item = standard_service.create_standard(db, payload)
    return ok(item.model_dump())


@router.put("/knowledge-standards/{standard_id}")
def update_knowledge_standard(standard_id: int, payload: KnowledgeStandardUpdate, db: Session = Depends(get_db)):
    item = standard_service.update_standard(db, standard_id, payload)
    return ok(item.model_dump())


@router.delete("/knowledge-standards/{standard_id}", status_code=204)
def delete_knowledge_standard(standard_id: int, db: Session = Depends(get_db)):
    standard_service.delete_standard(db, standard_id)
    return Response(status_code=204)


@router.get("/business-glossaries")
def list_business_glossaries(db: Session = Depends(get_db)):
    return ok({"items": [item.model_dump() for item in glossary_service.list_glossaries(db)]})


@router.get("/business-glossaries/{glossary_id}")
def get_business_glossary(glossary_id: int, db: Session = Depends(get_db)):
    item = glossary_service.get_glossary(db, glossary_id)
    return ok(item.model_dump())


@router.get("/business-glossaries/{glossary_id}/history")
def list_business_glossary_history(glossary_id: int, db: Session = Depends(get_db)):
    return ok({"items": [item.model_dump() for item in glossary_service.list_history(db, glossary_id)]})


@router.post("/business-glossaries")
def create_business_glossary(payload: BusinessGlossaryCreate, db: Session = Depends(get_db)):
    item = glossary_service.create_glossary(db, payload)
    return ok(item.model_dump())


@router.put("/business-glossaries/{glossary_id}")
def update_business_glossary(glossary_id: int, payload: BusinessGlossaryUpdate, db: Session = Depends(get_db)):
    item = glossary_service.update_glossary(db, payload=payload, glossary_id=glossary_id)
    return ok(item.model_dump())


@router.delete("/business-glossaries/{glossary_id}", status_code=204)
def delete_business_glossary(glossary_id: int, db: Session = Depends(get_db)):
    glossary_service.delete_glossary(db, glossary_id)
    return Response(status_code=204)


@router.get("/metric-definitions")
def list_metric_definitions(db: Session = Depends(get_db)):
    return ok({"items": [item.model_dump() for item in metric_service.list_metrics(db)]})


@router.get("/metric-definitions/{metric_id}")
def get_metric_definition(metric_id: int, db: Session = Depends(get_db)):
    item = metric_service.get_metric(db, metric_id)
    return ok(item.model_dump())


@router.get("/metric-definitions/{metric_id}/history")
def list_metric_definition_history(metric_id: int, db: Session = Depends(get_db)):
    return ok({"items": [item.model_dump() for item in metric_service.list_history(db, metric_id)]})


@router.post("/metric-definitions")
def create_metric_definition(payload: MetricDefinitionCreate, db: Session = Depends(get_db)):
    item = metric_service.create_metric(db, payload)
    return ok(item.model_dump())


@router.put("/metric-definitions/{metric_id}")
def update_metric_definition(metric_id: int, payload: MetricDefinitionUpdate, db: Session = Depends(get_db)):
    item = metric_service.update_metric(db, metric_id, payload)
    return ok(item.model_dump())


@router.delete("/metric-definitions/{metric_id}", status_code=204)
def delete_metric_definition(metric_id: int, db: Session = Depends(get_db)):
    metric_service.delete_metric(db, metric_id)
    return Response(status_code=204)


@router.post("/incidents/{incident_id}/generate-knowledge-note")
def generate_knowledge_note(incident_id: int, db: Session = Depends(get_db)):
    item = service.generate_from_incident(db, incident_id)
    return ok(KnowledgeNoteRead.model_validate(item).model_dump())
