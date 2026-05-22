from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.knowledge import MetricDefinition
from app.repositories.company_repo import CompanyRepository
from app.repositories.metric_definition_repo import MetricDefinitionRepository
from app.repositories.project_repo import ProjectRepository
from app.services.history_service import HistoryService, format_history_description
from app.schemas.metric_definition import MetricDefinitionCreate, MetricDefinitionRead, MetricDefinitionUpdate


class MetricDefinitionService:
    def __init__(self) -> None:
        self.repo = MetricDefinitionRepository()
        self.company_repo = CompanyRepository()
        self.history_service = HistoryService()
        self.project_repo = ProjectRepository()

    def list_metrics(self, db: Session) -> list[MetricDefinitionRead]:
        return [self._to_read(item, db) for item in self.repo.list(db)]

    def get_metric(self, db: Session, metric_id: int) -> MetricDefinitionRead:
        metric = self.repo.get(db, metric_id)
        if metric is None:
            raise HTTPException(status_code=404, detail="指标定义不存在")
        return self._to_read(metric, db)

    def create_metric(self, db: Session, payload: MetricDefinitionCreate) -> MetricDefinitionRead:
        company_name = self._normalize_company_name(payload.company_name)
        self._validate_company_and_projects(db, company_name, payload.project_ids)
        self._validate_duplicate(db, payload.metric_name, payload.metric_code, company_name)
        metric = MetricDefinition(
            metric_name=payload.metric_name.strip(),
            metric_code=payload.metric_code.strip(),
            field_type=payload.field_type.strip(),
            business_domain=payload.business_domain.strip(),
            metric_category=payload.metric_category.strip(),
            company_name=company_name,
            definition=payload.definition.strip(),
            calculation_rule=payload.calculation_rule.strip(),
            time_granularity=payload.time_granularity.strip(),
            unit=(payload.unit or "").strip() or None,
            note=(payload.note or "").strip() or None,
        )
        metric = self.repo.create(db, metric)
        self.repo.sync_project_links(db, metric.id, payload.project_ids)
        self.history_service.log(
            db,
            entity_type="metric_definition",
            entity_key=metric.id,
            action="create",
            title=metric.metric_name,
            description=format_history_description(action_label="创建", entity_label="指标定义", summary=f"指标编码：{metric.metric_code}"),
        )
        db.commit()
        metric = self.repo.get(db, metric.id)
        if metric is None:
            raise HTTPException(status_code=500, detail="指标定义创建失败")
        return self._to_read(metric, db)

    def update_metric(self, db: Session, metric_id: int, payload: MetricDefinitionUpdate) -> MetricDefinitionRead:
        metric = self.repo.get(db, metric_id)
        if metric is None:
            raise HTTPException(status_code=404, detail="指标定义不存在")
        company_name = self._normalize_company_name(payload.company_name)
        self._validate_company_and_projects(db, company_name, payload.project_ids)
        self._validate_duplicate(db, payload.metric_name, payload.metric_code, company_name, exclude_id=metric_id)
        metric.metric_name = payload.metric_name.strip()
        metric.metric_code = payload.metric_code.strip()
        metric.field_type = payload.field_type.strip()
        metric.business_domain = payload.business_domain.strip()
        metric.metric_category = payload.metric_category.strip()
        metric.company_name = company_name
        metric.definition = payload.definition.strip()
        metric.calculation_rule = payload.calculation_rule.strip()
        metric.time_granularity = payload.time_granularity.strip()
        metric.unit = (payload.unit or "").strip() or None
        metric.note = (payload.note or "").strip() or None
        metric.updated_at = datetime.utcnow()
        self.repo.update(db, metric)
        self.repo.sync_project_links(db, metric_id, payload.project_ids)
        self.history_service.log(
            db,
            entity_type="metric_definition",
            entity_key=metric_id,
            action="update",
            title=metric.metric_name,
            description=format_history_description(action_label="更新", entity_label="指标定义", summary=f"指标编码：{metric.metric_code}"),
        )
        db.commit()
        metric = self.repo.get(db, metric_id)
        if metric is None:
            raise HTTPException(status_code=500, detail="指标定义更新失败")
        return self._to_read(metric, db)

    def delete_metric(self, db: Session, metric_id: int) -> None:
        metric = self.repo.get(db, metric_id)
        if metric is None:
            raise HTTPException(status_code=404, detail="指标定义不存在")
        self.history_service.log(
            db,
            entity_type="metric_definition",
            entity_key=metric_id,
            action="delete",
            title=metric.metric_name,
            description=format_history_description(action_label="删除", entity_label="指标定义", summary=f"指标编码：{metric.metric_code}"),
        )
        db.delete(metric)
        db.commit()

    def _normalize_company_name(self, company_name: str | None) -> str | None:
        return (company_name or "").strip() or None

    def _validate_company_and_projects(self, db: Session, company_name: str | None, project_ids: list[str]) -> None:
        if company_name and self.company_repo.get_by_name(db, company_name) is None:
            raise HTTPException(status_code=400, detail="所属公司不存在")
        if not project_ids:
            return
        if not company_name:
            raise HTTPException(status_code=400, detail="选择项目时必须先选择所属公司")
        projects = [self.project_repo.get(db, project_id) for project_id in sorted(set(project_ids))]
        if any(project is None for project in projects):
            raise HTTPException(status_code=400, detail="适用项目不存在")
        if any(project.company_name != company_name for project in projects if project is not None):
            raise HTTPException(status_code=400, detail="适用项目与所属公司不一致")

    def _validate_duplicate(self, db: Session, metric_name: str, metric_code: str, company_name: str | None, exclude_id: int | None = None) -> None:
        normalized_name = metric_name.strip()
        normalized_code = metric_code.strip()
        if not normalized_name:
            raise HTTPException(status_code=400, detail="指标名称不能为空")
        if not normalized_code:
            raise HTTPException(status_code=400, detail="指标编码不能为空")
        for item in self.repo.list(db):
            if exclude_id is not None and item.id == exclude_id:
                continue
            if item.metric_code == normalized_code:
                raise HTTPException(status_code=400, detail="指标编码已存在")
            if item.metric_name == normalized_name and item.company_name == company_name:
                raise HTTPException(status_code=400, detail="同范围下指标名称已存在")

    def _to_read(self, metric: MetricDefinition, db: Session) -> MetricDefinitionRead:
        project_ids = [link.project_id for link in metric.project_links]
        project_names = []
        for project_id in project_ids:
            project = self.project_repo.get(db, project_id)
            if project is not None:
                project_names.append(project.project_name)
        return MetricDefinitionRead(
            id=metric.id,
            metric_name=metric.metric_name,
            metric_code=metric.metric_code,
            field_type=metric.field_type,
            business_domain=metric.business_domain,
            metric_category=metric.metric_category,
            company_name=metric.company_name,
            definition=metric.definition,
            calculation_rule=metric.calculation_rule,
            time_granularity=metric.time_granularity,
            unit=metric.unit,
            note=metric.note,
            project_ids=project_ids,
            project_names=project_names,
            created_at=metric.created_at,
            updated_at=metric.updated_at,
        )

    def list_history(self, db: Session, metric_id: int):
        return self.history_service.list(db, entity_type="metric_definition", entity_key=str(metric_id))
