# 开源版快速记录验证记录

> 本文保留首轮实现和当时的验证状态。后续原生编辑器、主题关联和最终验收已完成，当前结果见[原生快速记录验收](native-capture-2026-10-07.md)。以下阻塞已解除。

代码位于独立的 `obsidian-lifeos` 仓库。本次只查阅 Pro 的功能和交互，在开源工程自行实现；未引入 Pro 源码、共享包、产物或付费配置。改动尚未提交或发布。

## 实现范围

连续输入、记录与任务切换、Markdown 工具栏和预览、图片上传与粘贴、笔记链接、历史分页、搜索与多标签和日期组合筛选、全屏、编辑、确认删除、源日记导航和任务勾选。基础捕获和历史读取无需 Dataview。

新记录使用标准 Obsidian 块引用标识，重复内容仍可分别编辑。历史旧记录无需迁移。原子写入检查完整源记录；变化或歧义会拒绝覆盖并保留输入草稿。编辑保留时间、块标识和完成状态。周回顾保留多行记录为一个条目，仍单独统计子任务。

这次没有移植 Pro 的所见即所得富文本编辑器和主题关联系统，编辑使用 Markdown 输入与渲染预览，关联笔记使用普通 Obsidian 链接。

## 已完成检查

- 本机受 `dev-gate` 管理的定向验证通过 26 项测试：历史解析、过滤、编辑与删除、过期写入与重复块保护、任务、代码示例排除、自定义日记名、CRLF、块引用、十种语言、缓存失效、旧版附件 API 回退、并发捕获和周回顾集成。
- 本次新增或修改的快速记录源码、Markdown 解析和周回顾解析通过定向 Biome 检查，`git diff --check` 通过。
- 较早实现曾通过 37 项完整测试和生产构建；此结果不代表之后的源码改动已完成最终构建。
- 较早产物已在 macOS Obsidian 1.14.3 的隔离 profile / scratch vault 实测，无 Dataview，使用 mock keychain。通过连续保存、60 篇历史日记分页、搜索和多标签筛选、编辑恢复原草稿、外部修改后的拒绝写入、图片预览与保存、根任务和子任务勾选、删除确认和取消。中文全屏与 480px 窄窗口已截图并视觉核对。
- 首轮 UI 脚本在最后的关闭按钮定位处超时，尚未完成重新打开状态和其余语言的完整验收。已修正自动化关闭方式，等待最终产物后重跑。
- 对照 npm 官方 `obsidian@1.4.0` 类型声明：`vault.process`、`createBinary`、`generateMarkdownLink` 和 Markdown 渲染均存在，公开的附件路径 API 不存在。实现已做能力检测，旧版回退到库内 `LifeOS Attachments`。没有把 1.14.3 实测当作 1.4.0 实测。

## 当前阻塞与续跑

最终源码的完整测试、类型检查和生产构建两次排队均超时，任务没有启动。当时本机两个 heavy 名额分别被其他会话的 `studio_3` Git 检查链和 Aino Mobile Android 构建占用。未结束其他会话进程、删除锁或绕过限流。

尝试使用既有 Omarchy SSH 节点分担 Linux 构建；mDNS 解析失败、已知局域网地址连接超时，Tailscale 只读状态显示节点离线。没有传输代码、启动远端任务或调整网络。

待本机额度释放后，运行：

```bash
cd /Volumes/T5/personal/obsidian-lifeos
~/.local/bin/dev-gate run --label oss-quick-capture-complete -- sh -c 'pnpm test && pnpm build'
~/.local/bin/dev-gate run --kind runtime --label oss-capture-live -- node .verify/quick-capture-20261007/runtime.mjs
~/.local/bin/dev-gate run --kind runtime --label oss-capture-locales -- node .verify/quick-capture-20261007/locales.mjs
```

本地 UI 脚本使用已安装的 Electron/Playwright 作为自动化工具，只生成独立 profile 和测试库，不读真实笔记。`runtime.mjs` 中图片测试文件目前指向 `/tmp/lifeos-capture-fixture.png`；已留副本 `fixture.png`，若原文件不存在，先恢复它。脚本成功后会保存所测产物 SHA-256、各语言结果并清理本次实例。Linux 构建仍不能替代 Mac 上的 Obsidian 验收。

证据目录：`/Volumes/T5/personal/obsidian-lifeos/.verify/quick-capture-20261007/`。现有 `zh-cn-capture.png`、`zh-cn-fullscreen.png` 和 `zh-cn-narrow.png` 为上述较早产物的实际运行截图；`source-inputs.json` 保存最终源码输入哈希。待最终验收完成后更新本记录，不能将当前截图宣称为最终源码的完整验收结果。
