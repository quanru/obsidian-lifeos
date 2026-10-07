# 开发与贡献

欢迎给开源版 LifeOS 提交修复、文档和功能改进。本仓库独立维护开源插件；源码、依赖、构建产物和发布配置都不能从 Pro / Aino 仓库复制或同步。

## 环境与首次构建

需要 Node.js 22 或更新版本、pnpm 10.7 或更新版本，以及 Obsidian 1.4.0 或更新版本。项目使用 TypeScript、React 和 esbuild。

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

`pnpm build` 会先执行类型检查，再在根目录生成 `main.js` 和 `styles.css`。这两个文件不提交到 Git。`manifest.json` 中的插件 ID 为 `periodic-para`，不要因产品改名而修改 ID。

在使用本机 `dev-gate` 的环境中，完整测试、构建和整包类型检查必须通过 heavy 额度执行：

```bash
~/.local/bin/dev-gate run -- pnpm test
~/.local/bin/dev-gate run -- pnpm build
```

## 独立测试库

创建一个不含真实笔记、账号和凭据的测试库。在 `.obsidian/plugins/periodic-para/` 中放入 `main.js`、`styles.css` 和 `manifest.json`，然后启用插件。查询视图需要安装并启用 Dataview；初始化、快速记录和每周回顾无需 Dataview。

开发脚本会监视源码，并在每次构建后将上述文件复制到指定目录：

```bash
OBSIDIAN_PLUGIN_DIR='/absolute/path/to/test-vault/.obsidian/plugins/periodic-para' pnpm dev
```

修改后禁用并重新启用 LifeOS，或使用测试库中的插件重载工具。复制产物不会自动重载插件。不要直接使用个人主库调试文件写入或初始化。

本机受管环境中，watch 服务使用 service 额度；真实 Obsidian 隔离验证使用 runtime 额度。隔离 profile 必须带 `--use-mock-keychain`，结束后关闭本次实例。

## 模块入口

| 路径                | 职责                                      |
| ------------------- | ----------------------------------------- |
| `src/main.ts`       | 生命周期、命令注册、查询视图分发          |
| `src/onboarding/`   | 初始化、多语言模板、工作区方案            |
| `src/capture/`      | 快速记录、任务输入、原子追加              |
| `src/review/`       | 每周回顾预览、Markdown 汇总、保留手写总结 |
| `src/periodic/`     | 周期路径、日期范围、查询                  |
| `src/para/`         | PARA 索引与查询                           |
| `src/dependencies/` | Dataview 状态与等待                       |
| `tests/`            | 单测用 Obsidian API 与内存库替身          |

新增功能应把 Markdown 转换等纯逻辑与 Obsidian 界面、文件操作分开。所有新增文案补齐十种支持语言：英文、简中、繁中、德语、西语、法语、葡语、日语、韩语和阿语。使用公共 Obsidian API，并通过 `registerEvent` 或组件生命周期管理事件、定时器及渲染组件。

## 验证要求

单测通过 esbuild 编译后交给 Node.js 自带测试框架执行，不需要启动 Obsidian。API 替身只用于单测；不能代替真实插件验收。

改动涉及文件写入时，覆盖重复执行、已有文件、缺失模板和并发操作。日期改动覆盖跨年 ISO 周及闰年。初始化和回顾都应保留用户内容；回顾只更新标记之间的自动汇总区域。

交付 UI 或运行时改动前，在真实 Obsidian 测试库中检查：

- 无 Dataview：初始化、快速记录、快速任务、每周回顾可用；查询视图提示安装。
- Dataview 已安装但禁用：查询提示启用；启用并准备索引后可重试。
- 日记模板被删除：已有日记仍可记录；不存在日记时明确提示缺少模板。
- 本周与上周回顾：源笔记链接正确，汇总不生成重复的任务复选框。
- 回顾手写总结：刷新后逐字保留；无有效标记的同名笔记不被覆盖。
- 十种语言文案完整；重点检查阿语 RTL 和窄窗口下的阅读与操作。

保存关键截图，记录测试环境与实际验证结果。不要上传真实笔记、完整插件配置或凭据。

## 提交与发布

贡献说明写清问题、改动后的行为和验证结果。仓库维护者遵守当前工作区约定；外部贡献者可通过 GitHub PR 提交。

开源版独立通过 GitHub Release 发布，不使用 Pro 的激活、签名或服务端发布流程。默认在本机完成构建、测试及产物哈希核验后上传附件；GitHub workflow 仅在明确授权手动运行时构建指定现有 tag 并保存供审阅的 artifact，不自动发布或覆盖 Release。发布前同步 `package.json`、`manifest.json` 和 `versions.json`；插件附件为 `main.js`、`styles.css` 和 `manifest.json`。发行版标题和更新说明默认使用英文，指定语言的本地化说明按对应语言撰写。

可从 [社区贡献任务](docs/community-tasks.md) 选择一个范围小的工作。Obsidian API 与开发流程见 [官方开发文档](https://docs.obsidian.md/)。
