# 多语言工作库

开源版支持英文、简体中文、繁体中文、德语、西班牙语、法语、葡萄牙语、日语、韩语和阿拉伯语。初始化向导、快速记录、每周回顾和内置模板采用同一套语言选择；PARA 目录、日常记录标题和模板查询位置一起配置。

显示语言可在插件设置中修改。工作库的模板语言记录在 `.lifeos/template-profile.json`，初始化后保持固定，避免改名导致链接和查询失效。再次初始化只补缺失的文件，保留自定义内容。区域语言会规范化，例如 `pt-BR` 对应葡萄牙语，`ko-KR` 对应韩语，`zh-Hant-HK` 对应繁体中文；不支持的语言回退到英文。

对应的开源示例仓库为 `quanru/obsidian-example-lifeos`。`examples/<language>/` 中包含带最小示例的 `LifeOS Vault` 和供个人使用的 `LifeOS Blank Vault`。包内配置与模板语言一致，不附带插件二进制；在 Obsidian 的第三方插件设置中安装并启用 LifeOS 和 Dataview。初始化、快速记录和每周回顾不依赖 Dataview，查询块依赖 Dataview。

维护多语言时，先修改开源插件中的公开模板和翻译，再运行：

```bash
node scripts/export-example-copy.mjs ../obsidian-example-lifeos/i18n/starter.json
```

在示例仓库中生成并检查：

```bash
node scripts/examples/generate.mjs
node scripts/examples/generate.mjs --check
python3 scripts/examples/package.py
```

该流程只导出开源版内容，不读取 Pro 源码、资源或真实个人库。检查配置、模板、目录、空白库的内容边界后，在隔离 Obsidian 仓库中验证语言选择、初始化和日记标题。公开下载更新仍需单独发布；生成 ZIP 不代表线上已更新。
