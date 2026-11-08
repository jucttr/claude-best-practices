---
title: Claude Code 项目级配置 · 学习样本
type: overview
tags:
  - AI学习/ClaudeCode
  - AI学习/skill
  - AI学习/subagent
created: 2026-10-22
updated: 2026-11-08
aliases:
  - Claude 最佳实践模板
---

# Claude Code 项目级配置 · 学习样本

把当前目录当成一个真实项目根目录来读：`.claude/` 是它的一层配置，`CLAUDE.md`、`CLAUDE.local.md`、`.mcp.json` 与它并列放在项目根。配置按真实布局摆放，可以直接在这里启动 Claude Code 实测，不用先搬家、不用改路径。

它覆盖的是 **Claude Code 的项目级扩展层**——自定义知识、连接外部服务、把重复动作交给 hook 和 skill。只到项目级为止，`~/.claude/` 那套个人配置不在这里，也不在讨论范围内。

## 一、它是什么，不是什么

| 它是什么                | 它不是什么                |
| ------------------- | -------------------- |
| 一份按真实项目布局摆放的完整项目级配置 | 不是能 `npm install` 的包 |
| 一组能单独拿走用的上下文管理方案    | 不是脚手架或生成器            |
| 一套配过一遍、踩过坑、留了说明的样本  | 不是官方文档摘要             |

## 二、为什么按真实项目来摆

配置这件事，麻烦通常不在「某个字段怎么写」，而在三件事上：

1. **常驻文件越写越长。** `CLAUDE.md` 每次会话全量加载，把部署手册、审查清单、目录说明都塞进去，等于每轮对话都为它们付一次 token；官方建议压在 200 行内。
2. **重复流程混在规则里。** 每次都要做的事适合 hook，只在特定场景才用的流程适合 skill，和「红线」不是一回事。混在一起，既难维护也难触发。
3. **放错位置不会报错，只会静默失效。** `.mcp.json` 只能放项目根，放进 `.claude/` 就读不到；`.claude/settings.json` 要从会话主工作目录读。这类坑没有报错信息可查。

所以这份样本没写成一份「配置清单」，而是按真实项目摆一遍：哪些文件每次会话都读、哪些命中才读、哪些只给人看，从目录上就能分出来。

## 三、能拿走什么

三样可以单独复用的东西，彼此没有依赖，只取其中一件也成立：

| 组件 | 可复用的是 |
| --- | --- |
| subagent 定义 | 一份完整的只读审查 agent：`tools` / `memory` / 分级报告门槛表怎么组合 |
| skill 编写规范 | 写 skill 的结构、触发条件、frontmatter 两层口径与加载机制；另附一个只能显式调用的任务型 skill 作对照 |
| 项目级配置 | `.claude/settings.json` 里权限、sandbox、插件与 hook demo 的配法，`.mcp.json` 的团队共享边界 |

`.claude/commands/` 里的斜杠命令是最小示例。

## 四、怎么开始用

**前提**：把当前目录当成项目根，从这一层启动 Claude Code。共享设置从会话主工作目录读取，从别处启动会读不到这份配置。

**先跑一次，看配置是不是真的在：**

- 说一句「帮我 review 一下这段改动」，或用 `@senior-code-reviewer`，看只读审查 agent 是否被唤起——它只出分级报告，不动代码。
- 输入 `/security-review HEAD`，看任务型 skill 怎么把 `git diff` 带进上下文。它设了 `disable-model-invocation: true`，只能显式调用，这是「不希望模型自作主张启动」的写法。
- 输入 `/fix-issue <issue 号>`，看斜杠命令的最小形态。
- `/status` 的 **Setting sources** 一行列出本次会话读了哪些配置文件，`claude doctor` 列出被拒绝的条目。这两处是确认「生效了没有」的地方。

`.mcp.json` 里的两个 server 是占位示例：交互式会话要先审批，且依赖 `MCP_DB_DSN` / `MCP_API_TOKEN` 等环境变量。不配就连不上，这不是配置写错了。

**挪到自己的项目时：**

- 一起提交给团队的：项目根的 `CLAUDE.md` 与 `.mcp.json`，以及 `.claude/` 下要自动加载的那几层（settings、agents、skills、commands、rules）。
- 不提交的：个人偏好放 `CLAUDE.local.md`，个人覆盖放 `.claude/settings.local.json`，通常加进 `.gitignore`。
- 先把示例值换成自己的（组织名、插件、域名白名单、MCP server 地址与凭据），再逐项确认生效。`README.md`、`AGENTS.md`、`docs/` 是说明，不属于要搬走的配置。

> [!tip] 位置边界
> `.mcp.json` 只能在项目根，`CLAUDE.local.md` 只在项目根，`CLAUDE.md` 项目根与 `.claude/` 两处都读（本仓库按官方示例放项目根）。放错的共同特点是不报错、静默读不到；逐项依据见 [[docs/settings_README|settings_README]] 与 [[docs/mcp_README|mcp_README]]。

## 五、文档地图

`docs/` 下 11 篇，按你想解决的问题挑：

**想知道某个键怎么写、为什么不生效**

- [[docs/settings_README|settings.json 使用指南]] — 逐键对齐本目录取值、生效时机、静默失效的地方
- [[docs/mcp_README|.mcp.json 团队共享配置指南]] — 作用域优先级、审批、凭据边界

**想读官方原文（7 篇，中文）**

- [[docs/ClaudeCode官方文档/Claude Code 如何工作|Claude Code 如何工作]]
- [[docs/ClaudeCode官方文档/Claude 如何记住您的项目|Claude 如何记住您的项目]]
- [[docs/ClaudeCode官方文档/扩展 Claude Code|扩展 Claude Code]]
- [[docs/ClaudeCode官方文档/使用 skills 扩展 Claude|使用 skills 扩展 Claude]]
- [[docs/ClaudeCode官方文档/创建自定义 subagents|创建自定义 subagents]]
- [[docs/ClaudeCode官方文档/使用 hooks 自动化操作|使用 hooks 自动化操作]]
- [[docs/ClaudeCode官方文档/Hooks 参考|Hooks 参考]]

**想看调研与排查**

- [[docs/Claude-Code-token-消耗排查与优化-2026-11|token 消耗排查与优化]] — 上下文成本怎么观测、怎么降
- [[docs/Claude-Code-harness-社区实践现状-2026-11|harness 社区实践现状]] — 配置生态与版本沿革、`AGENTS.md` 与 `CLAUDE.md` 的差异

## 六、维护约定

给维护者 Agent 看的规范在 [[AGENTS|AGENTS.md]]：它回答「怎么干活、要守什么」，本文件只回答「这是什么、为什么、怎么用」。改配置前先读它。
