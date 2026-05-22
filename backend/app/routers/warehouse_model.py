from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.response import ok
from app.schemas.warehouse_model import WarehouseModelCreate, WarehouseModelUpdate
from app.services.warehouse_model_service import WarehouseModelService

router = APIRouter(tags=["warehouse-model"])
service = WarehouseModelService()


@router.get("/warehouse-models")
def list_warehouse_models(db: Session = Depends(get_db)):
    return ok({"items": [item.model_dump() for item in service.list_models(db)]})


@router.get("/warehouse-models/{model_id}")
def get_warehouse_model(model_id: int, db: Session = Depends(get_db)):
    return ok(service.get_model(db, model_id).model_dump())


@router.get("/warehouse-models/{model_id}/history")
def list_warehouse_model_history(model_id: int, db: Session = Depends(get_db)):
    return ok({"items": [item.model_dump() for item in service.list_history(db, model_id)]})


@router.post("/warehouse-models")
def create_warehouse_model(payload: WarehouseModelCreate, db: Session = Depends(get_db)):
    return ok(service.create_model(db, payload).model_dump())


@router.put("/warehouse-models/{model_id}")
def update_warehouse_model(model_id: int, payload: WarehouseModelUpdate, db: Session = Depends(get_db)):
    return ok(service.update_model(db, model_id, payload).model_dump())


@router.delete("/warehouse-models/{model_id}", status_code=204)
def delete_warehouse_model(model_id: int, db: Session = Depends(get_db)):
    service.delete_model(db, model_id)
    return Response(status_code=204)
