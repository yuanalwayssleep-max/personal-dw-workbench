from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.company import Company


class CompanyRepository:
    def list(self, db: Session) -> list[Company]:
        stmt = select(Company).order_by(Company.id.asc())
        return list(db.scalars(stmt).all())

    def get_by_name(self, db: Session, company_name: str) -> Optional[Company]:
        stmt = select(Company).where(Company.company_name == company_name)
        return db.scalar(stmt)

    def create(self, db: Session, company: Company) -> Company:
        db.add(company)
        db.commit()
        db.refresh(company)
        return company

    def update(self, db: Session, company: Company) -> Company:
        db.add(company)
        db.commit()
        db.refresh(company)
        return company
