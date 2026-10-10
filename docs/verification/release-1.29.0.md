# LifeOS 1.29.0 发布前验收

2026-10-10，开源插件正式附件由本地 main 的普通主题实现构建，manifest / package / versions 三处版本一致。已通过生产构建、85 项单测、10 语言主题文案完整性检查。

Obsidian 1.14.3、Dataview 0.5.68、macOS 独立 profile / 临时示例库的正式附件回归通过：普通主题创建、快速记录关联及写入源日记、任务写回、日记快照、主题搜索、两种名称同步、重名保护、PARA 快照和首标签关联。被测附件固定在 `.verify/release-1.29.0/artifacts/`，结果及截图在同目录上级；实例及临时库已清理。

调试回归中出现过间歇性 Chromium `illegal access` 字符串异常，无源码位置；另有宿主 ResizeObserver 布局警告。已增加原始 CDP 异常和窗口 error 事件记录；最终完整回归无 CDP / pageerror 异常，但布局警告仍存在。未证明 `illegal access` 的根因，不将其写成已修复；功能断言在各轮均通过。后续若用户运行时出现对应可见故障，需继续定向复现。

被测主文件 SHA-256：`59884a77e8b31a1e6f2eb88f8367fd24495782c76e18b9709647c844e1df847f`。

manifest SHA-256：`97eaee14ae2ef4f84d0c0f758ed42925b1ba1f8f05acbee89762b6e4bd36a87c`。

配套 Examples 1.20.0：770 文件、10 语言、每语言 4 类库，生成与打包校验通过，不含插件二进制。未运行移动端及最低版本宿主实测，不使用桌面结果替代。发布后另存公开附件下载及 digest 校验回执。
