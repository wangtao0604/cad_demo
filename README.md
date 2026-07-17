# 勘察一体化 CAD Demo

Vue 3 + Vite 前端。业务数据通过 `services/platformService.js` 统一加载，页面不直接依赖 mock 数据，可在本地演示数据与 REST 后端之间切换。

## 本地运行

```bash
npm install
npm run dev
```

默认使用 `mock` 数据。复制 `.env.example` 为 `.env.local`，将 `VITE_API_MODE` 改为 `rest` 后即可连接后台：

```dotenv
VITE_API_MODE=rest
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8080
```

生产环境可把 `VITE_API_BASE_URL` 设为完整地址，并由后台配置 CORS；开发环境也可通过 `VITE_API_PROXY_TARGET` 代理 `/api`。

## REST 契约

接口可以直接返回业务对象，也可以使用 `{ "data": ... }` 包装。列表同时兼容数组、`items` 和 `content` 字段。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/platform/metadata` | 人员、角色、流程阶段、权限、Ribbon、分类和外部系统地址 |
| `POST` | `/auth/login` | 登录，返回 `accessToken`/`token` 与 `userId`/`user` |
| `POST` | `/auth/logout` | 退出登录 |
| `GET` | `/projects` | 当前用户可见项目 |
| `GET` | `/projects/:id/todos` | 当前项目、当前用户的待办 |
| `GET` | `/projects/:id/results` | 当前项目成果 |
| `GET` | `/projects/:id/tree` | 工程树节点 |
| `GET` | `/projects/:id/boreholes` | 钻孔列表，可附带 `strataColors` |
| `GET` | `/projects/:id/boreholes/:code/log` | 单孔柱状图，返回 `layers` 和 `waterLevel` |
| `GET/POST` | `/projects/:id/cag-data/:dataset` | 查询或新增 CAG 数据行 |
| `PUT` | `/projects/:id/cag-data/:dataset/:rowId` | 修改 CAG 数据行 |
| `DELETE` | `/projects/:id/cag-data/:dataset` | 按请求体 `{ "ids": [] }` 批量删除 |

`GET /platform/metadata` 的建议响应：

```json
{
  "data": {
    "personaList": [],
    "roleDefinitions": {},
    "flowStages": [],
    "stageStatus": {},
    "stageAccess": {},
    "stageRibbons": {},
    "categories": [],
    "integrationUrls": {
      "ibgiEngineeringInfo": "https://example.com/project"
    }
  }
}
```

字段或路径与后台不一致时，只需调整 `src/api` 或 `src/services/restPlatformService.js`，无需修改 Vue 页面。
