---
description: 审查代码变更，查找安全漏洞、身份验证缺陷及注入风险
disable-model-invocation: true
argument-hint: <分支或路径>
---

## 待审查的差异 (Diff)

!`git diff $ARGUMENTS`

请审查上述变更，重点关注：

1. 注入漏洞（SQL 注入、XSS、命令注入等）
2. 身份验证与授权方面的缺陷
3. 硬编码的密钥或凭据

请参考本技能目录下的 `checklist.md`，获取完整的审查清单。

报告发现的问题，并注明严重程度及修复建议。