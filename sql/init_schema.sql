create table company (
    id bigserial primary key,
    company_name varchar(128) not null unique,
    network_mode varchar(32) not null default '内网访问',
    note text,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table workspace_project (
    id varchar(64) primary key,
    project_name varchar(128) not null,
    company_name varchar(128) not null references company(company_name),
    description text,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table workspace_environment (
    id bigserial primary key,
    environment_code varchar(64) not null unique,
    company_name varchar(128) not null,
    environment_name varchar(128) not null,
    environment_type varchar(32) not null default '系统',
    account_name varchar(128),
    account_password varchar(256),
    network_mode varchar(32) not null default 'intranet',
    dialect varchar(32) not null,
    timezone varchar(64) not null default 'Asia/Shanghai',
    description text,
    is_active boolean not null default true,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table project_environment_link (
    project_id varchar(64) not null references workspace_project(id),
    environment_id bigint not null references workspace_environment(id),
    created_at timestamp not null default current_timestamp,
    primary key (project_id, environment_id)
);

create table environment_entrypoint (
    id bigserial primary key,
    environment_id bigint not null references workspace_environment(id),
    entry_type varchar(32) not null,
    entry_name varchar(128) not null,
    entry_url text not null,
    description text,
    display_order int not null default 0,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table capability_profile (
    id bigserial primary key,
    environment_id bigint not null references workspace_environment(id),
    capability_type varchar(32) not null,
    capability_level varchar(8) not null,
    source_type varchar(32) not null,
    adapter_key varchar(64),
    config_json jsonb,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    unique(environment_id, capability_type)
);

create table url_template (
    id bigserial primary key,
    environment_id bigint not null references workspace_environment(id),
    template_type varchar(32) not null,
    template_name varchar(128) not null,
    template_value text not null,
    description text,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table adapter_registry (
    id bigserial primary key,
    adapter_key varchar(64) not null unique,
    adapter_name varchar(128) not null,
    adapter_type varchar(32) not null,
    version varchar(32),
    status varchar(32) not null default 'active',
    config_schema jsonb,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table sql_asset (
    id bigserial primary key,
    environment_id bigint not null references workspace_environment(id),
    title varchar(256) not null,
    sql_type varchar(32) not null,
    content text not null,
    dialect varchar(32) not null,
    summary text,
    tags jsonb,
    is_favorite boolean not null default false,
    status varchar(32) not null default 'draft',
    source_type varchar(32) not null default 'manual',
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table sql_snapshot (
    id bigserial primary key,
    sql_asset_id bigint not null references sql_asset(id),
    version_no int not null,
    content text not null,
    change_note varchar(512),
    created_at timestamp not null default current_timestamp,
    unique(sql_asset_id, version_no)
);

create table query_run_record (
    id bigserial primary key,
    environment_id bigint not null references workspace_environment(id),
    sql_asset_id bigint references sql_asset(id),
    run_mode varchar(32) not null,
    run_status varchar(32) not null,
    result_type varchar(32),
    result_ref text,
    result_summary text,
    row_count bigint,
    error_message text,
    executed_at timestamp not null default current_timestamp
);

create table model_draft (
    id bigserial primary key,
    environment_id bigint not null references workspace_environment(id),
    domain_name varchar(128),
    subject_name varchar(128),
    layer_name varchar(32) not null,
    model_name varchar(128) not null,
    description text,
    status varchar(32) not null default 'draft',
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table table_design (
    id bigserial primary key,
    model_draft_id bigint not null references model_draft(id),
    table_name varchar(128) not null,
    table_type varchar(32),
    grain_desc text,
    partition_column varchar(64),
    table_comment text,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table field_design (
    id bigserial primary key,
    table_design_id bigint not null references table_design(id),
    field_name varchar(128) not null,
    field_type varchar(64),
    field_role varchar(32),
    field_desc text,
    metric_rule text,
    display_order int not null default 0,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table incident_card (
    id bigserial primary key,
    environment_id bigint not null references workspace_environment(id),
    title varchar(256) not null,
    incident_type varchar(32) not null,
    severity varchar(16) not null default 'medium',
    status varchar(32) not null default 'open',
    symptom_desc text,
    impact_scope text,
    root_cause text,
    fix_action text,
    review_note text,
    discovered_at timestamp,
    resolved_at timestamp,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table trace_step (
    id bigserial primary key,
    incident_id bigint not null references incident_card(id),
    step_no int not null,
    action_type varchar(32) not null,
    action_desc text not null,
    evidence_ref text,
    intermediate_conclusion text,
    created_at timestamp not null default current_timestamp,
    unique(incident_id, step_no)
);

create table incident_link (
    id bigserial primary key,
    incident_id bigint not null references incident_card(id),
    target_type varchar(32) not null,
    target_id bigint,
    target_ref text,
    link_role varchar(32),
    created_at timestamp not null default current_timestamp
);

create table analysis_note (
    id bigserial primary key,
    environment_id bigint not null references workspace_environment(id),
    query_run_record_id bigint references query_run_record(id),
    title varchar(256) not null,
    observation text,
    conclusion text,
    next_action text,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table knowledge_note (
    id bigserial primary key,
    environment_id bigint references workspace_environment(id),
    title varchar(256) not null,
    note_type varchar(32) not null,
    content text not null,
    summary text,
    source_type varchar(32) not null default 'manual',
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table knowledge_standard (
    id bigserial primary key,
    standard_name varchar(128) not null,
    standard_type varchar(64) not null,
    company_name varchar(128) references company(company_name),
    status varchar(32) not null default '生效中',
    rule_content text not null,
    positive_example text,
    negative_example text,
    note text,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table standard_project_link (
    standard_id bigint not null references knowledge_standard(id),
    project_id varchar(64) not null references workspace_project(id),
    created_at timestamp not null default current_timestamp,
    primary key (standard_id, project_id)
);

create table business_glossary (
    id bigserial primary key,
    glossary_name varchar(128) not null,
    business_domain varchar(64) not null,
    company_name varchar(128) references company(company_name),
    definition text not null,
    statistical_scope text,
    data_source text,
    note text,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table glossary_project_link (
    glossary_id bigint not null references business_glossary(id),
    project_id varchar(64) not null references workspace_project(id),
    created_at timestamp not null default current_timestamp,
    primary key (glossary_id, project_id)
);

create table metric_definition (
    id bigserial primary key,
    metric_name varchar(128) not null,
    metric_code varchar(64) not null,
    field_type varchar(32) not null default 'string',
    business_domain varchar(64) not null,
    metric_category varchar(64) not null,
    company_name varchar(128) references company(company_name),
    definition text not null,
    calculation_rule text not null,
    time_granularity varchar(32) not null,
    unit varchar(32),
    note text,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table metric_project_link (
    metric_id bigint not null references metric_definition(id),
    project_id varchar(64) not null references workspace_project(id),
    created_at timestamp not null default current_timestamp,
    primary key (metric_id, project_id)
);

create table snippet_template (
    id bigserial primary key,
    environment_id bigint references workspace_environment(id),
    template_type varchar(32) not null,
    title varchar(256) not null,
    content text not null,
    applicable_scene varchar(256),
    description text,
    is_favorite boolean not null default false,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table file_artifact (
    id bigserial primary key,
    environment_id bigint references workspace_environment(id),
    file_name varchar(256) not null,
    file_type varchar(32) not null,
    storage_path text not null,
    origin_type varchar(32) not null,
    summary text,
    created_at timestamp not null default current_timestamp
);

create table external_asset_ref (
    id bigserial primary key,
    environment_id bigint not null references workspace_environment(id),
    asset_type varchar(32) not null,
    asset_name varchar(256) not null,
    asset_key varchar(128),
    asset_url text not null,
    remark text,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

create table tag_definition (
    id bigserial primary key,
    tag_name varchar(64) not null unique,
    tag_category varchar(32),
    color varchar(32),
    description text,
    created_at timestamp not null default current_timestamp
);

create table object_tag_relation (
    id bigserial primary key,
    object_type varchar(32) not null,
    object_id bigint not null,
    tag_id bigint not null references tag_definition(id),
    created_at timestamp not null default current_timestamp,
    unique(object_type, object_id, tag_id)
);

create table activity_log (
    id bigserial primary key,
    environment_id bigint references workspace_environment(id),
    action_type varchar(64) not null,
    object_type varchar(32) not null,
    object_id bigint,
    action_summary text,
    created_at timestamp not null default current_timestamp
);

create table search_index_entry (
    id bigserial primary key,
    object_type varchar(32) not null,
    object_id bigint not null,
    environment_id bigint references workspace_environment(id),
    title varchar(256) not null,
    keywords text,
    content_excerpt text,
    updated_at timestamp not null default current_timestamp,
    unique(object_type, object_id)
);
