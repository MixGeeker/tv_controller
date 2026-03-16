# TV Controller

[![CI](https://github.com/MixGeeker/tv_controller/actions/workflows/ci.yml/badge.svg)](https://github.com/MixGeeker/tv_controller/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

一个基于 `UPnP / DLNA` 的电视控制与投屏系统，适合做成可开源的独立能力模块，再通过 `REST API` 集成到 ERP、信息发布系统、门店中控系统或企业后台中。

如果你正在做：

- ERP 对电视、商显或播放盒子的统一控制
- 门店、展厅、工厂看板或公告屏的内容下发
- 一个可开源、可二开、可嵌入业务系统的播控能力层

这个仓库就是为这类场景准备的。

项目采用 monorepo 结构，包含：

- `packages/core`：可复用的 TypeScript 核心控制库，基于 `upnp-client-ts`
- `apps/api`：`NestJS` 后端，负责设备发现、媒体上传、静态托管、播放会话和软同步控制
- `apps/web`：`Vue 3` 控制台，用于测试、演示和日常操作

## 项目故事

这个项目的出发点不是“做一个只能自己用的小工具”，而是把“控制电视、投放 mp4 或图片、控制播放进度和音量”这件事拆成一套干净、可复用、可开源的基础能力。

很多 ERP、门店系统、展厅系统、工厂看板系统，最后都会走到同一个场景：后台已经能管理内容和业务流程，但缺少一个稳定的“最后一跳”控制层，把内容真正送到电视上并完成播放控制。  
`TV Controller` 就是为这一步准备的。它不关心你的订单、库存、排班或审批，它只专注于一件事：在局域网里找到设备、把媒体送过去、并把播放状态控制好。

换句话说，这个项目希望成为 ERP 外围的一块“播放基础设施”，而不是写死在某个业务系统里的私有脚本。

## 系统职能

### 核心职能

- 发现局域网中的标准 `DLNA/UPnP MediaRenderer` 设备
- 向电视或渲染设备投放 `mp4`、`jpg`、`png`、`webp`、`gif`
- 控制播放、暂停、停止、跳转进度、设置音量
- 查询当前播放状态、当前位置、总时长、最后错误信息
- 支持单设备播放
- 支持多设备“软同步启动”播放

### 模块职能

#### `packages/core`

- 封装 `upnp-client-ts`
- 提供设备发现、渲染器控制、会话管理、软同步协调
- 保持对 `NestJS` 和前端 UI 无强耦合
- 适合未来单独发布为 npm 包，或直接嵌入企业项目

#### `apps/api`

- 提供 REST API
- 提供媒体文件上传
- 提供媒体静态访问地址
- 管理播放会话
- 对外暴露单设备播放和多设备软同步播放能力

#### `apps/web`

- 提供可视化控制台
- 扫描并选择设备
- 上传媒体或登记远程 URL
- 发起播放任务
- 控制进度和音量
- 查看会话状态

## 当前能力边界

- 第一版主要面向标准 `DLNA/UPnP MediaRenderer`
- 多设备同步是“软同步启动”，不是帧级严格同步
- 上传文件只做静态托管，不做转码
- 项目默认不内置用户系统和权限系统，适合集成到你自己的 ERP 或网关后再做鉴权

## 技术栈

- 核心库：`TypeScript` + `upnp-client-ts`
- 后端：`NestJS`
- 前端：`Vue 3` + `Vite`
- 包管理：`pnpm`
- 部署方式：本地 Node 运行 / Docker Compose

## 仓库状态

- 已提供本地启动与 Docker 启动方案
- 已提供中文控制台与中文文档
- 已内置基础 CI 校验：`check`、`build`、`test`
- 已补齐基础开源协作文件：`LICENSE`、`CONTRIBUTING`、Issue / PR 模板

## 目录结构

```text
tv-controller/
├─ apps/
│  ├─ api/        # NestJS API
│  └─ web/        # Vue 控制台
├─ packages/
│  └─ core/       # 可复用控制核心
├─ docker-compose.yml
├─ package.json
└─ pnpm-workspace.yaml
```

## 环境要求

- `Node.js 22+`
- `pnpm 10+`
- 电视或投屏设备与服务部署机器处于同一局域网
- 电视能够直接访问 API 服务暴露出来的媒体 URL

## 配置说明

### 后端配置

示例文件：`apps/api/.env.example`

关键变量：

- `HOST`：API 监听地址，默认 `0.0.0.0`
- `PORT`：API 端口，默认 `3100`
- `UPLOADS_DIR`：上传文件目录
- `PUBLIC_BASE_URL`：对电视可见的后端访问地址，最重要

示例：

```env
HOST=0.0.0.0
PORT=3100
UPLOADS_DIR=apps/api/uploads
PUBLIC_BASE_URL=http://192.168.1.10:3100
```

### 前端配置

示例文件：`apps/web/.env.example`

关键变量：

- `VITE_API_BASE_URL`：前端调用 API 的地址

示例：

```env
VITE_API_BASE_URL=http://localhost:3100
```

## 非 Docker 启动方式

适合本地开发、功能调试、局域网内快速试跑。

### 1. 安装依赖

```bash
pnpm install
```

### 2. 复制环境变量文件

Windows PowerShell：

```powershell
Copy-Item apps\api\.env.example apps\api\.env
Copy-Item apps\web\.env.example apps\web\.env
```

macOS / Linux：

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

然后修改：

- `apps/api/.env` 中的 `PUBLIC_BASE_URL`
- `apps/web/.env` 中的 `VITE_API_BASE_URL`

其中 `PUBLIC_BASE_URL` 必须填写成电视真实能访问到的地址，例如：

```env
PUBLIC_BASE_URL=http://192.168.1.10:3100
```

### 3. 启动开发环境

```bash
pnpm dev
```

该命令会并行启动：

- `packages/core` 的 watch 构建
- `apps/api` 的 NestJS 开发服务
- `apps/web` 的 Vite 开发服务

默认访问地址：

- API：`http://localhost:3100`
- Web 控制台：`http://localhost:5173`

### 4. 单独启动某个模块

只启动后端：

```bash
pnpm --filter @tv-controller/api dev
```

只启动前端：

```bash
pnpm --filter @tv-controller/web dev
```

只监听核心库：

```bash
pnpm --filter @tv-controller/core dev
```

### 5. 生产模式启动

先构建：

```bash
pnpm build
```

启动 API：

```bash
pnpm --filter @tv-controller/api start
```

前端如果要本地预览：

```bash
pnpm --filter @tv-controller/web preview --host 0.0.0.0
```

## Docker 启动方式

适合内网部署、联调 ERP、或后续放到服务器/边缘设备中运行。

### 1. 准备环境变量

`docker-compose.yml` 使用以下变量：

- `PUBLIC_BASE_URL`
- `VITE_API_BASE_URL`

最简单的方式是在当前 shell 中先设置变量。

Windows PowerShell：

```powershell
$env:PUBLIC_BASE_URL="http://192.168.1.10:3100"
$env:VITE_API_BASE_URL="http://192.168.1.10:3100"
```

macOS / Linux：

```bash
export PUBLIC_BASE_URL=http://192.168.1.10:3100
export VITE_API_BASE_URL=http://192.168.1.10:3100
```

### 2. 构建并启动

```bash
docker compose up --build
```

默认映射：

- API：`3100`
- Web：`8080`

启动后访问：

- API：`http://localhost:3100`
- Web 控制台：`http://localhost:8080`

### 3. 后台运行

```bash
docker compose up -d --build
```

### 4. 停止服务

```bash
docker compose down
```

### 5. 上传文件存储

Docker 模式下，上传文件会挂载到：

```text
./.docker/uploads
```

这样容器重启后媒体不会丢失。

## 使用说明

### 基本使用流程

1. 启动 API 和 Web 控制台
2. 打开 Web 控制台
3. 点击“刷新”或“扫描网络”发现设备
4. 上传一个本地媒体文件，或者登记一个可访问的远程 URL
5. 选择一台或多台设备
6. 发起播放
7. 在会话列表中选择当前会话
8. 执行播放、暂停、停止、跳转进度、设置音量等控制

### 典型场景

#### 单设备播放

适合：

- 门店单屏宣传
- 展厅单屏演示
- 办公区公告屏

流程：

1. 选择一个设备
2. 选择一个媒体资源
3. 设置是否自动播放、初始音量、起始进度
4. 点击启动播放

#### 多设备软同步播放

适合：

- 多屏同时开播
- 多个房间同时触发同一内容
- 多台电视尽量同时开始播放

注意：

- 这是“软同步启动”
- 系统会并发下发播放命令
- 不保证毫秒级严格同步

### 媒体来源

支持两种方式：

- 本地上传后由 API 静态托管
- 直接登记 ERP 或其他系统提供的远程媒体 URL

## 常用接口说明

### 设备

- `GET /health`
- `GET /devices`
- `GET /devices/:id`

### 媒体

- `GET /media`
- `GET /media/:id`
- `POST /media/upload`
- `POST /media/url`

### 播放会话

- `GET /sessions`
- `GET /sessions/:id`
- `POST /sessions`
- `POST /sessions/:id/play`
- `POST /sessions/:id/pause`
- `POST /sessions/:id/stop`
- `POST /sessions/:id/seek`
- `POST /sessions/:id/volume`

### 多设备软同步

- `POST /sync/play`

## 对接 ERP 的建议

- ERP 负责业务数据、媒体审批、排期和权限
- `TV Controller` 负责设备发现、媒体托管、投屏和播放控制
- ERP 可以直接调用 REST API，而不必关心底层 `UPnP/DLNA` 实现细节

推荐集成方式：

1. ERP 上传内容到 `TV Controller`
2. `TV Controller` 返回媒体 ID 或媒体 URL
3. ERP 下发播放指令到对应设备或设备组
4. ERP 轮询或记录播放会话状态

## 重要注意事项

### 1. `PUBLIC_BASE_URL` 必须可被电视访问

电视不是从浏览器拿媒体，而是直接从 API 服务拿媒体。  
所以如果你把 `PUBLIC_BASE_URL` 配成 `http://localhost:3100`，浏览器能访问，不代表电视能访问。

正确示例：

```env
PUBLIC_BASE_URL=http://192.168.1.10:3100
```

### 2. 设备兼容性取决于电视的 DLNA/UPnP 实现

虽然项目以标准 `MediaRenderer` 为目标，但不同品牌、不同型号的实现质量差异很大。

### 3. 当前不做转码

如果电视本身不支持某个媒体编码格式，上传成功也可能无法播放。  
第一版推荐优先使用：

- 视频：`video/mp4`
- 图片：`image/jpeg`、`image/png`

## 开发命令

```bash
pnpm build
pnpm check
pnpm test
```

## 开源协作

欢迎基于真实业务场景继续扩展这个项目，尤其是以下方向：

- 更多品牌和型号的兼容性验证
- ERP / 门店系统 / 信息发布系统的对接案例
- 设备分组、编排与场景化控制
- 更稳定的状态推送和审计能力

协作入口：

- 贡献说明：[`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Bug 反馈：[`Issues`](https://github.com/MixGeeker/tv_controller/issues)
- 代码提交：[`Pull Requests`](https://github.com/MixGeeker/tv_controller/pulls)

## 后续方向

- 品牌兼容层
- WebSocket 状态推送
- 设备分组与场景编排
- 与 ERP 的更深度调度联动
- 更完整的 API 鉴权与审计

## License

本项目使用 [`MIT License`](./LICENSE)。

这意味着你可以将它用于商业项目、内部系统和二次开发，只需保留原始许可声明。
