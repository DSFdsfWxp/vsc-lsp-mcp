## [0.0.2] - 2025-07-11
### 新增
- 完成 LSP MCP 的开发，并发布到 VSCode、OpenVSX 扩展市场

## [0.0.3] - 2025-08-19
### 新增
- 当多个 VSCode 窗口同时运行时，简化端口冲突提示
  - 只在第一次端口冲突时显示警告消息，避免产生过多提示

## [0.0.4] - 2025-10-03
### 新增
- 添加跨域配置，方便 Web 测试

## [0.0.5] - 2025-10-04
### 新增
- 添加 `Access-Control-Expose-Headers` 配置支持
  - 新增 `lsp-mcp.cors.exposeHeaders` 配置项，默认值为 `Mcp-Session-Id`
  - 支持逗号分隔的多个响应头配置
  - 允许浏览器访问指定的响应头，便于客户端获取会话信息

## [0.0.6] - 2026-03-07
### 新增
- 新增 `get_class_file_contents` MCP 工具
  - 通过 jdt:// URI 获取 jdtls 反编译的 Java 类源码
  - 典型用法：`get_definition` 返回依赖库中的 jdt:// URI 时，可调用本工具获取该类的反编译源码，便于 AI 阅读依赖实现

## [0.1.0] - 2026-05-15

### Breaking Changes
- **Position 参数重构**：`position: "8:16"` (0-based string) → `line: 9, character: 17` (1-based integer)
  - 输入输出统一 1-based，与编辑器显示一致
  - `line` 和 `character` 为 optional，不需要位置的操作（`document_symbols`、`workspace_symbols`、`class_file_contents`）无需传入
  - 输出中的行列号（range、namePosition、callSites）同步改为 1-based，可直接用于链式调用

### Added
- 新增 `lsp-mcp.maxResults` 配置项（默认 200），控制 completions、workspace_symbols 等列表类结果的最大条目数
- Markdown 格式输出：`incoming_calls` / `outgoing_calls` 补充 `namePosition`，支持 LLM 链式调用
- 工具描述（tool description）大幅补充：每个操作包含返回值说明、链式调用提示

### Fixed
- `rename` 缺 `newName` / `workspace_symbols` 缺 `query` 时不再暴露 VSCode 内部 API 名，返回友好错误消息
- `completions` 输出不再无限增长（此前 React 项目实测 434K 字符），受 `maxResults` 配置截断
- Markdown 格式输出：`references` / `definition` / `declaration` / `implementation` 标题从硬编码 `## Locations` 改为与操作名匹配（`## References`、`## Definition` 等）
- `pnpm-workspace.yaml` 移除 `allowBuilds` placeholder 残留
- `src/lsp/tools.ts` 移除多余分号
