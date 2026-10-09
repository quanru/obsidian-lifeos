# 开源插件 1.28.3 发布前验证

2026-10-09，本机 dev-gate 下的 77 项测试、TypeScript 检查、生产构建、26 个变更文件的定向 Biome 检查及差异空白检查通过。使用独立开源仓库的依赖、产物和发布流程，没有引入 Pro 源码、构建产物、私有配置或发布签名，没有触发远程 CI。

待发布附件在 macOS Obsidian 1.14.3、独立 profile / scratch vault、mock keychain 中完成四组实际验证：

- 项目快照：启用 Templater，分别关闭、开启自动执行，通过 LifeOS 创建日记，生成真实项目链接及条件段落；450 ms 异步模板只执行一次。旧版故障依据 2026-10-08 的既有发行包实测，本轮不声明旧版基线复测通过。
- 任务刷新：LifeOS 标签查询完成与恢复均更新；周期完成查询会移除恢复的待办，周期记录查询同步复选框。第三方 Tasks 查询也完成合成数据核验，但不把该结果当作反馈者的具体查询已恢复。
- 快速记录：习惯和其他子标题条目排除，无时间占位符；领域与标签同排，宽窄窗口按钮栏完整可见，切换类型保留草稿，连续保存保持类型，记录与任务分别写入正确 Markdown，卡片类型转换和习惯段落保留通过。
- 新库及设置：无 Dataview 初始化、保留已有笔记、创建 PARA 项目、主题关联及跳转、任务录入和完成、今日记录定位、只读接管配置与链接通过。每周回顾命令已移除，旧回顾文件及手写内容保持原样。

项目快照测试使用 Templater 2.16.4；任务查询使用 Dataview 0.5.68 和 Tasks 7.22.0。所有本次创建的隔离 Obsidian、profile 与临时 vault 已结束并清理。没有新增最低 Obsidian 版本或移动端实测声明；本轮未重跑十种语言的全部 UI，已有语言字典和单测保留。

证据目录：`/Volumes/T5/personal/obsidian-lifeos/.verify/release-1.28.3/`。`source-inputs.json` 固定构建输入；`runtime-passed.json` 记录四组通过；`snapshot/`、`tasks/`、`capture/`、`workspace/` 保存断言与关键截图。快照、卡片和设置的运行时记录均核对到相同待上传附件。

最终附件 SHA-256：

- `main.js`：`d8a4b217094b3d02752e6e6c4e7afda6267e75c42981115bf39390a1d59d1463`。
- `manifest.json`：`20cb0504819aa820e51839e1e2f9906b921fe1c314ab3147a03e96cece933b24`。
- `obsidian-periodic-para-1.28.3.zip`：`dff4964bc6ee476e8b761cdbc5e605fc4a5cc05315ba34c44cae9a1cec7f4c03`。
- `styles.css`：`b822b50c7da25dffd1dfaf93415a4e4885d9c65eeb9d1f7a172ff1d8497606ea`。

线上发布及下载校验回执将在 `release-1.28.3.json` 中保存。
