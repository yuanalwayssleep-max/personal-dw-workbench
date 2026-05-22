from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete

from app.core.database import SessionLocal
from app.models.company import Company
from app.models.environment import CapabilityProfile, EnvironmentEntrypoint, WorkspaceEnvironment
from app.models.incident import IncidentCard, IncidentLink, TraceStep
from app.models.knowledge import (
    BusinessGlossary,
    GlossaryProjectLink,
    KnowledgeNote,
    KnowledgeStandard,
    MetricDefinition,
    MetricProjectLink,
    StandardProjectLink,
)
from app.models.project import ProjectEnvironmentLink, WorkspaceProject
from app.models.sql_asset import QueryRunRecord, SqlAsset, SqlSnapshot


def main() -> None:
    db = SessionLocal()
    try:
        db.execute(delete(IncidentLink))
        db.execute(delete(TraceStep))
        db.execute(delete(IncidentCard))
        db.execute(delete(QueryRunRecord))
        db.execute(delete(SqlSnapshot))
        db.execute(delete(SqlAsset))
        db.execute(delete(KnowledgeNote))
        db.execute(delete(GlossaryProjectLink))
        db.execute(delete(BusinessGlossary))
        db.execute(delete(MetricProjectLink))
        db.execute(delete(MetricDefinition))
        db.execute(delete(StandardProjectLink))
        db.execute(delete(KnowledgeStandard))
        db.execute(delete(CapabilityProfile))
        db.execute(delete(EnvironmentEntrypoint))
        db.execute(delete(ProjectEnvironmentLink))
        db.execute(delete(WorkspaceProject))
        db.execute(delete(WorkspaceEnvironment))
        db.execute(delete(Company))
        db.commit()

        company = Company(company_name="Demo Company", network_mode="内网访问", note="演示公司")
        db.add(company)
        db.flush()

        environment = WorkspaceEnvironment(
            environment_code="demo_company_prod",
            company_name="Demo Company",
            environment_name="Production",
            environment_type="系统",
            account_name="demo_user",
            account_password="demo_password",
            network_mode="内网访问",
            dialect="Hive",
            timezone="Asia/Shanghai",
            description="Demo environment for local MVP validation.",
            is_active=True,
        )
        db.add(environment)
        db.flush()

        project_a = WorkspaceProject(
            id="proj-new-media",
            project_name="新媒体数仓",
            company_name="Demo Company",
            description="面向内容、投放和账号经营分析的项目工作区。",
        )
        project_b = WorkspaceProject(
            id="proj-growth-center",
            project_name="增长经营数仓",
            company_name="Demo Company",
            description="面向经营分析、增长复盘和策略追踪的项目工作区。",
        )
        db.add_all([project_a, project_b])
        db.flush()

        db.add(ProjectEnvironmentLink(project_id=project_a.id, environment_id=environment.id))
        db.add(ProjectEnvironmentLink(project_id=project_b.id, environment_id=environment.id))

        entrypoints = [
            EnvironmentEntrypoint(
                environment_id=environment.id,
                entry_type="query_portal",
                entry_name="Query Portal",
                entry_url="https://demo.company/query",
                description="Internal SQL query portal",
                display_order=1,
            ),
            EnvironmentEntrypoint(
                environment_id=environment.id,
                entry_type="task_portal",
                entry_name="Task Portal",
                entry_url="https://demo.company/task",
                description="Internal task scheduling portal",
                display_order=2,
            ),
            EnvironmentEntrypoint(
                environment_id=environment.id,
                entry_type="log_portal",
                entry_name="Log Portal",
                entry_url="https://demo.company/log",
                description="Internal task log portal",
                display_order=3,
            ),
        ]
        db.add_all(entrypoints)

        capabilities = [
            CapabilityProfile(
                environment_id=environment.id,
                capability_type="query",
                capability_level="L1",
                source_type="web",
                adapter_key="portal_query_adapter",
                config_json={"mode": "copy_execute"},
            ),
            CapabilityProfile(
                environment_id=environment.id,
                capability_type="task",
                capability_level="L2",
                source_type="web",
                adapter_key="portal_task_adapter",
                config_json={"mode": "jump_and_view"},
            ),
        ]
        db.add_all(capabilities)

        sql_asset = SqlAsset(
            environment_id=environment.id,
            title="Order Summary Drop Check",
            sql_type="debug",
            dialect="hive",
            summary="Check whether ads order summary row count drops abnormally.",
            tags={"domain": "order", "scene": "debug"},
            is_favorite=True,
            status="active",
            source_type="manual",
            content=(
                "select dt, count(1) as row_cnt\n"
                "from ads_order_summary_di\n"
                "where dt >= date_sub('${bizdate}', 7)\n"
                "group by dt\n"
                "order by dt desc;"
            ),
        )
        db.add(sql_asset)
        db.flush()

        db.add(
            SqlSnapshot(
                sql_asset_id=sql_asset.id,
                version_no=1,
                content=sql_asset.content,
                change_note="Initial seed snapshot",
            )
        )

        query_run = QueryRunRecord(
            environment_id=environment.id,
            sql_asset_id=sql_asset.id,
            run_mode="copy_execute",
            run_status="success",
            result_type="manual_summary",
            result_ref="https://demo.company/query/history/1001",
            result_summary="Order summary row count dropped 35 percent on 2026-05-18.",
            row_count=8,
            error_message=None,
            executed_at=datetime.utcnow(),
        )
        db.add(query_run)
        db.flush()

        incident = IncidentCard(
            environment_id=environment.id,
            title="ads_order_summary_di Row Count Drop",
            incident_type="data_anomaly",
            severity="high",
            status="investigating",
            symptom_desc="Row count dropped 35 percent compared with the previous day.",
            impact_scope="Affects the daily order dashboard and downstream monitoring.",
            root_cause="Upstream dws partition was not generated on time.",
            fix_action="Re-run upstream task and backfill missing partition.",
            review_note="Need a reusable partition check template for this domain.",
            discovered_at=datetime.utcnow(),
        )
        db.add(incident)
        db.flush()

        db.add_all(
            [
                TraceStep(
                    incident_id=incident.id,
                    step_no=1,
                    action_type="check_sql",
                    action_desc="Compare ads row count for the last 7 days.",
                    evidence_ref="sql_asset:1",
                    intermediate_conclusion="Confirmed a visible row count drop on 2026-05-18.",
                ),
                TraceStep(
                    incident_id=incident.id,
                    step_no=2,
                    action_type="check_task",
                    action_desc="Open upstream task run page and inspect partition generation.",
                    evidence_ref="https://demo.company/task/run/2001",
                    intermediate_conclusion="Found missing upstream partition for the same date.",
                ),
            ]
        )

        db.add_all(
            [
                IncidentLink(
                    incident_id=incident.id,
                    target_type="sql_asset",
                    target_id=sql_asset.id,
                    target_ref=None,
                    link_role="primary",
                ),
                IncidentLink(
                    incident_id=incident.id,
                    target_type="query_run",
                    target_id=query_run.id,
                    target_ref=None,
                    link_role="evidence",
                ),
            ]
        )

        db.add(
            KnowledgeNote(
                environment_id=environment.id,
                title="Partition Missing Troubleshooting SOP",
                note_type="troubleshooting",
                summary="Checklist for partition missing issues in ADS tables.",
                source_type="manual",
                content=(
                    "1. Compare row count over recent partitions.\n"
                    "2. Confirm upstream task completion.\n"
                    "3. Inspect missing partitions in DWS and DWD layers.\n"
                    "4. Re-run upstream partition and verify downstream recovery."
                ),
            )
        )

        standards = [
            KnowledgeStandard(
                standard_name="ADS表命名规范",
                standard_type="命名规范",
                company_name="Demo Company",
                status="生效中",
                rule_content="ADS层表统一以 ads_ 作为前缀，后接业务域、主题名和周期后缀。",
                positive_example="ads_trade_order_summary_di",
                negative_example="tradeAdsSummary",
                note="适用于离线导出层命名。",
            ),
            KnowledgeStandard(
                standard_name="分区字段规范",
                standard_type="字段规范",
                company_name=None,
                status="生效中",
                rule_content="日分区表统一使用 dt 作为分区字段，格式为 yyyy-MM-dd。",
                positive_example="dt='2026-05-19'",
                negative_example="date='20260519'",
                note="适用于通用离线明细和汇总表。",
            ),
        ]
        db.add_all(standards)
        db.flush()
        db.add(StandardProjectLink(standard_id=standards[0].id, project_id=project_a.id))

        glossaries = [
            BusinessGlossary(
                glossary_name="有效线索",
                business_domain="线索",
                company_name="Demo Company",
                definition="满足去重、可触达且进入分配流程的线索定义为有效线索。",
                statistical_scope="仅统计当日新增并通过规则校验的线索。",
                data_source="dwd_clue_detail_di, ads_clue_summary_di",
                note="用于新媒体获客投放效果评估。",
            ),
            BusinessGlossary(
                glossary_name="成交用户",
                business_domain="交易",
                company_name=None,
                definition="在统计周期内产生首笔有效支付订单的用户定义为成交用户。",
                statistical_scope="排除退款关闭订单，仅保留支付成功订单。",
                data_source="dwd_order_pay_success_di",
                note="通用交易域口径。",
            ),
        ]
        db.add_all(glossaries)
        db.flush()
        db.add(GlossaryProjectLink(glossary_id=glossaries[0].id, project_id=project_a.id))

        metrics = [
            MetricDefinition(
                metric_name="成交用户数",
                metric_code="metric_pay_user_cnt",
                field_type="bigint",
                business_domain="交易",
                metric_category="规模指标",
                company_name="Demo Company",
                definition="统计周期内产生有效支付订单的去重用户数。",
                calculation_rule="count(distinct pay_user_id)",
                time_granularity="日",
                unit="人",
                note="用于交易规模分析。",
            ),
            MetricDefinition(
                metric_name="线索转化率",
                metric_code="metric_clue_convert_rate",
                field_type="decimal(18,4)",
                business_domain="线索",
                metric_category="转化指标",
                company_name=None,
                definition="统计周期内成交线索数 / 有效线索数。",
                calculation_rule="成交线索数 / 有效线索数",
                time_granularity="日",
                unit="%",
                note="通用线索转化指标。",
            ),
        ]
        db.add_all(metrics)
        db.flush()
        db.add(MetricProjectLink(metric_id=metrics[0].id, project_id=project_a.id))

        db.commit()
        print("seed_completed")
    finally:
        db.close()


if __name__ == "__main__":
    main()
