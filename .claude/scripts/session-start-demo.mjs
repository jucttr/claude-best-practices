#!/usr/bin/env node
// SessionStart 学习样本：由 .claude/settings.json 的 SessionStart/startup 组调用。
//
// 这条 demo 演示三件内联 echo 演示不了的事：
//   1. 从 stdin 读取 hook 输入 JSON（source / cwd / session_id ...）
//   2. 在脚本里动态生成上下文：扫描 .claude/ 与 docs/ 的条目数
//   3. 用 stdout 的「单个 JSON 对象」返回结构化输出：
//      hookSpecificOutput.additionalContext 注入模型，systemMessage 显示给用户
//
// 约定：不依赖任何 npm 包。本仓库没有 package.json，所以用 .mjs 后缀直接启用 ESM，
// 无需 "type": "module"。stdout 只允许输出下面那一个 JSON 对象，调试信息写 stderr。

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// hook 输入总是经 stdin 传入；手动测试时不传 stdin 也不会崩
function readHookInput() {
  try {
    const raw = readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// 目录不存在或读失败时返回 0，不让 demo 变成一次 hook 报错
function countEntries(root, relPath) {
  try {
    return readdirSync(join(root, relPath), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() || entry.name.endsWith('.md'))
      .length;
  } catch {
    return 0;
  }
}

function countMarkdownTree(root, relPath, maxDepth = 3) {
  let total = 0;
  const walk = (dir, depth) => {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) walk(join(dir, entry.name), depth + 1);
      else if (entry.name.endsWith('.md')) total += 1;
    }
  };
  walk(join(root, relPath), 0);
  return total;
}

const input = readHookInput();
// exec 形式也会把项目根导出为环境变量；比 input.cwd 更稳（cwd 会随 cd / worktree 变化）
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const source = input.source ?? 'unknown';
const sessionId = String(input.session_id ?? 'n/a').slice(0, 8);

const stats = {
  rules: countEntries(root, '.claude/rules'),
  agents: countEntries(root, '.claude/agents'),
  skills: countEntries(root, '.claude/skills'),
  commands: countEntries(root, '.claude/commands'),
  docs: countMarkdownTree(root, 'docs'),
};

const context = [
  '[会话启动快照 / 由 Node SessionStart hook 生成]',
  `source=${source} | session_id=${sessionId}... | cwd=${input.cwd ?? root}`,
  `项目级配置：rules ${stats.rules} 篇 / agents ${stats.agents} 个 / skills ${stats.skills} 个 / commands ${stats.commands} 个`,
  `docs/ 下 Markdown ${stats.docs} 篇`,
  '校验标记 SESSION_START_NODE_OK',
].join('\n');

const output = {
  continue: true,
  systemMessage: `[demo] SessionStart(startup) 已由 Node 脚本触发（source=${source}）`,
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: context,
  },
};

// 退出码 0 + 单个 JSON 对象 = 结构化输出；不要在这里 console.log 别的东西
process.stdout.write(`${JSON.stringify(output)}\n`);
