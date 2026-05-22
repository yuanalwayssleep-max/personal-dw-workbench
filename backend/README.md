# Backend

后端基于 FastAPI + SQLAlchemy，提供个人数仓工作台的基础 API。

当前已覆盖的核心模块：
- 公司管理
- 项目管理
- 环境管理
- 知识库管理
- 模型管理
- SQL 工作区
- 问题溯源

## 目录说明

```text
backend/
├── app/
│   ├── core/         # 配置、数据库、通用响应
│   ├── models/       # SQLAlchemy 模型
│   ├── repositories/ # 数据访问层
│   ├── routers/      # FastAPI 路由
│   ├── schemas/      # 请求/响应结构
│   └── services/     # 业务逻辑层
├── init_db.py        # 初始化数据库
├── seed_data.py      # 演示数据脚本
├── backfill_history.py
├── requirements.txt
└── .env.example
```

## 安装依赖

```bash
cd /Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 环境变量配置

```bash
cp .env.example .env
```

### SQLite 示例

```env
DATABASE_URL=sqlite:///./personal_dw_workbench.db
```

### MySQL 示例

```env
DATABASE_URL=mysql+pymysql://dw_user:your_password@127.0.0.1:3306/personal_dw_workbench?charset=utf8mb4
```

## 初始化数据库

### 本地 SQLite

```bash
cd /Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/backend
source .venv/bin/activate
python init_db.py
python seed_data.py
```

### MySQL

先确保目标库已经创建完成，再执行：

```bash
cd /Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/backend
source .venv/bin/activate
python init_db.py
python seed_data.py
```

说明：
- `init_db.py` 会按 ORM 建表，并补历史新增字段
- `seed_data.py` 会清理演示数据后重新写入，不适合生产环境

## 启动服务

```bash
cd /Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动后地址：
- 健康检查：`http://127.0.0.1:8000/health`
- OpenAPI 文档：`http://127.0.0.1:8000/docs`

## 关键说明

### 1. 数据库初始化方式

当前主初始化入口是：
- `/Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/backend/init_db.py`

不是：
- 手工逐条建表
- 或直接依赖 `sql/init_schema.sql`

### 2. `sql/init_schema.sql` 的定位

`/Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/sql/init_schema.sql` 更接近早期 PostgreSQL 草案。

当前真实可运行的本地初始化方式，优先使用 ORM：
- `python init_db.py`
- `python seed_data.py`

### 3. CORS

当前允许的来源包含：
- `localhost`
- `127.0.0.1`
- `10.238.8.51`

如果你更换了前端访问 IP，需要同步修改：
- `/Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/backend/app/main.py`

## 自检命令

### Python 语法检查

```bash
cd /Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/backend
source .venv/bin/activate
python -m py_compile $(find app -name '*.py') init_db.py seed_data.py
```

### 健康检查

```bash
curl http://127.0.0.1:8000/health
```
