# 开源插件 1.28.0 发布前验证

2026-10-07，在本机 dev-gate 下执行 67 项单测、类型检查、生产构建和定向 Biome lint，全部通过。新增根目录 / 尾斜杠 ISO 周路径回归；修复原生编辑器上下文导致普通笔记切换报错，回顾隐藏内部记录标识。

用待发布 ZIP 解压得到的英语、韩语示例库和简中、阿语空白库，安装待发布插件产物与 Dataview 0.5.68，分别在 macOS Obsidian 1.14.3 的隔离 profile / scratch vault 验证：初始化 / 修复、打开今日、原生输入与保存任务、真实项目查询、回顾预览 / 保存 / 刷新。四组均通过，手写总结保留，任务不重复，renderer 无错误，阿语 RTL 断言通过。

证据目录：`/Volumes/T5/personal/obsidian-lifeos/.verify/release-1.28.0/`。`results.json` 记录真实宿主、四组结果及被测附件 SHA-256；`source-inputs.json` 固定构建输入。关键截图为 `ar-blank-capture.png`、`ko-example-project.png`、`zh-cn-blank-review.png`。Obsidian 宿主语言为中文，不把宿主设置文字认作插件语言。

没有修改真实 profile、笔记或凭据，没有触发远程 CI。所有本次隔离实例及临时库已关闭、清理。最低版本 1.4.0、移动端未做运行实测；原生编辑器初始化失败时回退到 Markdown 输入。

最终产物：

- `main.js`：`4152071fe1cef6be8822116e5a8d53932c5cc2e3090df875dbfde4c284e00f7d`。
- `styles.css`：`52f2fa6228e5067533f0203f0ca7e8965ccc571a4909ce98e8064174219192a2`。
- `manifest.json`：`6b128d1a7cf37cafc986cb04c0d317e0bf1e4b279ed263bc2492ee7867c1cbf8`。

同一最终产物另通过快速记录交互回归：工具折叠、日期分组、滚动加载、日期 / 标签组合筛选、卡片内编辑、刷新与冲突保留草稿、复制、双击定位、窄窗口、任务类型重置及完成状态保留。证据在 `interaction/results.json`，产物三项哈希与首次使用验证完全一致。
