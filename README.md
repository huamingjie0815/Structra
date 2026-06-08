# Structra

Structra is a local-first desktop diagram editor for building flowcharts, process diagrams, mind maps, org charts, ER diagrams, UML-style diagrams, and handoff-ready visual documents.

Structra 是一款本地优先的桌面图表编辑器，用于创建流程图、业务流程图、思维导图、组织架构图、ER 图、UML 风格图以及可交付的可视化文档。

## Features

- Local-first desktop workflow built with Tauri, React, and TypeScript.
- Native `.structra` document format for saving and reopening local diagrams.
- Multi-page document editing with recent documents, local drafts, and version history.
- Rich diagram authoring for flowcharts, BPMN-like flows, ER diagrams, UML-style structures, mind maps, and org charts.
- Export support for JSON, SVG, PNG, PDF, and Mermaid.
- Native desktop file dialogs, macOS app bundling, and `.structra` file association.
- Focused QA scripts for unit tests, browser smoke tests, desktop smoke tests, and performance checks.

## 功能特性

- 基于 Tauri、React、TypeScript 的本地优先桌面工作流。
- 使用原生 `.structra` 文档格式保存和重新打开本地图表。
- 支持多页面文档、最近文档、本地草稿和版本历史。
- 支持流程图、BPMN 风格流程、ER 图、UML 风格结构、思维导图和组织架构图等图表创作。
- 支持导出 JSON、SVG、PNG、PDF 和 Mermaid。
- 支持原生桌面文件对话框、macOS 应用打包和 `.structra` 文件关联。
- 提供单元测试、浏览器冒烟测试、桌面冒烟测试和性能检查脚本。

## Tech Stack

- Frontend: React 18, TypeScript, Vite
- Diagram canvas: React Flow
- Desktop runtime: Tauri 2
- Native layer: Rust
- Package manager: pnpm

## 技术栈

- 前端：React 18、TypeScript、Vite
- 图形画布：React Flow
- 桌面运行时：Tauri 2
- 原生层：Rust
- 包管理器：pnpm

## Requirements

- Node.js 22 or compatible current LTS
- pnpm
- Rust stable toolchain
- Tauri platform prerequisites for your operating system

For Tauri system dependencies, see the official guide:
https://v2.tauri.app/start/prerequisites/

## 环境要求

- Node.js 22 或兼容的当前 LTS 版本
- pnpm
- Rust stable 工具链
- 当前操作系统对应的 Tauri 系统依赖

Tauri 系统依赖请参考官方文档：
https://v2.tauri.app/start/prerequisites/

## Getting Started

```bash
pnpm install
pnpm dev
```

Run the desktop app in development mode:

```bash
pnpm tauri:dev
```

## 快速开始

```bash
pnpm install
pnpm dev
```

以桌面开发模式运行：

```bash
pnpm tauri:dev
```

## Scripts

```bash
pnpm build             # Type-check and build the web frontend
pnpm test              # Run unit tests
pnpm qa                # Run unit tests and browser smoke tests
pnpm qa:smoke          # Run browser smoke tests
pnpm qa:desktop        # Run packaged desktop smoke tests
pnpm qa:perf           # Run performance checks
pnpm tauri:build       # Build the desktop app
pnpm tauri:build:dmg   # Build a macOS DMG
```

## 常用脚本

```bash
pnpm build             # 类型检查并构建前端
pnpm test              # 运行单元测试
pnpm qa                # 运行单元测试和浏览器冒烟测试
pnpm qa:smoke          # 运行浏览器冒烟测试
pnpm qa:desktop        # 运行桌面应用冒烟测试
pnpm qa:perf           # 运行性能检查
pnpm tauri:build       # 构建桌面应用
pnpm tauri:build:dmg   # 构建 macOS DMG
```

## Document Format

Structra uses `.structra` as its native document extension. A Structra document is JSON with a versioned schema:

```json
{
  "schema": "structra.diagram-document",
  "version": 1,
  "document": {}
}
```

## 文档格式

Structra 使用 `.structra` 作为原生文档扩展名。Structra 文档是带版本 schema 的 JSON：

```json
{
  "schema": "structra.diagram-document",
  "version": 1,
  "document": {}
}
```

## Project Structure

```text
src/                 React application, editor domain, IO, and UI components
src-tauri/           Tauri and Rust native app layer
scripts/qa/          Local QA, smoke, desktop, and performance scripts
tests/               Browser smoke tests and document fixtures
docs/                Product and agent-facing project documentation
```

## 项目结构

```text
src/                 React 应用、编辑器领域逻辑、IO 和 UI 组件
src-tauri/           Tauri 与 Rust 原生应用层
scripts/qa/          本地 QA、冒烟测试、桌面测试和性能脚本
tests/               浏览器冒烟测试和文档 fixture
docs/                产品文档与 agent 协作文档
```

## Packaging

Build the desktop app:

```bash
pnpm tauri:build
```

Build a macOS DMG:

```bash
pnpm tauri:build:dmg
```

Windows installers should be built on Windows or a Windows CI runner:

```bash
pnpm tauri build --bundles nsis
pnpm tauri build --bundles msi
```

## 打包

构建桌面应用：

```bash
pnpm tauri:build
```

构建 macOS DMG：

```bash
pnpm tauri:build:dmg
```

Windows 安装包建议在 Windows 或 Windows CI 环境构建：

```bash
pnpm tauri build --bundles nsis
pnpm tauri build --bundles msi
```

## Contributing

Contributions are welcome. Please keep changes focused, run the relevant tests before submitting, and include enough context for reviewers to reproduce behavior changes.

Recommended checks before opening a pull request:

```bash
pnpm test
pnpm build
```

For desktop-facing changes, also run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

## 贡献

欢迎贡献代码。请保持变更聚焦，在提交前运行相关测试，并提供足够上下文，方便 reviewer 复现行为变化。

提交 Pull Request 前建议运行：

```bash
pnpm test
pnpm build
```

如果修改涉及桌面端能力，也建议运行：

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

## License

No open source license has been declared yet. Add a `LICENSE` file before publishing or accepting external contributions.

## 许可证

当前尚未声明开源许可证。正式发布或接受外部贡献前，请先添加 `LICENSE` 文件。
