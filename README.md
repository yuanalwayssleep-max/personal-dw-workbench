# personal-dw-workbench

个人数仓工作台，面向个人数仓开发工程师使用，强调跨公司复用、轻量管理和问题闭环。

当前仓库已经落地的能力重点：
- 公司 / 项目 / 环境管理
- 知识库管理：规范标准、业务口径、指标体系
- 模型管理、SQL 管理
- 问题溯源与基础工作台页面
- FastAPI + React 的前后端一体开发骨架

## 目录结构

```text
personal-dw-workbench/
├── backend/      # FastAPI + SQLAlchemy 后端
├── docs/         # 产品与技术文档
├── frontend/     # React + Vite 前端
├── sql/          # 数据库初始化脚本草案
└── README.md
```

## 技术栈

### 前端
- React 18
- TypeScript
- Vite

### 后端
- FastAPI
- SQLAlchemy
- Pydantic Settings

### 默认本地存储
- SQLite

### 可扩展数据库
- MySQL（建议通过 SQLAlchemy + PyMySQL 接入）
- PostgreSQL（仓库内已有早期初始化脚本草案）

## 开发环境要求

- Node.js 18+
- npm 9+
- Python 3.9+

## 快速启动

### 1. 启动后端

```bash
cd /Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python init_db.py
python seed_data.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端启动后可访问：
- 健康检查：`http://127.0.0.1:8000/health`
- API 根前缀：`http://127.0.0.1:8000/api/v1`

### 2. 启动前端

```bash
cd /Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/frontend
npm install
npm run dev
```

前端默认地址：
- 本机：`http://127.0.0.1:5173`
- 局域网：`http://你的本机IP:5173`

说明：
- Vite 已将 `/api` 代理到 `http://127.0.0.1:8000`
- 所以前后端本地联调时，不需要额外修改前端 API 地址

## 前后端启动顺序建议

1. 先启动后端 `8000`
2. 再启动前端 `5173`
3. 打开前端页面验证公司管理、项目管理、环境管理等页面

## 数据库初始化说明

### 方案 A：本地开发，使用 SQLite（推荐）

这是当前最稳的开发模式，不需要额外安装数据库。

```bash
cd /Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/backend
source .venv/bin/activate
cp .env.example .env
python init_db.py
python seed_data.py
```

默认会生成：
- `/Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/backend/personal_dw_workbench.db`

说明：
- `init_db.py` 负责建表和补充历史缺失字段
- `seed_data.py` 会写入演示公司、项目、环境、知识库、SQL、问题溯源等测试数据
- `seed_data.py` 会清理并重建演示数据，不要对生产库执行

### 方案 B：使用 MySQL

1. 先创建数据库，例如：

```sql
CREATE DATABASE personal_dw_workbench DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 修改 `backend/.env` 中的 `DATABASE_URL`：

```env
DATABASE_URL=mysql+pymysql://dw_user:your_password@127.0.0.1:3306/personal_dw_workbench?charset=utf8mb4
```

3. 执行初始化：

```bash
cd /Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/backend
source .venv/bin/activate
python init_db.py
python seed_data.py
```

说明：
- 当前代码使用 SQLAlchemy ORM 建表，MySQL 场景优先使用 `init_db.py`
- 仓库中的 `sql/init_schema.sql` 不是 MySQL 脚本，不要直接对 MySQL 执行

### 方案 C：使用 PostgreSQL

仓库内存在一个早期 PostgreSQL 建表草案：
- `/Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/sql/init_schema.sql`

如果只是本地开发，不建议优先走 PostgreSQL；当前更建议用 SQLite 或 MySQL。

## 环境变量说明

后端当前主要使用以下环境变量：

| 变量名 | 说明 | 默认值 |
| --- | --- | --- |
| `APP_NAME` | 应用名称 | `Personal DW Workbench API` |
| `APP_ENV` | 运行环境 | `dev` |
| `DEBUG` | 是否开启调试 | `true` |
| `DATABASE_URL` | 数据库连接串 | `sqlite:///./personal_dw_workbench.db` |

参考文件：
- `/Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/backend/.env.example`

## 常用命令

### 后端

```bash
cd /Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端

```bash
cd /Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/frontend
npm run dev
npm run build
```

## 文档入口

- 产品架构：`/Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/docs/product/02-system-architecture.md`
- 页面信息架构：`/Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/docs/product/04-page-ia.md`
- 技术数据模型：`/Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/docs/tech/01-data-model.md`
- API 设计：`/Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/docs/tech/02-api-design.md`

## 当前建议

当前仓库更适合这样使用：
- 本地开发阶段：SQLite
- 有多人联调或需要稳定数据：MySQL
- 文档设计和产品方案沉淀：直接维护 `docs/`
