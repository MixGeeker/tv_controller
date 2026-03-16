# 贡献指南

感谢你愿意参与 `TV Controller`。

这个项目的目标不是做一个只适配单一电视品牌的脚本，而是沉淀一套适合 ERP、信息发布系统和门店中控系统复用的局域网投屏基础能力。为了让仓库保持可维护，请在提交前先阅读下面的约定。

## 开发前准备

- Node.js `22+`
- pnpm `10+`
- 建议在真实局域网设备环境中验证播放链路

安装依赖：

```bash
pnpm install
```

复制配置：

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Windows PowerShell：

```powershell
Copy-Item apps\api\.env.example apps\api\.env
Copy-Item apps\web\.env.example apps\web\.env
```

## 本地开发

启动全部模块：

```bash
pnpm dev
```

常用命令：

```bash
pnpm check
pnpm build
pnpm test
```

提交前请至少保证：

- `pnpm check` 通过
- `pnpm build` 通过
- `pnpm test` 通过
- 修改说明和 README 保持同步

## 提交建议

推荐使用清晰的提交前缀，例如：

- `feat:` 新功能
- `fix:` 修复问题
- `docs:` 文档变更
- `refactor:` 重构
- `test:` 测试调整
- `chore:` 工程配置变更

示例：

```text
feat: add LG-friendly playback metadata fallback
fix: normalize mojibake file names on upload
docs: improve README startup guide
```

## Pull Request 约定

请尽量让每个 PR 聚焦一个主题。

提交 PR 时建议包含：

- 变更背景
- 变更内容
- 是否影响 API 或前端交互
- 本地验证方式
- 如涉及设备兼容性，请说明测试设备品牌 / 型号

如果修改了以下内容，请同步补充说明：

- `packages/core`：说明影响的设备发现、会话或投屏行为
- `apps/api`：说明新增或调整的接口
- `apps/web`：说明新增或调整的操作入口和交互

## 问题反馈建议

如果你要提 Bug，请尽量提供：

- 电视品牌与型号
- 电脑系统版本
- 当前 `.env` 中的 `PUBLIC_BASE_URL` 形式
- 媒体类型和编码格式
- 后端日志
- 是否能被手机投屏 App 发现 / 播放

如果是兼容性问题，日志和设备信息越完整，修复越快。

## 设计边界

当前仓库优先保证：

- 标准 `UPnP / DLNA MediaRenderer`
- 单设备稳定播放
- 多设备软同步启动
- 可被 ERP 或其他业务系统通过 REST API 集成

当前不优先处理：

- 品牌私有协议的深度适配
- 帧级严格同步
- 服务端转码

## License

向本仓库提交代码即表示你同意你的贡献将在 [MIT License](./LICENSE) 下发布。
