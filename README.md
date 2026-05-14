# VSCode LSP MCP

<p align="center">
  <img src="res/icon.webp" width="128" height="128" alt="LSP MCP Icon">
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  <img alt="github" src="https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white" />
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">中文</a>
</p>

## 🔍 Overview

VSCode LSP MCP is a Visual Studio Code extension that exposes Language Server Protocol (LSP) features through the Model Context Protocol (MCP).

**Extension ID**: `cjl.lsp-mcp` — open Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`) and search for **cjl.lsp-mcp** to find this plugin precisely.

This allows AI assistants and external tools to utilize VSCode's powerful language intelligence capabilities without direct integration.

![vscode-ext](./docAssets/vsc-ext.webp)
![demo](./docAssets/demo.webp)

<a href="https://glama.ai/mcp/servers/@beixiyo/vsc-lsp-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@beixiyo/vsc-lsp-mcp/badge" alt="VSCode LSP Server MCP server" />
</a>

### 🌟 Why This Extension?

Large language models like Claude and Cursor struggle to understand your codebase accurately because:

- They rely on regex patterns to find symbols, leading to false matches
- They can't analyze import/export relationships properly
- They don't understand type hierarchies or inheritance
- They have limited code navigation capabilities

This extension bridges that gap, providing AI tools with the same code intelligence that VSCode uses internally!

## ⚙️ Features

- 🔄 **LSP Bridge**: Converts LSP features into MCP tools
- 🔌 **Multi-Instance Support**: Automatically handles port conflicts for multiple VSCode windows
- 🧠 **16 LSP operations** covering navigation (definition, declaration, implementation, references), documentation (hover, completions), structure (document/workspace symbols, call hierarchy), and manipulation (rename)
- ☕ **Java dependency source**: Get decompiled Java class source via jdt:// URI (from jdtls), so AI can read library implementations
- 📄 **Dual output format**: JSON for machine processing, Markdown for LLM-friendly reading

## 🛠️ Exposed MCP Tools

| Operation | Description |
|-----------|-------------|
| `hover` | Get hover information (documentation, type, etc.) at a position |
| `definition` | Get the definition location of a symbol |
| `declaration` | Get the declaration location of a symbol |
| `implementation` | Get the implementation location(s) of a symbol |
| `references` | Find all references to a symbol |
| `completions` | Get intelligent code completion suggestions |
| `document_symbols` | Get the symbol outline (tree) of a document |
| `workspace_symbols` | Search for symbols across the entire workspace by query |
| `class_file_contents` | Get decompiled Java class source via jdt:// URI (from jdtls), to read library/dependency implementations |
| `rename` | Rename a symbol across the workspace |
| `symbol_at_position` | Get symbol metadata (name, kind, range) at a position |
| `incoming_calls` | Find all callers of a symbol |
| `outgoing_calls` | Find all callees (calls made by) a symbol |

All operations are invoked through the single `execute_lsp` MCP tool with a unified input format:
- `operation` — which LSP operation to execute
- `uri` — file path or URI string (supports both plain paths and `file://`/`jdt://` URIs)
- `position` — `line:character` (0-based)
- `newName` — required only for `rename`
- `query` — required only for `workspace_symbols`

## 📋 Configuration

<!-- configs -->

| Key                           | Description                                                                                                                                           | Type      | Default |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------- |
| `lsp-mcp.enabled`             | Enable or disable the LSP MCP server.                                                                                                                 | `boolean` | `true`  |
| `lsp-mcp.port`                | Port for the LSP MCP server.                                                                                                                          | `number`  | `9527`  |
| `lsp-mcp.maxRetries`          | Maximum number of port retry attempts when the default port is occupied.                                                                              | `number`  | `10`    |
| `lsp-mcp.cors.enabled`        | Enable or disable CORS (Cross-Origin Resource Sharing).                                                                                               | `boolean` | `true`  |
| `lsp-mcp.cors.allowOrigins`   | Allowed origins for CORS. Use `*` to allow all origins, or provide a comma-separated list of origins (e.g., `http://localhost:3000,http://localhost:5173`). | `string`  | `*`     |
| `lsp-mcp.cors.withCredentials` | Whether to allow credentials (cookies, authorization headers) in CORS requests.                                                                       | `boolean` | `false` |
| `lsp-mcp.cors.exposeHeaders`   | Headers that browsers are allowed to access. Provide a comma-separated list of headers (e.g., `Mcp-Session-Id`).                      | `string`  | `Mcp-Session-Id` |
| `lsp-mcp.outputFormat`         | Output format for LSP operation results. `json` for machine-readable JSON, `markdown` for LLM-friendly Markdown.                     | `string`  | `json` |
 
<!-- configs -->

## 🔗 Integration with AI Tools

### Cursor

Config file: `~/.cursor/mcp.json` (e.g. `%USERPROFILE%\.cursor\mcp.json` on Windows)

```json
{
  "mcpServers": {
    "lsp": {
      "url": "http://127.0.0.1:9527/mcp"
    }
  }
}
```

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.png)](https://cursor.com/install-mcp?name=lsp&config=JTdCJTIydXJsJTIyJTNBJTIyaHR0cCUzQSUyRiUyRjEyNy4wLjAuMSUzQTk1MjclMkZtY3AlMjIlN0Q%3D)

### OpenCode

Config file: `~/.config/opencode/opencode.jsonc`

```json
{
  "mcp": {
    "lsp-mcp": {
      "type": "remote",
      "url": "http://127.0.0.1:9527/mcp",
      "enabled": true
    }
  }
}
```

### Claude Code

Config file: `~/.claude.json`

```json
{
  "mcpServers": {
    "lsp-mcp": {
      "type": "http",
      "url": "http://127.0.0.1:9527/mcp"
    }
  }
}
```

### Gemini | IFlow

Config file: `~/.gemini/settings.json`

```json
{
  "mcpServers": {
    "lsp-mcp": {
      "type": "streamable-http",
      "httpUrl": "http://127.0.0.1:9527/mcp"
    }
  }
}
```

### Roo Code

```json
{
  "mcpServers": {
    "lsp": {
      "type": "streamable-http",
      "url": "http://127.0.0.1:9527/mcp",
      "disabled": false
    }
  }
}
```

## 💻 Development

- Clone the repository
- Run `pnpm install`
- Run `pnpm run update` to generate metadata
- Press `F5` to start debugging