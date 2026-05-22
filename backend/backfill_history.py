from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.database import Base, SessionLocal, engine
from app.models.company import Company
from app.models.environment import WorkspaceEnvironment
from app.models.history import EntityChangeLog
from app.models.knowledge import BusinessGlossary, KnowledgeStandard, MetricDefinition
from app.models.project import WorkspaceProject


@dataclass
class BackfillStats:
    created: int = 0
    skipped: int = 0


def history_exists(db: Session, entity_type: str, entity_key: str) -> bool:
    return (
        db.query(EntityChangeLog)
        .filter(
            EntityChangeLog.entity_type == entity_type,
            EntityChangeLog.entity_key == entity_key,
        )
        .first()
        is not None
    )


def add_initial_log(
    db: Session,
    *,
    entity_type: str,
    entity_key: str,
    title: str,
    description: str,
    created_at: datetime,
    stats: BackfillStats,
) -> None:
    if history_exists(db, entity_type, entity_key):
        stats.skipped += 1
        return

    db.add(
        EntityChangeLog(
            entity_type=entity_type,
            entity_key=entity_key,
            action="init",
            title=title,
            description=description,
            created_at=created_at,
        )
    )
    stats.created += 1


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    stats = BackfillStats()
    try:
        for company in db.query(Company).all():
            add_initial_log(
                db,
                entity_type="company",
                entity_key=company.company_name,
                title=company.company_name,
                description=f"{company.updated_at.strftime('%Y-%m-%d %H:%M')} 初始化公司快照：网络方式：{company.network_mode}",
                created_at=company.updated_at,
                stats=stats,
            )

        for project in db.query(WorkspaceProject).all():
            add_initial_log(
                db,
                entity_type="project",
                entity_key=project.id,
                title=project.project_name,
                description=f"{project.updated_at.strftime('%Y-%m-%d %H:%M')} 初始化项目快照：所属公司：{project.company_name}",
                created_at=project.updated_at,
                stats=stats,
            )

        for environment in db.query(WorkspaceEnvironment).all():
            add_initial_log(
                db,
                entity_type="environment",
                entity_key=str(environment.id),
                title=environment.environment_name,
                description=(
                    f"{environment.updated_at.strftime('%Y-%m-%d %H:%M')} 初始化环境快照："
                    f"所属公司：{environment.company_name}，数据库：{environment.dialect}"
                ),
                created_at=environment.updated_at,
                stats=stats,
            )

        for standard in db.query(KnowledgeStandard).all():
            add_initial_log(
                db,
                entity_type="knowledge_standard",
                entity_key=str(standard.id),
                title=standard.standard_name,
                description=(
                    f"{standard.updated_at.strftime('%Y-%m-%d %H:%M')} 初始化规范标准快照："
                    f"规范类型：{standard.standard_type}"
                ),
                created_at=standard.updated_at,
                stats=stats,
            )

        for glossary in db.query(BusinessGlossary).all():
            add_initial_log(
                db,
                entity_type="business_glossary",
                entity_key=str(glossary.id),
                title=glossary.glossary_name,
                description=(
                    f"{glossary.updated_at.strftime('%Y-%m-%d %H:%M')} 初始化业务口径快照："
                    f"业务域：{glossary.business_domain}"
                ),
                created_at=glossary.updated_at,
                stats=stats,
            )

        for metric in db.query(MetricDefinition).all():
            add_initial_log(
                db,
                entity_type="metric_definition",
                entity_key=str(metric.id),
                title=metric.metric_name,
                description=(
                    f"{metric.updated_at.strftime('%Y-%m-%d %H:%M')} 初始化指标定义快照："
                    f"指标编码：{metric.metric_code}"
                ),
                created_at=metric.updated_at,
                stats=stats,
            )

        db.commit()
        print({"created": stats.created, "skipped": stats.skipped})
    finally:
        db.close()


if __name__ == "__main__":
    main()
