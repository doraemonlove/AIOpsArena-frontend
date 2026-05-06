# AIOps Arena Frontend

基于 Vue 3、Vite、TypeScript、Pinia 和 Element Plus 的 AIOps 前端项目。项目包含常规业务页面能力，也包含平台助手相关能力；当前前端依赖两组后端服务：

- 主业务后端：`http://localhost:8002`
- 平台助手服务：`http://localhost:8004`

为了减少跨域和环境差异，开发环境和 Docker 运行环境都统一通过代理访问后端：

- `/api` -> `8002`
- `/agent-api` -> `8004`

## 技术栈

- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- Element Plus
- Axios

## 环境要求

- Node.js 22 及以上
- npm 10 及以上
- Docker 24 及以上（如果需要构建镜像）

本项目当前依赖中使用了较新的 JavaScript 语法，Node 版本过低会导致 `npm run build` 失败。

## 本地开发

1. 安装依赖

```bash
npm ci
```

2. 启动开发服务器

```bash
npm run dev
```

3. 浏览器访问 Vite 默认地址

```text
http://localhost:5173
```

本地开发时会自动代理：

- `/api/*` 到 `http://localhost:8002/*`
- `/agent-api/*` 到 `http://localhost:8004/*`

所以启动前请先确保 `8002` 和 `8004` 两个后端服务已经可用。

## 本地构建

```bash
npm run build
```

构建产物默认输出到 `dist/` 目录。

## Docker 构建

项目提供了多阶段构建的生产镜像：

- 构建阶段：`node:22-alpine`
- 运行阶段：`nginx:1.27-alpine`

构建命令：

```bash
docker build -t aiops-frontend:latest .
```

## Docker 运行

```bash
docker run --rm -p 8080:80 aiops-frontend:latest
```

启动后访问：

```text
http://localhost:8080
```

容器内 `nginx` 已经配置反向代理：

- `/api/*` -> `http://host.docker.internal:8002/*`
- `/agent-api/*` -> `http://host.docker.internal:8004/*`

这表示前端容器默认会把请求转发到宿主机上的后端服务。

## Docker 运行说明

### macOS / Windows

`host.docker.internal` 默认可用，通常不需要额外配置。

### Linux

如果你在 Linux 上运行，需要显式把宿主机地址映射给容器：

```bash
docker run --rm -p 8080:80 --add-host=host.docker.internal:host-gateway aiops-frontend:latest
```

## 常用命令

开发：

```bash
npm run dev
```

构建：

```bash
npm run build
```

预览构建产物：

```bash
npm run preview
```

代码检查：

```bash
npm run lint
```

## 关键配置说明

- [vite.config.ts](./vite.config.ts)
  定义本地开发代理，统一把 `/api` 和 `/agent-api` 转发到本机后端服务。

- [.env.development](./.env.development)
  本地开发环境变量，前端通过相对路径访问代理入口。

- [.env.production](./.env.production)
  生产构建环境变量，前端通过相对路径访问容器内 `nginx` 代理。

- [nginx.conf](./nginx.conf)
  生产镜像中的静态资源服务和接口转发配置，包含 SPA 路由回退和 SSE 相关代理配置。

- [Dockerfile](./Dockerfile)
  定义生产镜像的多阶段构建流程。
