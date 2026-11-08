---
title: Claude Code harness 在开发者社区的实践现状（2026-11）
aliases:
  - Claude Code 配置生态调研
  - harness 实践现状
tags:
  - AI学习/ClaudeCode
  - AI学习/harness
  - AI学习/调研
type: analysis
created: 2026-11-07
updated: 2026-11-07
sources:
  - arXiv:2602.14690
  - arXiv:2602.11988
  - agents.md
  - agentskills.io
  - claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more
---

# Claude Code harness 在开发者社区的实践现状

> [!abstract] 一句话结论
> 这套 `.claude/` 配置**没有被整体沿用**：社区里真正在跑的是它的最薄一层（常驻指令文件），`skills / subagents / hooks / rules / commands` 在公开仓库中的采用率是个位数到 20% 以下。近半年的主线不是「把 harness 配得更全」，而是三件事——**把常驻文件收敛成一个跨工具标准（AGENTS.md）**、**把知识搬进按需加载的开放格式（Agent Skills）**、**把配置变成可分发可治理的单元（Plugins / Marketplaces / Mods）**。

> [!warning] 先说证据口径
> 检索时间 2026-11-07，重点窗口 2026-05 至 2026-11；2025-08 / 2025-12 的标准起源、2026-02 的实证快照作为背景保留，均单独标日期。
> - **A 级**：官方博客 / 规范站 / changelog / 权威论文 / 真实 GitHub PR / HN 原帖，本文判断主要建立在这类材料上。
> - **B 级**：二手转述站、SEO 博客、聚合站。这类材料在这一轮检索里占比很高，**互相矛盾明显**（例如 `obra/superpowers` 的 star 数在不同站点分别是 94k / 218k / 249k / 250k；Agent Skills 支持工具数分别写 25+ / 26+ / 30+ / 40+）。本文不采用这些数字做定量结论，只在标注为「二手、未独立核实」时引用。
> - 有一处典型错误值得记下：2026 年下半年仍有博客写「Claude Code 至今不读 AGENTS.md、GitHub issue 无时间表」（如 hanzla-baig-blogs.vercel.app），而 `2.1.277` 已于 2026-09-18 落地。**不要用二手博客判断版本状态。**

---

## 零、口径：这里的「这套 harness」指什么

对照当前目录，被讨论的对象是一份**项目级、提交进 git 的 `.claude/`**：

| 组件 | 在 harness 里的角色 |
| --- | --- |
| `CLAUDE.md` | 每次会话全量加载的常驻指令 |
| `agents/` | 独立上下文窗口的 subagent 定义 |
| `skills/` | 元数据常驻、正文命中才加载的技能包 |
| `commands/` | 单文件斜杠命令 |
| `rules/` | 全量或按路径作用域加载的规则 |
| `hooks`（`settings.json` 键） | 生命周期节点上运行自定义命令 |
| `settings.json` | 权限、沙箱、hook、插件市场 |

> [!note]- 一个术语上的错位，先摆出来
> 「用这套 harness 支撑 **vibe coding** 工作流」这个提法，在近半年的公开讨论里已经站不住了。vibe coding 的原义（Karpathy 2025-02）是「不看代码、接受输出、凭感觉迭代」；harness 恰恰是把约束、验证、审批**写死**在模型外面。Google 2026-05 白皮书把两者明确放在同一条光谱的**两端**，Karpathy 本人 2026-02 起改用 `agentic engineering`。所以更准确的说法是：**这套 harness 是用于退出 vibe coding 的工程装置**，不是支撑它的工具。下文按这个区分来写。

---

## 一、现有配置使用情况

### 1.1 硬数据：整套沿用是少数，只用常驻文件才是主流

最有力的证据是 **arXiv:2602.14690《Harness Engineering for Agentic AI Coding Tools: An Exploratory Study》**（Galster、Mohsenimofidi、Lulla、Abubakar、Treude、Baltes；v1 2026-02-16，v5 2026-06-30；发表于 AIware 2026）。它扫了 **2,853 个 GitHub 开源仓库**、覆盖 Claude Code / GitHub Copilot / Cursor CLI / Gemini CLI / Codex CLI 五个工具，把仓库里的配置产物归纳成 8 类机制。数据快照是 **2026-02**，略早于本文半年窗口，但它是目前唯一可量化的横截面基线。

| 发现 | 数字 | 出处 |
| --- | --- | --- |
| 有 Context Files 的仓库 | **2,586 / 2,853（90.6%）**，共 4,768 个文件 | §6.1 |
| 三类常驻文件占比（文件数） | `CLAUDE.md` 1,640（34.4%）｜`AGENTS.md` 1,508（31.6%）｜`copilot-instructions.md` 1,393（29.2%） | §6.1 |
| 只用 `AGENTS.md`、无任何工具专属配置 | **493（17.3%）** | §5.1 / Table 2 |
| 除 Context Files 外的机制 | 在 Claude / Copilot / Cursor / Gemini 中**均 ≤20%**（例外：Cursor Rules 72.8%、Gemini Settings 62.3%） | §5.2 / Figure 3 |
| Skills | **601 个 / 158 个仓库（≈5.5%）**，中位每仓库 2 个 | §6.2 |
| Skills 不带任何附加资源 | **514 / 601（85.5%）**；仅带 `scripts/` 35 个（5.8%），含 scripts 的全部组合 ≈7.8% | §6.2 |
| Subagents | **450 个 / 131 个仓库（≈4.6%）** | §6.3 |
| 使用 subagent 持久化记忆的仓库 | **0** | §6.3 / Conclusions |
| 单工具仓库 | 2,015（70.6%）；配置 3 个以上工具仅 50（1.8%） | §5.1 |

论文自己的判断可以直接引用：

> 「Developers widely adopt the static context mechanisms … but rarely the executable and external ones … **Harness engineering in open source today is therefore mostly context engineering.**」

另一个方向性发现：`CLAUDE.md` 通常先建、`AGENTS.md` 后加；**`CLAUDE.md → AGENTS.md` 的引用出现 301 次，`AGENTS.md` 收到 353 个入向引用**，远超其他文件类型。作者称这是「bottom-up convergence on AGENTS.md across tools, driven by developer practice rather than vendor mandate」。同文也指出工具生态分化：**Claude Code 仓库使用的机制范围最广**，Cursor 偏重 Rules / Commands，Copilot 极少超出 Context Files。

> [!warning] 论文的边界，别拿它当全行业结论
> 作者自列的三条限制：只覆盖 GitHub 开源仓库（企业内可能不同）、**只检测配置文件是否存在、不证明该工具被真正使用**、2026-02 时点快照且「工具约定演进很快，新机制可能尚未被捕获」。最后一条很关键——本文第二部分的多数变化都发生在快照之后。

### 1.2 官方自己正在拆散这套 harness

**Anthropic 官方博客《Steering Claude Code: …》，2026-06-18**（`claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more`）给出七种机制的对照表，核心是按「加载时机 / compaction 行为 / 上下文成本 / 权威等级」把职责分开：

- `CLAUDE.md`：**保持 200 行以内**，只放构建命令、目录结构、团队规范；官方原话点名反模式「the over-specified CLAUDE.md」，重要规则「get lost in the noise」。
- **流程性指令 → skills**；**「永不许做 X」→ hooks 或权限**（Markdown 只是建议，hook 是确定性执行）。
- `rules/`（`.claude/rules/`）用 `paths:` frontmatter 做路径作用域，`src/api/**` 这类规则在文档任务里根本不进上下文。
- subagents 只返回最终摘要，可嵌套 5 层；hooks 有 command / HTTP / mcp_tool / prompt / agent 五类。
- 收尾建议：**把 skills、subagents、hooks、output styles 打包成 plugin 供团队共享**。

也就是说，官方近半年的指导方向是「让 `CLAUDE.md` 变薄、把内容分流」，而不是「把七件套配齐」。

### 1.3 社区实际在做的：瘦身、去重、换入口

**真实项目实践（A 级）**：`d4rken-org/sdmaid-se` PR #2586，2026-07-28 合并。用 `paths:` frontmatter（Claude Code 2.1.198+ 支持）把 testing / localization / automation / release / build 规则改为按文件匹配加载，**常驻指令载荷从 ~31KB 降到 ~15KB**；同时删掉一份只重复了工具默认行为的 `agent-instructions.md`，以及和 `settings.gradle` 重复的模块枚举。PR 描述里有一句很实在的话：有两条规则无法路径触发（必须先于文件打开生效），所以挪进 `CLAUDE.md` 的「Rules Loading」段。

配套的版本修复：**Claude Code 2.1.288（2026-10-02）** changelog 记录「path-scoped `.claude/rules` 与嵌套 `CLAUDE.md` 现在在 Write / Edit 触及作用域内文件时也会加载；此前仅 Read 触发」——说明这个机制在近半年仍在补洞。

**另一处已经变了的事实**：自定义斜杠命令已并入 skills。自 v2.1.3 起，`.claude/commands/deploy.md` 与 `.claude/skills/deploy/SKILL.md` 生成同一个 `/deploy`，重名时 skill 优先；旧命令文件继续可用、无宣布退役日期（Anthropic skills 文档，经 `aireviewrating.com` 2026-09-27、`buildthisnow.com` 迁移指南、`github.com/luongnv89/claude-howto` 转述）。**保留 `commands/` 空目录作为学习样本没问题，但它已不是当前推荐形态。**

**中文社区的收敛写法**：多篇 2026 年实践文（掘金《Vibe Coding 开发项目的基本范式》、`giscafer.com/blog/post-81`《Vibe Coding团队最佳实践》、腾讯云开发者社区 2026 年《从 Vibe Coding 到 Agentic Engineering》）不约而同给出同一套三层结构——`AGENTS.md` 作为唯一事实源、`CLAUDE.md` 只写一行 `@AGENTS.md` 加 Claude 专属补充、`SKILL.md` 放情景化知识，并明确「工具专属文件只做薄适配层」「共享规则进 AGENTS.md，细节链到 docs/」。**这是讨论层面的共识，不是采用率数据**，中文社区缺乏类似 arXiv 的量化抽样。

### 1.4 一个不舒服的反证：用得最多的那层，效果证据最弱

**arXiv:2602.11988《Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?》**（Gloaguen、Mündler-Sasahara、Müller、Raychev、Vechev，ETH Zurich / LogicStar.ai；2026-02 首发，**v3 2026-06 修订**）。摘要原文：

> 「providing context files does not generally improve task success rates, while increasing inference cost by over 20% on average … instructions in the context files are well followed by coding agents, **repository overviews … are not helpful**.」

设计：SWE-bench Lite（11 个流行 Python 仓库）+ 自建 **CTXbench（138 个 issue / 12 个带开发者手写上下文文件的小众仓库）**，四组 agent-model 配置。结论是「上下文文件适合声明**非标准编码实践**，但任何以提性能为目的的尝试都应在部署前严格评估」。

> [!warning] 版本漂移提醒
> 这篇论文 2 月版与 6 月修订版数字不同、口径变谨慎（抽象从「倾向于降低成功率」改为「通常不提升」），大量二手报道仍引旧版。经 Augment Code 指南与 synthetixis 整理的 v3 数字：自动生成文件成功率 −0.5% / −2%（p=0.87 / 0.37，不显著），成本 +20% / +23%（p<0.001）；开发者手写 +2.4%（p=0.21，不显著），但显著优于自动生成约 7%（p=0.038）。**这些细分数字来自二手整理，引用时请回原文核对。**

把两篇论文放在一起看，结论相当尖锐：**90.6% 的仓库在做的事，是唯一被严格控制实验质疑过「是否划算」的事**；而那 5.5% 用 skills 的仓库，反倒缺乏对照实验证明收益。两边都还是「先做起来，效果待验」。

### 1.5 社区反弹：配置泛滥本身成了抱怨对象

- **HN item?id=48289950**（2026-05-27，Arpan Patel《Claude Code as a Daily Driver》，300+ points / 200+ comments）：热帖正文把 `CLAUDE.md / Skills / Subagents / Plugins / MCP` 讲成五层，但高赞评论是反弹——「We really need some consolidation around commands, skills, subagents, and plugins. … 做一次 code review 现在有五种写法，没有最佳实践出现」；另一位评论者说给 Rust / Python / Dart 各装了 LSP 插件，两个月数百个 session 后查日志发现**只被调用过一次**，遂全部卸载。
- **HN item?id=47465415**（2026-03-22，Ask HN: what's your favorite line in your Claude/agents.md files?）：正面分享常驻规则写法，可作为「个体仍在手工调 CLAUDE.md」的样本。
- **HN item?id=46900083**（Show HN: Claude.md templates based on Boris Cherny's advice）：把「每次犯错后让 Claude 自己更新 CLAUDE.md」打包成模板。
- **2026-05-16 Ask HN**（是否还值得花时间维护 CLAUDE.md / AGENTS.md，用户 david_d8912，经 clawdbytes 转述）：核心分歧是**事实型内容（路径、命令、文档指针）有用，行为型规则（代码风格、禁令）常被无视**。
- **2026-09-07 Ask HN: How do you manage skills files?**（24 points / 14 comments，经 worldprogramming 转述）：已经出现「skill 太多反而管不住」「用 `.agents/skills/` + symlink 到 `.claude/skills/`」「公司用 bootstrap 脚本分发 skill」「给 skill 写包管理器和安全扫描」这类运维问题。
- **「根目录里的彩纸碎屑」（confetti in the root directory）**：Augment Code 2026-02-27 的 junk drawer 一文（经 dev.to/kuzin 与 Augment 自家 AGENTS.md 指南引用），描述一个项目里 `CLAUDE.md / .cursorrules / copilot-instructions.md / AGENTS.md / GEMINI.md` 内容雷同、缓慢漂移，有人靠 symlink 保持五份同步。属厂商博客（带产品立场），但症状描述与 arXiv 的多文件共存数据一致。
- **2026-07 的 CLAUDE.md stacking 故障报告**（经 specswriter 转述、无原帖直连）：swarm 场景下多层 `CLAUDE.md` 无条件叠加污染上下文，缓解办法是每任务一个干净目录 + 最小 `CLAUDE.md`。**证据等级低，仅记为个别故障模式。**

### 1.6 本部分采用度判定

| 做法 | 判定 | 依据 |
| --- | --- | --- |
| 常驻指令文件（`CLAUDE.md` / `AGENTS.md` / `copilot-instructions.md`） | **已被绝大多数人采用** | 90.6% 仓库；60k+ 开源项目（agents.md 官网 / LF 新闻稿） |
| 短文件、只放命令与非推断事实、按行做「删了会不会犯错」检验 | **较多个体采用，且是官方口径** | Anthropic 2026-06-18 博客；多篇社区实践 |
| `AGENTS.md` 作唯一事实源 + 薄 `CLAUDE.md` 适配层 | **快速上升、跨工具团队中已成主流写法** | arXiv 301 次引用 / 493 仓库纯用；中文社区与官方 docs 双重印证 |
| path-scoped rules（`paths:`） | **有真实项目落地，但绝对数量不多** | PR #2586；2.1.198+ 支持、2.1.288 才修好 Write/Edit 触发 |
| skills / subagents / hooks / MCP **同时**配齐 | **少数派** | ≈5.5% / ≈4.6% / ≤20%；「多个非 Context File 机制共现在同一仓库很罕见」 |
| subagent 持久化记忆（`memory: project`） | **个别实验（实证为 0）** | arXiv §6.3 |
| 手写 `.claude/commands/` 单文件命令 | **存量仍在，新增已转向 skills** | v2.1.3 合并，官方推荐 skills |

---

## 二、新尝试

### 2.1 标准层：`AGENTS.md` 从「民间约定」变成「跨厂商事实标准」

时间线（均为 A 级）：

| 时间 | 事件 | 来源 |
| --- | --- | --- |
| 2025-08 | OpenAI 发布 `AGENTS.md` | Linux Foundation 新闻稿 |
| **2025-12-09** | Linux Foundation 成立 **AAIF（Agentic AI Foundation）**，三个创始项目：Anthropic 的 MCP、Block 的 goose、OpenAI 的 AGENTS.md；铂金成员含 AWS / Google / Microsoft / Cloudflare / Bloomberg | `linuxfoundation.org/press/...agentic-ai-foundation`；Anthropic 官方捐赠公告 |
| 2026-02 | 实证显示开发者自下而上向 `AGENTS.md` 收敛，尽管当时最流行的 Claude Code 还不支持 | arXiv:2602.14690 |
| **2026-09-18** | **Claude Code v2.1.277** 加入 AGENTS.md fallback：项目无 `CLAUDE.md` 时改读 `AGENTS.md`；`/config` → Project instructions 可切换；**Bedrock / Vertex / Foundry 暂不支持** | CHANGELOG 原文经 neoteric.no、claude-news.today（2026-09-19）、musthave.ai 多方引述一致 |
| **2026-10-01** | Anthropic 发布 **mods**，并说明 AGENTS.md 支持与 `/diff` 面板**本身就是用 mod 实现的** | `claude.com/resources/articles/claude-code-mods` |

一手细节来自 `github.com/anthropics/claude-code/blob/main/mods/agents-md/README.md`：这是一个 **built-in plugin**，暴露 `instructionFiles` 四个取值——`claude-md`（只读 CLAUDE.md）、**`claude-md-or-agents-md`（默认，fallback）**、`claude-md-and-agents-md`（两者并存）、`managed-only`（只留组织托管文件）。两个容易踩的点：

- 只要项目路径上存在 `CLAUDE.md` / `.claude/CLAUDE.md` / `CLAUDE.local.md`，**整个 fallback 就不启动**；
- plugin 选项**不从项目 `.claude/settings.json` 读取**，只能写在用户设置、`--settings` 或 managed settings——即「团队无法用提交进仓库的文件替成员决定用哪种指令模式」。README 另列了 8 条 `AGENTS.md` 与 `CLAUDE.md` 仍不等价的行为差异（嵌套文件只在文本 Read 时挂载、`/memory` 与 `#` 快捷键不认识它、`--add-dir` 不贡献 AGENTS.md 等）。

规模：**60,000+ 开源项目**（agents.md 官网与 LF 新闻稿一致），官网明列 20+ 支持工具但**列表里没有 Claude Code**（这是页面更新滞后，与 2.1.277 的事实不冲突，引用时要注意）。格式本身**无 schema、无必需字段、纯 Markdown**，只有两条优先级规则：树上多个文件时就近者优先、聊天里的显式指令覆盖文件。

### 2.2 能力层：Agent Skills 成为第二个跨工具开放格式

`agentskills.io` 官方规范（A 级）：由 Anthropic 原创、**已作为开放标准发布**，一个 skill = 一个目录 + `SKILL.md`（YAML frontmatter 至少 `name` / `description`）+ 可选 `scripts/` `references/` `assets/`；三级 **progressive disclosure**：启动时只加载 name+description（约 100 token/个）→ 任务匹配才读全文 → 资源按引用加载。官网 client showcase 列出 Claude Code、ChatGPT/Codex、Cursor、GitHub Copilot、VS Code、Gemini CLI、Kiro、Goose、Amp、Qodo、Junie、Roo Code、OpenCode、Snowflake 等数十个产品。

关键演进是**存放位置也在收敛**：`.agents/skills/` 正在成为跨工具通用目录，Copilot / Cursor / Gemini CLI 等多个工具都读它（designforai.dev 的工具矩阵，B 级但与规范站 showcase 一致）。HN 2026-09-07 讨论里已有人用「`.agents/skills/` + symlink 到 `.claude/skills/`」落地。**但各工具目录不统一**（Claude Code 只读 `.claude/skills/`，Codex 读 `.agents/skills/` 而不读 Claude 目录），所以「一次编写到处运行」目前仍要放两份或用软链——这是社区反复吐槽的点。

采用度判断有点分裂：**作为格式标准，已被厂商侧广泛采纳（A 级）**；**作为仓库里的实际产物，仍是少数（arXiv 5.5%）**；而 85.5% 的 skill 不带任何脚本与参考文件，说明大多数人只是把 SKILL.md 当成「更好组织的 Markdown」，没有用到它真正的执行能力。

### 2.3 分发层：从「手写目录」到 Plugins / Marketplaces / 治理

- 2026 年内，plugins 从 beta 变成组织分发 agent 配置的主通道。内容仍是那几样（skills / agents / hooks / MCP servers / commands），变化在**打包与管控**：`/plugin install`、项目级 `.claude/settings.json` 声明 `extraKnownMarketplaces` + `enabledPlugins`、Team/Enterprise 私有市场、`strictKnownMarketplaces` 白名单、按 commit SHA 锁定、`managed-settings.json` 统一下发。（`qodo.ai/glossary/what-is-claude-code-plugins` 2026 时间线 + dev.to/michaeltuszynski 的三层治理模型，B 级；官方 mods 文章 A 级印证 plugin 通道）
- **Mods（2026-10-01，A 级）**：TypeScript 小函数，挂在 `tool.call` / `prompt.submit` / `turn.step` / `ui.render` 等事件上，可**改写 prompt、拦截/重写工具调用、替换内置功能、画自定义 UI**。与 settings hooks 的区别：hooks 是每事件跑一次无状态 shell 命令，mod 常驻整个会话、可持有状态。官方明说「mods 拥有与 Claude Code 同等的机器权限，**不做沙箱**，只装可信来源」；Team/Enterprise 会先加载内置 `sec-default` 限制用户 mod 越权。
- 安全成为新议题（B 级，列作信号不列作结论）：Cloud Security Alliance「SkillCloak」(2026-07-06)、Air Security「Plugin4Shell」跨四个 CLI 的 pin 绕过 (2026-09-17，修复后公开)、Claude Code 2.1.179 修 hash pin bypass (2026-10-09)、Enterprise 默认开启 skill/plugin 扫描 (2026-10-02)。第三方目录规模（claude.com/plugins 342 个、Top 插件百万级 installs，2026-10-21）**来自 B 级站点，未经独立核实**。

> [!note] 为什么这一层值得单独看
> 它改变的不是「写什么配置」，而是「配置归谁管」。个人 dotfiles → 团队提交进 git → 组织通过市场与托管策略下发，这条线正好对应当前目录 `settings.json` 里已经出现的 `extraKnownMarketplaces` / `enabledPlugins` 两个键。但也带来新约束：**项目级 settings.json 不能配 plugin options**（见 2.1）。

### 2.4 流程层：vibe coding → agentic / context engineering，以及 SDD 的争议

**术语与框架（A 级为主）**：

- Google 白皮书 **《The New SDLC With Vibe Coding》**（Addy Osmani / Shubham Saboo / Sokratis Kartakis，2026-05，Kaggle 免费发布，约 50 页）。作者本人一手解读在 `addyosmani.com/blog/new-sdlc-vibe-coding`：**「an agent is a model plus a harness」**，粗略拆分 **10% model / 90% harness**；harness 包含指令与规则文件、工具与 MCP、沙箱、编排逻辑、hooks、可观测性；引用的公开数据点：Terminal Bench 2.0 上有团队**只改 harness、不换模型**把 agent 从 Top 30 外带进 Top 5，LangChain 另一次只改 system prompt / tools / middleware 提升 13.7 分。六类上下文（instructions / knowledge / memory / examples / tools / guardrails）中，静态与动态上下文的边界被建议「当架构决策来评审、像代码一样版本化」。
- Karpathy 2026-02-04 提出 `agentic engineering`，称 vibe coding 已 passé；2026-04-30 Sequoia AI Ascent 上把 2025-12 称为「agentic inflection point」，区分「raise the floor」与「raise the ceiling」。（**二手**：theagenttimes、eleks、toolbit、AI Wiki；未直连 X 原帖，标注为媒体转述）
- Google 白皮书与多家中英文社区文（含腾讯云开发者社区 2026 年长文）都把「spec / 验证 / 人工判断」列为分界线，而非「是否使用 AI」。

**Spec-Driven Development 是「讨论热度高、稳定采用证据弱」的典型**：GitHub Spec Kit、AWS Kiro、Tessl 被反复提及；Thoughtworks 的 Birgitta Böckeler 提出 spec-first / spec-anchored / spec-as-source 三分法并指出 Spec Kit 的规则「靠约定而非强制」；Colin Eberhardt 实测报告 2,577 行 Markdown 对 689 行代码、3.5 小时主要在看文档、bug 依然上线；François Zaninotto《The Waterfall Strikes Back》指 agent 会绕过 spec。（以上经 kanbento.dev、fogonacaixadagua.com.br 转述，**B 级**）另有 2026 年个人对照实验《Spec Kit vs Kiro vs a Plain plan.md》（devmoment.dev）结论是**保留手写的 `plan.md`**——「spec 的仪式成本超过收益，且第四天就过期」。Kiro 官方页（`kiro.dev`）确认它支持 AGENTS.md、Skills、MCP 与 Agent Client Protocol（A 级产品事实）。

> [!warning] 别把「白皮书 + 媒体报道」当成「开发者已采用」
> 白皮书、术语迭代、厂商 IDE 都属于**话语层与产品层**。arXiv 的仓库快照里没有任何「spec 目录」被计入采用率；SDD 目前能验证的是**大量讨论与少量实测反弹**，不是规模采用。

### 2.5 基础设施层：MCP 的无状态重写与「托管 harness」

- **MCP 2026-07-28 规范**（`blog.modelcontextprotocol.io/posts/2026-07-28`，A 级）：协议核心从双向有状态改为**无状态请求/响应**，移除 `initialize/initialized` 握手与 `Mcp-Session-Id`；方法与工具名走 `Mcp-Method` / `Mcp-Name` HTTP 头便于网关路由；引入 MRTR 多轮请求、list 结果缓存语义、`server/discover`；**Tasks 从实验性核心毕业为扩展**，正式确立 Extensions 框架与**至少 12 个月的弃用窗口**；Roots / Sampling / Logging 标记弃用。官方称 Tier 1 SDK 月下载近 5 亿、TS 与 Python SDK 累计各破 10 亿。Google 开发者博客《Scaling AI Agent Infrastructure with the MCP Stateless updates》一手佐证其动因是 K8s / serverless 下的会话粘性瓶颈，GitHub MCP Server 已移除 Redis 会话存储。
- **harness 被托管化**：OpenAI 2026-09-10 开放 Agents API 公测，把 context compaction、tool search、programmatic tool calling、subagent 协调收进「托管 harness」（`openai.com/index/introducing-the-agents-api/`，B 级转述 aimastery.page 补充日期与四原语）；GPT-5.6 官方文亦用「deferred discovery 避免 context bloat、append-only 历史保持 prompt cache 前缀」描述 harness 设计。**采用度：刚发布，无社区规模数据，属新方向而非现状。**

### 2.6 明确属于「个别实验 / 早期信号」的一批

| 尝试 | 状态 | 来源等级 |
| --- | --- | --- |
| GG-SDD（图溯源式 spec-driven，把需求/决策/代码/测试/事故连成版本化项目图，MCP 作为交付面） | 单人提出的模式 | B（ainativeengineering.net） |
| 执行泳道 A–D + builder/reviewer 按任务粒度分离、把 SDLC 当 context layer | 单个公司（Vendict）实践复盘 | B |
| `kanbento` 类「把 spec 放进看板协议、append-only 事件日志」 | 单产品方案 | B |
| Claude Code swarms 大规模编排、CLAUDE.md stacking 故障与「把 CLAUDE.md 当运行时参数、按任务生成」 | 单个 field report | B，且无原帖直连 |
| persistent agent memory / claude-mem / planning-with-files / CodeGraph 等「给 agent 外挂记忆」 | 项目存在，采用率未知；**arXiv 里 subagent memory 为 0** | 混合 |
| agent-skills 包管理器、skill linter、skill 安全扫描、`.agents/skills/` + symlink | HN 讨论中的个人做法 | A（HN 帖）+ B |
| 30k-star 的「让 Claude 少废话」skill、26.1% skill 漏洞率等病毒式数字 | **来源为内容农场 / 未核实，本文不采用** | 排除 |

---

## 三、趋势小结

### 3.1 三条主线

1. **收敛（最确定）**：工具专属指令文件 → 单一跨工具 `AGENTS.md`（AAIF 治理 + 60k 仓库 + Claude Code 2026-09 补齐最后一个缺口）。多文件并存的「彩纸碎屑」是被明确诊断并通过标准消解的问题，不是趋势本身。
2. **分层（第二确定）**：从「什么都塞进常驻文件」→ 静态/动态上下文按成本与权威分流。官方七机制表、path-scoped rules、skills 渐进披露、hooks 确定性执行说的是同一件事。Google 白皮书的 `Agent = Model + Harness` 给这套分层提供了行业级说法。
3. **治理与分发（近半年新增最快）**：配置从个人 dotfiles 变成需要**版本锁定、白名单、权限边界、安全扫描**的分发物；plugins → marketplaces → mods 一路把 harness 从「文件集合」推向「可编程平台」。

附带一条反向压力：**效果证据开始追上采用热度**。ETH 论文（+20% 成本、无显著提升）与社区对「配置文件越堆越多」的反弹，会让「配得全」不再自动等于「配得好」。

### 3.2 采用度分级

| 层级 | 内容 | 可验证依据 |
| --- | --- | --- |
| **已成事实 / 多数采用** | 一个常驻指令文件；`AGENTS.md` 作为跨工具事实源；`CLAUDE.md` 保持简短；事实型内容优于行为型规则；skills 作为开放格式被各厂商支持 | arXiv 90.6% / 301 次引用；agents.md + LF 60k；agentskills.io；Anthropic 2026-06-18 |
| **快速上升 / 早期多数** | path-scoped rules 瘦身；薄 `CLAUDE.md` + `@AGENTS.md`；plugin/marketplace 分发；`.agents/skills/` 通用目录 | PR #2586；2.1.277 changelog；mods 官方文；HN 2026-09-07 |
| **讨论多、落地少** | spec-driven development（Spec Kit / Kiro / Tessl）；大规模 multi-agent 编排；把 harness 效果做成可量化 eval | Thoughtworks 三分法、Eberhardt 实测、个人对照实验；arXiv 无采用数据 |
| **个别实验 / 刚发布** | mods（2026-10-01）；托管 harness / Agents API（2026-09）；GG-SDD 图溯源、执行泳道、agent-native kanban；subagent 持久化记忆 | 官方发布文；单人/单公司复盘；arXiv 实证 0 |
| **已被替代或边缘化** | 新增 `.claude/commands/` 单文件命令；不带 `paths:` 的全局 `rules/`；把标准写进 `CLAUDE.md` 正文 | v2.1.3 合并；Anthropic 七机制表 |

### 3.3 与当前目录这套 harness 的直接对照

不谈「该怎么改」，只列可核对的事实差异：

| 本目录的做法 | 社区 / 官方现状 |
| --- | --- |
| `CLAUDE.md` 为唯一常驻入口，`AGENTS.md` 定性为「不加载」的维护约定 | 2026-09-18 起 Claude Code 原生支持 `AGENTS.md`，默认 fallback，四种模式可在 `/config` 切换；但**本目录存在 `CLAUDE.md`，fallback 不会启动**——现有判断仍然成立，只是缺了版本门槛与配置入口 |
| 具体标准写在 agent 正文、不放 `CLAUDE.md`（按上下文成本取舍） | 与 Anthropic 2026-06-18 的「按加载时机分流」思路一致；官方多给了一层：路径约束用 `rules/` + `paths:`，硬禁令用 hook |
| `rules/` 说明为「所有 `.md` 全量加载」 | 正确，但**不完整**：`paths:` 路径作用域（2.1.198+）恰是近半年社区用来瘦身的主要手段，且 2.1.288 才补齐 Write/Edit 触发 |
| `commands/` 作为独立机制列出 | 已与 skills 合并（v2.1.3+），旧文件仍可用，新工作官方指向 `SKILL.md` |
| `agents/senior-code-reviewer.md` 开了 `memory: project` | arXiv 样本中 **0 个仓库**使用 subagent 持久化记忆，属个别实验 |
| `settings.json` 里一组最小 hook demo（内联命令，不引用脚本） | 与官方一致（且本目录已正确注明「hooks/ 不是官方目录名」「默认 fail-open」）；这两条恰是社区最容易踩的坑 |
| `settings.json` 里配 `extraKnownMarketplaces` / `enabledPlugins` | 正踩在新主线上；但新增约束是 **plugin options 不能从项目级 settings.json 读取**（mods/agents-md README） |
| 七类组件几乎配齐 | 真实仓库里 90.6% 只有 Context Files，多个非 Context File 机制共现「很罕见」。**作为自包含学习样本这没问题；作为「当前社区实践快照」它明显比现实更完整** |

### 3.4 仍然没有答案的三个问题

1. ** richer configuration 到底有没有收益？** arXiv:2602.14690 在结尾明确把「controlled studies 判断 Skills + scripts / 专职 Subagents 是否优于纯 Context Files」列为未来工作；目前没有对照实验回答。
2. **格式可移植 ≠ 行为可移植。** `AGENTS.md` 无 schema、各工具读取策略不同（Codex 拼接全树并 32KiB 截断、Cursor 就近、Claude Code fallback），同一份文件在不同 agent 下效果是否一致，无公开 benchmark。
3. **静态上下文的性价比。** ETH 论文说 +20% 成本、成功率提升与零无法区分；但它的实验里「非标准编码实践」确实有用。**哪一类内容值得常驻**，仍缺可操作的判据。

> [!note]- 本报告自身的局限
> 覆盖以英文公开网络与 GitHub 开源仓库为主；企业内私有配置、国内社区均缺少可量化抽样。近半年窗口内发布的 mods、Agents API、MCP 新规范都还太新，**「有没有人用」与「发布了」是两件事**，本文按证据分开处理，未把发布等同于采用。所有 B 级来源均已标注，涉及数字时以 A 级为准。

---

## 来源索引

### A 级（一手 / 权威）

| 来源 | 时间 |
| --- | --- |
| [arXiv:2602.14690 Harness Engineering for Agentic AI Coding Tools](https://arxiv.org/abs/2602.14690)（AIware 2026） | v1 2026-02-16 / v5 2026-06-30 |
| [arXiv:2602.11988 Evaluating AGENTS.md](https://arxiv.org/html/2602.11988v3)（ETH Zurich / LogicStar.ai） | 2026-02 首发 / v3 2026-06 |
| [agents.md 官方规范站](https://agents.md/) | 访问 2026-11-07 |
| [agentskills.io Agent Skills Overview](https://agentskills.io/) | 访问 2026-11-07 |
| [Linux Foundation：AAIF 成立新闻稿](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) | 2025-12-09 |
| [Anthropic：捐赠 MCP 并成立 AAIF](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation) | 2025-12 |
| [Anthropic：Steering Claude Code（七机制对照表）](https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more) | 2026-06-18 |
| [anthropics/claude-code · mods/agents-md/README.md](https://github.com/anthropics/claude-code/blob/main/mods/agents-md/README.md) | 2026-09 起 |
| [anthropics/claude-code CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)（2.1.277 / 2.1.288） | 2026-09-18 / 2026-10-02 |
| [Anthropic：Customize Claude Code with mods](https://claude.com/resources/articles/claude-code-mods) | 2026-10-01 |
| [MCP 官方博客：2026-07-28 Specification](https://blog.modelcontextprotocol.io/posts/2026-07-28/) | 2026-07-28 |
| [Google Developers Blog：MCP stateless updates](https://developers.googleblog.com/scaling-ai-agent-infrastructure-with-the-mcp-stateless-updates/) | 2026-07 |
| [Addy Osmani：The New Software Lifecycle（白皮书作者解读）](https://addyosmani.com/blog/new-sdlc-vibe-coding) | 2026-05 |
| [d4rken-org/sdmaid-se PR #2586（路径作用域瘦身）](https://github.com/d4rken-org/sdmaid-se/pull/2586) | 2026-07-28 |
| [HN 48289950 · Claude Code as a Daily Driver](https://news.ycombinator.com/item?id=48289950) | 2026-05-27 |
| [HN 46900083 · Show HN: Claude.md templates](https://news.ycombinator.com/item?id=46900083) | 2026 |
| [HN 47465415 · Ask HN: favorite line in Claude/agents.md](https://news.ycombinator.com/item?id=47465415) | 2026-03-22 |
| [HN 49760187 · AGENTS.md 支持讨论](https://news.ycombinator.com/item?id=49760187) | 2026-09-20 |
| [Kiro 官方页（AGENTS.md / Skills / MCP / ACP 支持）](https://kiro.dev/) | 访问 2026-11-07 |

### B 级（二手转述 / 讨论，仅作线索）

| 来源 | 用途 |
| --- | --- |
| [neoteric.no：2.1.277 AGENTS.md changelog 引文](https://www.neoteric.no/blog/claude-code-agents-md-support) / [claude-news.today 2026-09-19 简报](https://claude-news.today/en/briefings/briefing-2026-09-19) | 交叉确认版本日期与限制 |
| [dev.to/kuzin：CLAUDE.md is technical writing](https://dev.to/kuzin/claudemd-is-technical-writing-structure-it-like-it-38ib) | 「根目录彩纸碎屑」与单源化讨论 |
| [augmentcode.com：How to Build Your AGENTS.md](https://www.augmentcode.com/guides/how-to-build-agents-md) | ETH 论文细分数字、drift 问题 |
| [kanbento.dev：SDD works until the spec stops being true](https://kanbento.dev/blog/spec-driven-development) | Böckeler 三分法、Eberhardt 实测 |
| [devmoment.dev：Spec Kit vs Kiro vs plain plan.md](https://www.devmoment.dev/journal/spec-kit-vs-kiro-field-log-2026) | 个人对照实验 |
| [worldprogramming.org：Ask HN 如何管理 skills](https://www.worldprogramming.org/posts/ask-hn-how-do-you-manage-skills-files-ctco8f) | 2026-09-07 HN 讨论转述 |
| [clawdbytes：2026-05-16 Ask HN 维护价值质疑](https://www.clawdbytes.com/article/2026-05-16-ask-hn-do-you-still-spend-time-maintaining-claudemd-agentsmd-files.html) | 事实型 vs 行为型规则分歧 |
| [qodo.ai：What Are Claude Code Plugins（2026 时间线）](https://www.qodo.ai/glossary/what-is-claude-code-plugins) | plugins / 安全事件时间线 |
| [dev.to/michaeltuszynski：marketplace 三层治理](https://dev.to/michaeltuszynski/your-claude-plugin-marketplace-needs-more-than-a-git-repo-5631) | `strictKnownMarketplaces` / SHA pinning |
| [buildthisnow.com：commands → skills 迁移](https://www.buildthisnow.com/blog/tools/hooks/claude-code-commands-to-skills) | v2.1.3 合并细节 |
| [掘金：Vibe Coding 开发项目的基本范式](https://juejin.cn/post/7653050742082437166) / [giscafer：Vibe Coding 团队最佳实践](https://giscafer.com/blog/post-81) / [腾讯云开发者社区：2026 AI 编程大转向](https://developer.cloud.tencent.com/article/2728832) | 中文社区三层结构共识 |
| [theagenttimes / eleks：Karpathy agentic engineering](https://eleks.com/expert-opinion/agentic-engineering) | 术语转向（媒体转述，非原帖） |
| [ainativeengineering.net：GG-SDD / 执行泳道 / MCP 演进综述](https://ainativeengineering.net/article/8d55e653-dde2-4262-b0b4-95a4fcd3aa71) | 个别实验线索 |
