# 开源插件 1.28.2 发布前验证

2026-10-07，本机 dev-gate 下的 67 项测试、TypeScript 检查、生产构建、定向 Biome lint 和差异空白检查通过。本次仅调整快速记录历史卡片的结构和间距，更新相关使用文档。

待发布产物在 macOS Obsidian 1.14.3 的独立 profile / scratch vault 中使用 mock keychain 实测：单行带主题卡片高 91.5px，多行正文和列表自然撑高；正文与操作按钮不重叠，480px 窄窗口无卡片内部横向溢出，编辑态保留不少于 145px 的编辑器高度。查看及进入编辑不写入日记，renderer 无错误。十种语言的卡片及主题弹窗完成布局检查，中文、阿语窄窗口已截图。

此次是布局验收，没有声明完整键盘交互回归通过；此前完整流程尝试的限制见[卡片布局验收](capture-compact-2026-10-07.md)。语言布局使用固定合成草稿。最低版本和移动端没有新增实测证据。没有读取真实笔记，也没有触发远程 CI。

证据目录：`/Volumes/T5/personal/obsidian-lifeos/.verify/release-1.28.2/`。`results.json`、`locales/results.json` 绑定被测产物 SHA-256，`source-inputs.json` 固定构建输入，`artifacts/` 保存待发布附件。

最终附件：

- `styles.css`：`a34772f4d58853c4ca32ca3e25d5c6f777fb3da345b5a94e4fab41cd94528a15`。
- `obsidian-periodic-para-1.28.2.zip`：`1094e8bfd7d1a2ac17992413251a7bed7609d5ede29b028215cfe7b19fb5f8c9`。
- `main.js`：`383d777c4fc2b0f421a5d52d25e524a1060635cb58ee509f0553324e9d16d2b1`。
- `manifest.json`：`ffd20889f4ed4b9c33b97cda90a91ccfb742ef43b90d682ba890fb7f26b2112e`。

线上发布与附件核验回执保存于 `release-1.28.2.json`。
