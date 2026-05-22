# Frontend

前端基于 React + Vite，主要承载个人数仓工作台的管理台页面。

## 安装依赖

```bash
cd /Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/frontend
npm install
```

## 启动开发环境

```bash
cd /Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/frontend
npm run dev
```

默认访问地址：
- `http://127.0.0.1:5173`

## 构建

```bash
npm run build
```

## 联调说明

- 前端 API 前缀固定为 `/api/v1`
- Vite 已配置代理到 `http://127.0.0.1:8000`
- 启动前端前，请先确认后端已启动

相关文件：
- `/Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/frontend/vite.config.ts`
- `/Users/zz/Documents/Codex/2026-04-23-new-chat-2/personal-dw-workbench/frontend/src/services/api.ts`
