# Obsidian LifeOS

> Previously Used Name: Obsidian Periodic PARA

<p align="center"><a title="中文版本" href="https://github.com/quanru/obsidian-periodic-para/blob/main/README-ZH.md">中文版本</a>  |  English Version</p>

<a href="https://obsidian.md/blog/2024-goty-winners/">🔥 LifeOS for Obsidian won the third place 🥉 in the Best Templates category at the 2024 Obsidian Gems of the Year awards!</a>

<a href="https://www.producthunt.com/posts/lifeos-template-for-obsidian?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-lifeos&#0045;template&#0045;for&#0045;obsidian" target="_blank">
  <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=441390&theme=light" alt="LifeOS&#0032;Template&#0032;for&#0032;Obsidian - Obsidian&#0032;LifeOS&#0032;&#0045;&#0032;Your&#0032;Life&#0032;Management&#0032;Assistant&#0033; | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" />
</a>

- This is a plugin for [LifeOS](https://quanru.github.io/2023/07/08/Building%20my%20second%20brain%20%F0%9F%A7%A0%20with%20Obsidian/), which assist in practicing the PARA method with periodic notes and [usememos](https://www.usememos.com/).
- It is recommended to download the [LifeOS-example](https://github.com/quanru/obsidian-example-LifeOS/tree/main) to experience it.
- For more tutorials, please go to [LifeOS for Obsidian Official Site](https://lifeos.vip/)

![](https://obsidian-life-os.pages.dev/plugin/periodic-para-plugin-en.png)

初始化向导、快速记录、模板和目录配置现已支持英、简中、繁中、德、西、法、葡、日、韩、阿拉伯语。对应的开源示例库提供每种语言的示例版和空白版，维护方式见[多语言工作库](docs/multilingual-workspaces.md)。

## 主题笔记，无需绑定 PARA

独立启用主题笔记，创建带标签的主题目录与索引，关联快速记录，查看相关任务、记录和资料，并生成日记主题快照。支持 README 与同名索引、模板、列表搜索和可选名称同步。详见[主题笔记指南](docs/theme-notes.md)。十种语言均提供普通主题示例版和空白版；原有 PARA 配置及笔记保留。

## 免费功能与独立 Pro 插件

快速记录、基础任务录入、主题关联均完整免费。设置中的「使用与升级」提供快捷入口、只读目录配置预览，以及独立收费插件 LifeOS Pro 的静态推广链接。本插件没有付费解锁，也不会自动安装 Pro。新增推广区不加载远程广告、不发送遥测、不上传笔记；官网仅在点击链接时打开，携带固定渠道参数。已有可选 usememos 集成独立配置。

通过「今日记录」命令可打开今日日记并定位到记录段落。切换插件前请阅读[接管指南](docs/pro-handover.md)。本仓库不包含 Pro 源码、私有配置或激活数据。

## Features

- 首次启用时提供初始化向导，可选择“周期笔记 + PARA”或“仅周期笔记”，并以十种支持语言之一生成工作区。初始化后会保留所选方案，后续修复不会覆盖已有文件。
- 内置日、周、月、季度、年度以及 Projects、Areas、Resources、Archives 基础模板。
- 可选示例工作流与五分钟完成指南会引导用户完成首次记录；示例未被修改时可以安全移除。
- “快速记录”支持连续输入、原生实时预览、图片、任务、PARA 主题关联、历史浏览、组合筛选与编辑管理，内容直接保存在日记中。见[快速记录说明](docs/quick-capture.md)。
- 初始化、快速记录无需 Dataview；查询视图仍使用 Dataview，并会提示安装、启用或等待索引。
- 周记使用 ISO 周（周一至周日）；已有周记不会自动迁移。
- LifeOS Basic: https://lifeos.vip/plugin/lifeos/life-os.html
- **LifeOS Pro** : https://lifeos.vip/plugin/lifeos/life-os-pro.html
- **DeepAsk AI Assistant** : https://lifeos.vip/plugin/deepask/deepask.html
- 多语言界面：默认跟随 Obsidian 当前语言，也可以在插件设置页手动切换语言。

## 开发与贡献

请阅读 [贡献指南](CONTRIBUTING.md) 和 [社区贡献任务](docs/community-tasks.md)。最低支持 Obsidian 1.4.0。

## Support

- [🎮 Discord](https://discord.gg/HZGanKEkuZ)
- [💬 Telegram](https://t.me/+OLTasChvEEthMjBl)
- [🐦 LifeOS for Obsidian](https://twitter.com/lifeos_md)
- [🐦 Twitter](https://twitter.com/quanruzhuoxiu)
- [📺 Youtube](https://www.youtube.com/@LeYangLin)
- [🧑‍🔧 Bento](https://bento.me/leyang)
- [📧 Email](mailto:quanruzhuoxiu@gmail.com)

## Acknowledgements

Also, I relied on the code from these excellent plugins, vault, and inspirations:

- [PARA](https://fortelabs.com/blog/para/). Thanks to Tiago Forte for inventing such a great organizational method.
- [PARA Starter Kit](https://forum.obsidian.md/t/para-starter-kit/223). Thanks to cotemaxime for creating such a great starter vault.
- [obsidian-periodic-notes](https://github.com/liamcain/obsidian-periodic-notes). Gave me the inspiration to develop this plugin.
- [obsidian-dataview](https://github.com/blacksmithgu/obsidian-dataview). The underlying plugin uses dataview's query interface.
- [Templater](https://github.com/SilentVoid13/Templater). Provides decoupled template creation, allowing a very large number of plugins to create files with the help of it.

## Donations

If this plugin do help you, please buy me a cup of coffee on [buymeacoffee](https://www.buymeacoffee.com/leyang).

In addition, you can also support me in further developing a better LifeOS by purchasing the [LifeOS Pro](https://lifeos.vip/plugin/life-os-pro.html)!

---

Or Alipay

<img alt="Alipay" src="https://quanru.github.io/img/alipay-qr.jpg" width="200"/>

---

Or WeChat

<img alt="WeChatPay" src="https://quanru.github.io/img/wechat-qr.jpg" width="200"/>
