---
title: settings.json 使用指南
type: overview
tags:
  - AI学习/ClaudeCode
  - AI学习/settings
created: 2026-11-06
updated: 2026-11-08
---

# settings.json 使用指南

本文件在 `docs/` 下，只给人看，是 [[README|README]] 里项目级配置的展开：这个文件干什么、每个键怎么写、写完什么时候生效、哪些地方会静默失效。

> [!important] 就当这是一个真实项目
> 配置放在 `.claude/` 下，本文讲的 `settings.json` 即 `<项目根>/.claude/settings.json`；`CLAUDE.md` / `CLAUDE.local.md` / `.mcp.json` 与它并列在项目根（见 [[README|README]]）。本指南在 `docs/` 下，不参与任何加载机制。

> [!note] 本文口径
> 文中「本目录」一律指**这个项目的根目录**，**不是**本文件所在的 `docs/`；涉及具体文件时一律写出 `.claude/` 前缀。
> 2026-11-06 按 Claude Code 官方文档逐键核对，来源列在文末。官方没写明的，一律写「待确认」，不靠推断补齐；本目录取值与官方示例不同的地方，单独说明。

## 一、这个文件是干什么的

官方定义：设置是改变 Claude Code 行为的 JSON 键——启动模型、可以不经询问就运行什么、不能读哪些文件、终端外观、组织强制什么。Claude Code 从**四个**设置文件读取，另有组织下发的托管设置：

| 作用域  | 文件                            | 影响范围                      | 官方建议用途                     |
| ---- | ----------------------------- | ------------------------- | -------------------------- |
| 用户   | `~/.claude/settings.json`     | 本机所有项目                    | 个人偏好：主题、编辑器模式、默认模型、自己的权限规则 |
| 共享项目 | `.claude/settings.json`       | 在该文件夹工作的所有人（提交进 git 才到队友） | 团队权限、hook、插件、项目需要的环境变量     |
| 项目本地 | `.claude/settings.local.json` | 只在本项目、只对自己                | 个人覆盖，共享前先试                 |
| 托管   | `managed-settings.json` 等     | 组织部署到的所有机器                | 安全策略与合规                    |

**本目录的 `.claude/settings.json` 是第二行——共享项目级**，和 [[README|README]] 里「只覆盖项目级」是同一件事。

三条官方事实决定了这份文件该怎么用：

- 安装 Claude Code **不会创建任何设置文件**；不写就是全部走内置默认。
- 共享项目文件从会话的**主工作目录**读取，所以要用提交在仓库根的那份，就从仓库根启动 Claude Code。
- 逐键核对下来，本目录这份与官方「团队的共享设置」示例结构一致：`permissions` → `hooks` → `extraKnownMarketplaces` / `enabledPlugins` → `sandbox` → `plansDirectory`。它换了权限规则、hook 脚本名、marketplace、插件、域名等具体值，并额外加了 `$schema` 和第一条 matcher。**是官方团队示例的一个实例，不是自创写法。**

## 二、配置项总表（与本目录实际取值逐项对齐）

| 键                                | 官方含义                               | 类型 / 取值范围                                                                                                          | 默认值                                                                                | 本目录取值                                                |
| -------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `$schema`                        | 给编辑器指向已发布的 JSON schema，提供自动补全与内联校验 | string，URL `https://json.schemastore.org/claude-code-settings.json`                                                | 不写则无补全与校验（**不是 Claude Code 的设置键**，逐键参考索引里没有它）                                      | 该 URL                                                |
| `permissions`                    | 控制哪些工具免问、哪些询问、哪些禁用，并设新会话默认权限模式     | object，含 `allow` / `ask` / `deny` / `additionalDirectories` / `defaultMode` 等                                      | 未设置                                                                                | 见下三行                                                 |
| `permissions.allow`              | 免询问直接批准列出的工具调用                     | array of rule strings，格式 `Tool` 或 `Tool(specifier)`                                                                | 未设置                                                                                | `Bash(python3 *)`、`Bash(git diff *)`                 |
| `permissions.ask`                | 每次都询问；`dontAsk` 模式下改为直接拒绝          | 同上                                                                                                                 | 未设置                                                                                | `Bash(git push *)`                                   |
| `permissions.deny`               | 阻断列出的工具调用，含敏感文件读取                  | 同上；工具名支持 glob（`"*"` 禁用所有工具）                                                                                        | 未设置                                                                                | `Read(./.env)`、`Read(./.env.*)`、`Read(./secrets/**)` |
| `hooks`                          | 在生命周期节点运行自定义命令                     | object：键为事件名，值为 `{ matcher, hooks }` 组数组；handler `type` 为 `command` / `http` / `mcp_tool` / `prompt` / `agent`     | 未设置（无 hook 运行）                                                                     | `PreToolUse` 一组（最小 demo）                                      |
| `extraKnownMarketplaces`         | 按名字注册插件市场，让打开仓库的人不必手动添加            | object：市场名 → `{ source: {...}, autoUpdate?: boolean }`；`source` 示例有 `github`（`repo`）与 `git`（`url`）                 | 未设置                                                                                | `my-tools` → `my-org/claude-plugins`                 |
| `enabledPlugins`                 | 按作用域开关单个插件                         | object：`plugin-name@marketplace-name` → boolean                                                                    | 未设置，各插件跟随自身 `defaultEnabled`                                                       | `markdown-formatter@my-tools: true`                  |
| `sandbox`                        | 把 Bash 命令与文件系统、网络隔离                | object，含 `enabled` / `failIfUnavailable` / `autoAllowBashIfSandboxed` / `filesystem` / `network` / `credentials` 等 | 未设置（命令不在沙箱内运行）                                                                     | 见下三行                                                 |
| `sandbox.enabled`                | 打开 Bash 沙箱                         | boolean                                                                                                            | `false`                                                                            | `true`                                               |
| `sandbox.filesystem.allowWrite`  | 额外允许沙箱内命令写入的路径                     | array of path strings                                                                                              | 未设置：默认可写工作目录、per-user 临时目录、`--add-dir` / `permissions.additionalDirectories` 加入的目录 | `["/tmp/build"]`                                     |
| `sandbox.network.allowedDomains` | 预先放行域名，访问时不再询问                     | array of strings：域名、`*.` 通配、IP 字面量，可带 `:port`；不带端口 = 所有端口                                                          | 未设置：由权限模式决定新 host 的处理                                                              | `["github.com", "raw.githubusercontent.com"]`        |
| `plansDirectory`                 | 计划模式写 plan 文件的位置                   | string，**相对项目根**的路径                                                                                                | 未设置 → `~/.claude/plans`                                                            | `"./plans"`                                          |

本目录**未设置**、但会影响上面取值的两个默认：

| 键 | 默认值 | 对本目录的影响 |
|---|---|---|
| `sandbox.autoAllowBashIfSandboxed` | `true` | 沙箱内 Bash 默认免询问；但 `deny` 规则与 `Bash(git push *)` 这类带内容的 `ask` 规则仍然生效 |
| `sandbox.failIfUnavailable` | `false` | 平台不支持或依赖检查失败时，命令照常在沙箱外运行 |

> [!warning] `permissions.defaultMode` 本目录没设
> 未设置时用各端的内置默认。官方特别说明：`auto` 与 `bypassPermissions` 两个取值**不能**从项目或本地设置生效，要写用户设置、托管设置，或用 `--permission-mode` 只对单次会话生效；v2.1.257 之前 `bypassPermissions` 从任何文件都能生效。

## 三、格式与取值范围：三处最容易写错的语法

### 3.1 权限规则

- 形状只有两种：`Tool`（该工具所有用法）或 `Tool(specifier)`。specifier 里的括号是字面量，不用转义。
- 判定顺序固定 **deny → ask → allow**，第一个命中就定结果；规则写得越细**不会**改变这个顺序。
- Bash 规则按命令**原样**前缀匹配：官方说「第一个 `*` 之前的文本」才是限制。所以 `Bash(python3 *)` 的限制只有 `python3 ` 这几个字符，后面任意文本都放行——它比看上去宽得多。官方也提醒 `Bash(git push *)` 不匹配 `git -C . push`。
- Read / Edit 路径用 gitignore 语义：`*` 匹配单段、`**` 跨目录；`./` 相对、`//` 才是文件系统绝对路径、`~/` 相对家目录。
- 三个数组跨作用域**合并**，不是覆盖；`--allowedTools` / `--disallowedTools` 可为单次会话追加规则。

### 3.2 hook 的 `matcher`

| 写法 | 官方如何解释 | 例子 |
|---|---|---|
| `"*"`、`""` 或省略 | 每次事件都触发 | — |
| 只含字母、数字、`_`、`-`、空格、`,`、`\|` | 精确字符串，或用 `\|` / `,` 分隔的精确字符串列表 | `Bash`、`Edit\|Write` |
| 含其他字符 | JavaScript 正则，**不锚定** | `mcp__.*`、`^Edit$` |

`PreToolUse` 等工具事件的 matcher 匹配 `tool_name`。本目录 demo 的 `"Bash"` 是单个精确字符串，`"Edit|Write"` 则是用 `|` 分隔的精确字符串列表，两者都落在同一条路径上。

### 3.3 路径写法

`${CLAUDE_PROJECT_DIR}` 是会话启动时的项目根，也会作为环境变量导出给 hook 进程；进入 worktree 后它仍指向启动时的项目根。sandbox 的路径前缀与权限规则不是一套：`/tmp/build` 是绝对路径，`~/.kube` 相对家目录。

## 四、常见配置场景

| 场景              | 改哪个文件                                       | 最小改动                                                             | 生效条件                               |
| --------------- | ------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------- |
| 团队共用一份基线（本文件即是） | `.claude/settings.json` 提交 git              | 保持现状                                                             | 队友的 `allow` / marketplace 还需信任该文件夹 |
| 只给自己放宽，不进提交     | `.claude/settings.local.json`               | 从 `{}` 起步，写 `{"permissions":{"allow":["Bash(npm run test *)"]}}` | 该文件未被 git 跟踪时，`allow` 无需 trust     |
| 只在一个会话里试值       | 不改文件                                        | `claude --settings '{"sandbox":{"enabled":false}}'`              | 仅该会话，不写盘                           |
| 加一条免询问命令        | 项目 `permissions.allow`                      | 追加 `"Bash(npm run test *)"`                                      | 热重载                                |
| 保护新的敏感文件        | 项目 `permissions.deny`                       | 追加 `"Read(./config/credentials.json)"`                           | 立即生效，不需 trust                      |
| 换市场 / 关插件       | `extraKnownMarketplaces` + `enabledPlugins` | 把某插件置 `false`；项目级优先于用户级                                          | 需 trust；外部源插件仍需每人安装一次              |
| 构建工具要写项目外目录     | `sandbox.filesystem.allowWrite`             | 追加路径                                                             | 下一条沙箱命令生效                          |
| 允许新域名出网         | `sandbox.network.allowedDomains`            | 追加 `"registry.npmjs.org"`                                        | 下一条沙箱命令生效                          |
| plan 文件留在仓库里    | `plansDirectory`                            | `"./plans"`（本目录已设）                                               | 会话启动时读取                            |

### 4.1 项目级 hook 写法（最小 demo 就在 `settings.json` 里）

打开 `.claude/settings.json` 就能看到 `hooks` 键。把它单独拎出来是下面这样（实际是 `settings.json` 的一个顶层键）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo '[demo] PreToolUse/Bash 已触发；exit 0 放行，改成 exit 2 就会阻断调用'"
          }
        ]
      }
    ]
  }
}
```

- `PreToolUse` = 工具调用**执行前**触发；`matcher: "Bash"` 让它只对 Bash 生效。
- `command` 是一条内联 `echo`，不引用任何脚本文件——配置里没有指向不存在路径的引用，也不建 `.claude/hooks/` 目录。
- `echo` 以 0 退出 = 放行，这条 demo **不改变任何行为**。官方写明 exit 0 的 stdout 只写进调试日志、Claude 看不到；想确认它真的触发过，用 `claude --debug` 看 hook 日志。
- 要真正拦住调用，命令须 `exit 2`，stderr 文本会作为原因回传给 Claude。

> [!note]- 换成脚本文件时怎么写
> 把 `command` 换成脚本路径即可：`"command": "${CLAUDE_PROJECT_DIR}/scripts/check-before-edit.sh"`。两个前提：脚本要真实存在且 `chmod +x`；`hooks/` 不是官方目录名，路径由 `command` 自己定。脚本不存在或起不来时 hook 默认 fail-open，只报一个非阻塞错误，命令照常执行（见第六节第 3 条）。

## 五、生效方式

### 5.1 谁覆盖谁

优先级从高到低：**托管设置 > 命令行 `--settings` > 项目本地 > 共享项目 > 用户**。同键取高层级的值；但列表键（`permissions.allow`）和 `hooks` 是**合并**而非覆盖——所以本地文件里的 `allow` 并不会顶掉项目里的 `ask`。

环境变量不在这个栈里，按「键—变量」逐对决定：`ANTHROPIC_MODEL` 压过任何文件里的 `model`，`ANTHROPIC_DEFAULT_MODEL` 只在没有文件设置 `model` 时生效。

> [!warning] 提交进 git ≠ 队友立刻生效
> 仓库文件里的 `permissions.allow`、`permissions.additionalDirectories`、`extraKnownMarketplaces` 和多数 `env` 值，要等每人**信任该文件夹**才生效；未信任时静默忽略（`-p` 运行也一样）。`deny` 与 `ask` 规则立即生效。

### 5.2 什么时候读

官方口径比一句「会话启动时读取」更细：

| 组件 | 常见说法 | 官方补充 |
|---|---|---|
| `settings.json` | 会话启动时读取 | 文件被监视，`permissions` / `hooks` / `apiKeyHelper` 等**大多数编辑热重载**，运行中会话不用重启；每次检测到变更会跑一次 `ConfigChange` hook |
| 会话中途新建的文件 | — | 文件夹在会话启动时存在即可加载；项目的 `.claude/` 同一会话内新建也能加载 |
| `model` / `effortLevel` / `modelSettings` | — | 只在会话启动时读一次，中途改用 `/model`、`/effort`；本目录未用这些键 |
| `--settings` | — | 只对单个会话生效，不写任何文件 |

### 5.3 改完怎么确认

- `/status` → **Status** 标签的 `Setting sources` 行，列出本次会话读了哪些文件。注意它**不显示**每个键来自哪个文件。
- `claude doctor` → 列出被拒绝的条目与每条错误详情。
- 无效 JSON 或 schema 拒绝的值 → 交互式启动时弹 **Settings Error**；只有个别条目错（权限规则写错、未知 hook 事件名）→ **Settings Warning**，跳过这些值、文件其余部分照常生效。
- 云会话：项目里的云端线程**不读**仓库 settings 的权限规则 / hook / `env`；多仓库会话只读 `enabledPlugins` 和 `extraKnownMarketplaces` 两个键。

## 六、注意事项

1. **严格 JSON。** `//` 注释或尾逗号都是语法错误，会在下次启动时报 Settings Error。官方示例里带注释的版本只用于讲解，不能复制进文件。
2. **`hooks` 里是一组最小 demo，不是护栏。** 它只在 Bash 前打印一行、`exit 0` 放行，不改变任何行为；`command` 是内联 `echo`，不引用脚本文件，因此配置里没有指向不存在路径的引用。逐字段说明见 4.1。
3. **hook 默认 fail-open。** `exit 0` 不表态、`exit 2` 才是阻断（stderr 回传给 agent），其他非 0 退出码或脚本根本起不来，都只是非阻塞错误，**工具调用照常执行**。要让失败即阻断加 `"onFailure": "block"`（需 2.1.295+），代价是路径真写错时整条链路当场瘫痪。
4. **`permissions.deny` 不是 OS 级边界。** 官方写明它覆盖内置文件工具、Claude Code 认识的 Bash 文件命令（`cat` / `head` / `sed` / `tee` 等）与重定向目标，但**不**覆盖 `grep -r pattern .` 这类不点名文件的命令，也不覆盖任意子进程。官方团队示例专门用 `sandbox` 补这个缺口——本目录同时配了这两层，就是这个原因。
5. **sandbox 也有边界。** 默认只隔离 Bash 命令及其子进程；内置 `Read` / `Edit` / `Write` / `WebFetch`、MCP server、hook 都在沙箱外。平台只支持 macOS / Linux / WSL2，native Windows 命令不进沙箱；`failIfUnavailable` 默认 `false`，起不来就照常在沙箱外跑。
6. **规则按命令原样匹配。** `Bash(git push *)` 拦不住 `git -C . push`；同理 `Bash(python3 *)` 放行的是所有以 `python3 ` 开头的命令，比字面看上去宽。
7. **`hooks/` 不是官方目录名。** 官方清单里没有 `.claude/hooks/`；hook 一律写在 `settings.json`，脚本放哪由 `command` 的路径自己定。改路径或文件名要同步所有引用。
8. **本指南在 `docs/` 下，不参与任何加载机制。** 项目根该放哪些文件见 [[README|README]]；`CLAUDE.md` / `CLAUDE.local.md` / `.mcp.json` 与 `.claude/` 并列放在项目根。

> [!note] 版本门槛
> 本文涉及的版本号来自官方当前文档：`onFailure` 需 2.1.295+；`bypassPermissions` 在 2.1.257 前可从任何文件生效。文档会随 CLI 更新，落地前以当期官方页为准。

## 七、待确认（官方未写明 / 本目录无验证信息）

| 项                                                     | 需要确认什么                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `my-org/claude-plugins`、`markdown-formatter@my-tools` | 是示例占位值还是真实仓库 / 插件，本目录没有可验证信息；实际启用前需换成自己的 marketplace 与插件名                                                         |
| `./plans`                                             | 本目录当前没有 `plans/` 目录；官方未说明是否需要预建。官方只说路径解析到项目根之外、或 macOS / Linux / WSL 上路径含反斜杠时，会回退到 `~/.claude/plans`                |
| `settings.local.json`                                 | 当前是 **0 字节空文件**。官方只规定设置文件必须是严格 JSON，未说明空文件的具体处理；要用作个人覆盖层，建议从 `{}` 起步                                                |
| `extraKnownMarketplaces` 的全部 source 类型                | 官方逐键条目只给了 `github`（`repo`）与 `git`（`url`）两个示例，并提到可选 `autoUpdate` 与别名 `additionalMarketplaces`；是否还有其他 source 类型，本页未列全 |

## 八、官方参考

| 内容 | 链接 |
|---|---|
| 设置文件与优先级 | https://code.claude.com/docs/en/settings |
| 逐键参考（类型 / 默认值 / 作用域 / 示例） | https://code.claude.com/docs/en/settings-reference |
| 示例设置文件（个人 / 团队 / 托管） | https://code.claude.com/docs/en/settings-example |
| 权限规则语法 | https://code.claude.com/docs/en/permissions |
| Hooks 参考 | https://code.claude.com/docs/en/hooks |
| 沙箱 | https://code.claude.com/docs/en/sandboxing |
| 创建插件市场 | https://code.claude.com/docs/en/plugins/create-marketplace |

文档站有对应的 `/zh-CN/` 中文版，例如 https://code.claude.com/docs/zh-CN/settings 。
