import type { Environment, ModelSqlDraft, WarehouseModel, WorkspaceProject } from "../../types/api";

function buildModelCode(projectName: string, suffix: string) {
  const normalized = projectName
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${normalized}_${suffix}`;
}

export function createInitialWarehouseModels(projects: WorkspaceProject[]): WarehouseModel[] {
  const now = new Date().toISOString();
  let nextId = 1;

  return projects.flatMap((project) => {
    const baseCode = buildModelCode(project.name, "fact");
    return [
      {
        id: nextId++,
        company_name: project.companyName,
        project_ids: [project.id],
        project_names: [project.name],
        model_code: `${baseCode}_lead_daily`,
        model_name: `${project.name}线索日汇总`,
        model_database_name: "dw_trade",
        model_table_name: `dws_${baseCode}_lead_daily`,
        model_business_domain: "线索",
        model_data_domain: "DWS",
        model_layer: "汇总表",
        layer: "DWS",
        subject_domain: "线索",
        model_type: "汇总表",
        storage_type: "Hive",
        table_name: `dws_${baseCode}_lead_daily`,
        table_description: "沉淀线索日级统计结果，服务经营看板和异常排查。",
        partition_field: "dt",
        owner: "当前用户",
        status: "开发中",
        tags: ["核心", "日报"],
        schedule_cycle: "天",
        refresh_mode: "增量",
        core_metric: "线索量 / 有效线索量",
        remark: "第一版优先保障口径统一和分层规范。",
        created_at: now,
        updated_at: now,
      },
      {
        id: nextId++,
        company_name: project.companyName,
        project_ids: [project.id],
        project_names: [project.name],
        model_code: `${buildModelCode(project.name, "dim")}_channel`,
        model_name: `${project.name}渠道维表`,
        model_database_name: "dw_trade",
        model_table_name: `dim_${buildModelCode(project.name, "channel")}`,
        model_business_domain: "投放",
        model_data_domain: "DIM",
        model_layer: "维表",
        layer: "DIM",
        subject_domain: "投放",
        model_type: "维表",
        storage_type: "MySQL",
        table_name: `dim_${buildModelCode(project.name, "channel")}`,
        table_description: "统一管理渠道编码、平台归属和业务分类。",
        partition_field: null,
        owner: "当前用户",
        status: "已发布",
        tags: ["维度", "配置"],
        schedule_cycle: "小时",
        refresh_mode: "全量",
        core_metric: null,
        remark: "用于支撑投放与线索归因模型。",
        created_at: now,
        updated_at: now,
      },
    ];
  });
}

export function createInitialModelSqlDrafts(models: WarehouseModel[], environments: Environment[]): ModelSqlDraft[] {
  const now = new Date().toISOString();
  const defaultEnvironmentByCompany = new Map<string, number | null>();

  models.forEach((model) => {
    if (!defaultEnvironmentByCompany.has(model.company_name)) {
      const environment = environments.find((item) => item.company_name === model.company_name) ?? null;
      defaultEnvironmentByCompany.set(model.company_name, environment?.id ?? null);
    }
  });

  let nextId = 1;
  return models.flatMap((model) => {
    const environmentId = defaultEnvironmentByCompany.get(model.company_name) ?? null;
    const baseSelect = `select\n  dt,\n  channel_id,\n  count(1) as lead_cnt\nfrom ${model.table_name.replace(/^dws_/, "dwd_")}\nwhere dt = '\${biz_date}'\ngroup by dt, channel_id;`;

    return [
      {
        id: nextId++,
        model_id: model.id,
        environment_id: environmentId,
        title: `${model.model_name} - 主逻辑 SQL`,
        sql_type: "主逻辑 SQL",
        version_no: "v1.0.0",
        description: "当前生效版本，供日常开发和排查复用。",
        content: baseSelect,
        status: "生效中",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: nextId++,
        model_id: model.id,
        environment_id: environmentId,
        title: `${model.model_name} - 核对 SQL`,
        sql_type: "核对 SQL",
        version_no: "v0.9.0",
        description: "用于上线前后的指标核对。",
        content: `select\n  dt,\n  sum(lead_cnt) as lead_cnt\nfrom ${model.table_name}\nwhere dt between '\${start_date}' and '\${end_date}'\ngroup by dt\norder by dt;`,
        status: "草稿",
        is_active: false,
        created_at: now,
        updated_at: now,
      },
    ];
  });
}
