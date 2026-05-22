from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.response import ok
from app.schemas.company import CompanyUpsert
from app.services.company_service import CompanyService

router = APIRouter(tags=["company"])
service = CompanyService()


@router.get("/companies")
def list_companies(db: Session = Depends(get_db)):
    return ok({"items": [item.model_dump() for item in service.list_companies(db)]})


@router.post("/companies")
def create_company(payload: CompanyUpsert, db: Session = Depends(get_db)):
    item = service.create_company(db, payload)
    return ok(item.model_dump())


@router.get("/companies/{company_name}/history")
def list_company_history(company_name: str, db: Session = Depends(get_db)):
    return ok({"items": [item.model_dump() for item in service.list_history(db, company_name)]})


@router.put("/companies/{company_name}")
def update_company(company_name: str, payload: CompanyUpsert, db: Session = Depends(get_db)):
    item = service.update_company(db, company_name, payload)
    return ok(item.model_dump())


@router.delete("/companies/{company_name}", status_code=204)
def delete_company(company_name: str, db: Session = Depends(get_db)):
    service.delete_company(db, company_name)
    return Response(status_code=204)
