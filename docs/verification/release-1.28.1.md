# 开源插件 1.28.1 发布前验证

2026-10-07，本机 dev-gate 下的 67 项单测、TypeScript 检查、生产构建、定向 Biome lint 和差异空白检查通过。此次仅发布快速记录交互精简和宿主命令上下文修复；不修改示例库，不套用 Pro 发布配置。

待发布产物在 macOS Obsidian 1.14.3 的独立 profile / scratch vault 使用 mock keychain 验证。实测简化底部按钮、源码菜单、日期及标签筛选、分页、卡片编辑及冲突保护、复制、定位来源、任务连续保存、完成状态、系统图片粘贴、Cmd+B、Cmd+Enter、Esc 和关闭后恢复原编辑器。关闭未保存卡片不写入日记，renderer 无错误。

十种语言的输入窗口和主题选择器通过检查，中文及阿语 480px 窄窗口已截图。右键菜单通过宿主公开 DOM 菜单模式验收；产品保留默认菜单。最低支持版本 1.4.0、移动端未做运行实测。没有读取真实笔记、修改真实 profile 或触发远程 CI。

证据目录：`/Volumes/T5/personal/obsidian-lifeos/.verify/release-1.28.1/`。`results.json`、`locales/results.json` 绑定待发布产物 SHA-256，`source-inputs.json` 记录构建输入，`artifacts/` 保存附件快照。所有本次隔离实例及临时库已关闭、清理。

最终发布附件：

- `main.js`：`68759099d32132e074aad6c1ebc0cdc48e5f6926be594f69046d0c51cb486d9c`。
- `styles.css`：`d27d2f59bd225ffa783408f5b187f1c2791d09b176a403e86785d08e32883014`。
- `manifest.json`：`1b4036396c848546de4fc3100047c7bd1eff5911f7861d4a67e95821fa442e30`。
- `obsidian-periodic-para-1.28.1.zip`：`14e3e730e87b12c06611c60f615fc8ea03607f7e8e5fb1227e8c55c528705e76`。

线上发布结果和下载附件核验记录保存在 `release-1.28.1.json`。
