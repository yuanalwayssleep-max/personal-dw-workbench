from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.project import WorkspaceProject
from app.models.warehouse_model import WarehouseModel
from app.repositories.company_repo import CompanyRepository
from app.repositories.warehouse_model_repo import WarehouseModelRepository
from app.schemas.warehouse_model import WarehouseModelCreate, WarehouseModelRead, WarehouseModelUpdate
from app.services.history_service import HistoryService, format_history_description


class WarehouseModelService:
    def __init__(self) -> None:
        self.repo = WarehouseModelRepository()
        self.company_repo = CompanyRepository()
        self.history_service = HistoryService()

    def list_models(self, db: Session) -> list[WarehouseModelRead]:
        return [self._to_read(db, item) for item in self.repo.list(db)]

    def get_model(self, db: Session, model_id: int) -> WarehouseModelRead:
        model = self.repo.get(db, model_id)
        if model is None:
            raise HTTPException(status_code=404, detail="模型不存在")
        return self._to_read(db, model)

    def create_model(self, db: Session, payload: WarehouseModelCreate) -> WarehouseModelRead:
        if self.repo.get(db, payload.id) is not None:
            raise HTTPException(status_code=400, detail="模型标识已存在")
        self._validate_company(db, payload.company_name)
        self._validate_model_payload(db, payload.company_name, payload.project_ids, payload.model_code)

        model = WarehouseModel(
            id=payload.id,
            company_name=payload.company_name.strip(),
            model_code=payload.model_code.strip(),
            model_name=payload.model_name.strip(),
            model_database_name=payload.model_database_name.strip(),
            model_table_name=payload.model_table_name.strip(),
            model_business_domain=payload.model_business_domain.strip(),
            model_data_domain=payload.model_data_domain.strip(),
            model_layer=payload.model_layer.strip(),
            layer=payload.layer.strip(),
            subject_domain=payload.subject_domain.strip(),
            model_type=payload.model_type.strip(),
            storage_type=payload.storage_type.strip(),
            table_name=payload.table_name.strip(),
            table_description=payload.table_description.strip(),
            partition_field=(payload.partition_field or "").strip() or None,
            owner=payload.owner.strip() or "当前用户",
            status=payload.status.strip(),
            tags_text=self._join_tags(payload.tags),
            schedule_cycle=payload.schedule_cycle.strip(),
            refresh_mode=payload.refresh_mode.strip(),
            core_metric=(payload.core_metric or "").strip() or None,
            remark=(payload.remark or "").strip() or None,
        )
        self.repo.create(db, model)
        self.repo.sync_project_links(db, model.id, payload.project_ids)
        self.history_service.log(
            db,
            entity_type="warehouse_model",
            entity_key=str(model.id),
            action="create",
            title=model.model_name,
            description=format_history_description(
                action_label="创建",
                entity_label="模型",
                summary=f"模型编码：{model.model_code}，业务域：{model.model_business_domain}，数据域：{model.model_data_domain}",
            ),
        )
        db.commit()
        return self.get_model(db, model.id)

    def update_model(self, db: Session, model_id: int, payload: WarehouseModelUpdate) -> WarehouseModelRead:
        model = self.repo.get(db, model_id)
        if model is None:
            raise HTTPException(status_code=404, detail="模型不存在")

        self._validate_company(db, payload.company_name)
        self._validate_model_payload(db, payload.company_name, payload.project_ids, payload.model_code, exclude_id=model_id)

        model.company_name = payload.company_name.strip()
        model.model_code = payload.model_code.strip()
        model.model_name = payload.model_name.strip()
        model.model_database_name = payload.model_database_name.strip()
        model.model_table_name = payload.model_table_name.strip()
        model.model_business_domain = payload.model_business_domain.strip()
        model.model_data_domain = payload.model_data_domain.strip()
        model.model_layer = payload.model_layer.strip()
        model.layer = payload.layer.strip()
        model.subject_domain = payload.subject_domain.strip()
        model.model_type = payload.model_type.strip()
        model.storage_type = payload.storage_type.strip()
        model.table_name = payload.table_name.strip()
        model.table_description = payload.table_description.strip()
        model.partition_field = (payload.partition_field or "").strip() or None
        model.owner = payload.owner.strip() or "当前用户"
        model.status = payload.status.strip()
        model.tags_text = self._join_tags(payload.tags)
        model.schedule_cycle = payload.schedule_cycle.strip()
        model.refresh_mode = payload.refresh_mode.strip()
        model.core_metric = (payload.core_metric or "").strip() or None
        model.remark = (payload.remark or "").strip() or None
        model.updated_at = datetime.utcnow()

        self.repo.update(db, model)
        self.repo.sync_project_links(db, model.id, payload.project_ids)
        self.history_service.log(
            db,
            entity_type="warehouse_model",
            entity_key=str(model.id),
            action="update",
            title=model.model_name,
            description=format_history_description(
                action_label="更新",
                entity_label="模型",
                summary=f"模型编码：{model.model_code}，业务域：{model.model_business_domain}，状态：{model.status}",
            ),
        )
        db.commit()
        return self.get_model(db, model.id)

    def delete_model(self, db: Session, model_id: int) -> None:
        model = self.repo.get(db, model_id)
        if model is None:
            raise HTTPException(status_code=404, detail="模型不存在")

        self.history_service.log(
            db,
            entity_type="warehouse_model",
            entity_key=str(model.id),
            action="delete",
            title=model.model_name,
            description=format_history_description(
                action_label="删除",
                entity_label="模型",
                summary=f"模型编码：{model.model_code}",
            ),
        )
        db.delete(model)
        db.commit()

    def list_history(self, db: Session, model_id: int):
        return self.history_service.list(db, entity_type="warehouse_model", entity_key=str(model_id))

    def _validate_company(self, db: Session, company_name: str) -> None:
        normalized = company_name.strip()
        if not normalized:
            raise HTTPException(status_code=400, detail="所属公司不能为空")
        if self.company_repo.get_by_name(db, normalized) is None:
            raise HTTPException(status_code=400, detail="所属公司不存在")

    def _validate_model_payload(
        self,
        db: Session,
        company_name: str,
        project_ids: list[str],
        model_code: str,
        exclude_id: int | None = None,
    ) -> None:
        normalized_code = model_code.strip()
        if not normalized_code:
            raise HTTPException(status_code=400, detail="模型英文名不能为空")
        duplicate = self.repo.get_by_code(db, normalized_code)
        if duplicate is not None and duplicate.id != exclude_id:
            raise HTTPException(status_code=400, detail="模型英文名已存在")
        if not project_ids:
            raise HTTPException(status_code=400, detail="至少选择一个所属项目")

        projects = list(db.query(WorkspaceProject).filter(WorkspaceProject.id.in_(project_ids)).all())
        if len(projects) != len(set(project_ids)):
            raise HTTPException(status_code=400, detail="所属项目不存在")
        if any(project.company_name != company_name.strip() for project in projects):
            raise HTTPException(status_code=400, detail="所属项目与公司不一致")

    def _to_read(self, db: Session, model: WarehouseModel) -> WarehouseModelRead:
        project_ids = [link.project_id for link in model.project_links]
        project_names = []
        if project_ids:
            projects = (
                db.query(WorkspaceProject)
                .filter(WorkspaceProject.id.in_(project_ids))
                .all()
            )
            name_map = {project.id: project.project_name for project in projects}
            project_names = [name_map[project_id] for project_id in project_ids if project_id in name_map]

        return WarehouseModelRead(
            id=model.id,
            company_name=model.company_name,
            project_ids=project_ids,
            project_names=project_names,
            model_code=model.model_code,
            model_name=model.model_name,
            model_database_name=model.model_database_name or self._split_table_name(model.table_name)[0],
            model_table_name=model.model_table_name or self._split_table_name(model.table_name)[1],
            model_business_domain=model.model_business_domain or model.subject_domain,
            model_data_domain=model.model_data_domain or model.layer,
            model_layer=model.model_layer or model.model_type,
            layer=model.layer,
            subject_domain=model.subject_domain,
            model_type=model.model_type,
            storage_type=model.storage_type,
            table_name=model.table_name,
            table_description=model.table_description,
            partition_field=model.partition_field,
            owner=model.owner,
            status=model.status,
            tags=self._split_tags(model.tags_text),
            schedule_cycle=model.schedule_cycle,
            refresh_mode=model.refresh_mode,
            core_metric=model.core_metric,
            remark=model.remark,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _join_tags(self, tags: list[str]) -> str | None:
        normalized = [item.strip() for item in tags if item.strip()]
        return "、".join(normalized) if normalized else None

    def _split_tags(self, tags_text: str | None) -> list[str]:
        if not tags_text:
            return []
        return [item.strip() for item in tags_text.split("、") if item.strip()]

    def _split_table_name(self, table_name: str) -> tuple[str, str]:
        if "." in table_name:
            database_name, model_table_name = table_name.split(".", 1)
            return database_name, model_table_name
        return "", table_name
