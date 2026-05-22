from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.environment import WorkspaceEnvironment
from app.models.knowledge import KnowledgeStandard
from app.models.project import WorkspaceProject
from app.models.warehouse_model import WarehouseModel
from app.repositories.company_repo import CompanyRepository
from app.services.history_service import HistoryService, format_history_description
from app.schemas.company import CompanyRowRead, CompanyUpsert


class CompanyService:
    def __init__(self) -> None:
        self.repo = CompanyRepository()
        self.history_service = HistoryService()

    def list_companies(self, db: Session) -> list[CompanyRowRead]:
        companies = self.repo.list(db)
        projects = list(db.query(WorkspaceProject).all())
        environments = list(db.query(WorkspaceEnvironment).all())

        return [
            CompanyRowRead(
                companyName=company.company_name,
                projectCount=sum(1 for project in projects if project.company_name == company.company_name),
                environmentCount=sum(
                    1 for environment in environments if environment.company_name == company.company_name
                ),
                networkModes=[company.network_mode],
                projectNames=[
                    project.project_name for project in projects if project.company_name == company.company_name
                ],
                note=company.note,
                updatedAt=company.updated_at,
            )
            for company in companies
        ]

    def create_company(self, db: Session, payload: CompanyUpsert) -> CompanyRowRead:
        company_name = payload.companyName.strip()
        if not company_name:
            raise HTTPException(status_code=400, detail="公司名称不能为空")
        if self.repo.get_by_name(db, company_name) is not None:
            raise HTTPException(status_code=400, detail="公司名称已存在")

        company = Company(
            company_name=company_name,
            network_mode=(payload.networkModes[0] if payload.networkModes else "内网访问"),
            note=(payload.note or "").strip() or None,
        )
        self.repo.create(db, company)
        self.history_service.log(
            db,
            entity_type="company",
            entity_key=company_name,
            action="create",
            title=company_name,
            description=format_history_description(action_label="创建", entity_label="公司", summary=f"网络方式：{company.network_mode}"),
        )
        db.commit()
        return self._get_company_row(db, company_name)

    def update_company(self, db: Session, previous_company_name: str, payload: CompanyUpsert) -> CompanyRowRead:
        company = self.repo.get_by_name(db, previous_company_name)
        if company is None:
            raise HTTPException(status_code=404, detail="公司不存在")

        next_company_name = payload.companyName.strip()
        if not next_company_name:
            raise HTTPException(status_code=400, detail="公司名称不能为空")

        duplicate = self.repo.get_by_name(db, next_company_name)
        if duplicate is not None and duplicate.company_name != previous_company_name:
            raise HTTPException(status_code=400, detail="公司名称已存在")

        company.company_name = next_company_name
        company.network_mode = payload.networkModes[0] if payload.networkModes else "内网访问"
        company.note = (payload.note or "").strip() or None
        company.updated_at = datetime.utcnow()

        projects = list(db.query(WorkspaceProject).filter(WorkspaceProject.company_name == previous_company_name).all())
        environments = list(
            db.query(WorkspaceEnvironment).filter(WorkspaceEnvironment.company_name == previous_company_name).all()
        )
        standards = list(
            db.query(KnowledgeStandard).filter(KnowledgeStandard.company_name == previous_company_name).all()
        )
        models = list(
            db.query(WarehouseModel).filter(WarehouseModel.company_name == previous_company_name).all()
        )
        for project in projects:
            project.company_name = next_company_name
            project.updated_at = datetime.utcnow()
            db.add(project)
        for environment in environments:
            environment.company_name = next_company_name
            environment.updated_at = datetime.utcnow()
            db.add(environment)
        for standard in standards:
            standard.company_name = next_company_name
            standard.updated_at = datetime.utcnow()
            db.add(standard)
        for model in models:
            model.company_name = next_company_name
            model.updated_at = datetime.utcnow()
            db.add(model)

        db.add(company)
        self.history_service.log(
            db,
            entity_type="company",
            entity_key=next_company_name,
            action="update",
            title=next_company_name,
            description=format_history_description(action_label="更新", entity_label="公司", summary=f"网络方式：{company.network_mode}"),
        )
        db.commit()
        return self._get_company_row(db, next_company_name)

    def delete_company(self, db: Session, company_name: str) -> None:
        company = self.repo.get_by_name(db, company_name)
        if company is None:
            raise HTTPException(status_code=404, detail="公司不存在")

        project_count = db.query(WorkspaceProject).filter(WorkspaceProject.company_name == company_name).count()
        environment_count = (
            db.query(WorkspaceEnvironment).filter(WorkspaceEnvironment.company_name == company_name).count()
        )
        standard_count = db.query(KnowledgeStandard).filter(KnowledgeStandard.company_name == company_name).count()
        model_count = db.query(WarehouseModel).filter(WarehouseModel.company_name == company_name).count()
        if project_count or environment_count or standard_count or model_count:
            raise HTTPException(status_code=400, detail="公司下仍有项目、环境、规范标准或模型，不能删除")

        self.history_service.log(
            db,
            entity_type="company",
            entity_key=company_name,
            action="delete",
            title=company_name,
            description=format_history_description(action_label="删除", entity_label="公司"),
        )
        db.delete(company)
        db.commit()

    def _get_company_row(self, db: Session, company_name: str) -> CompanyRowRead:
        return next(item for item in self.list_companies(db) if item.companyName == company_name)

    def list_history(self, db: Session, company_name: str):
        return self.history_service.list(db, entity_type="company", entity_key=company_name)
