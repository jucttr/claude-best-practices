---
paths:
- "**/*.test.ts"
- "**/*.test.tsx"
---

# 测试规范

- 使用具有描述性的测试名称，格式为：“should [预期结果] when [条件]”
- 仅对外部依赖进行模拟（Mock），不对内部模块进行模拟
- 在 `afterEach` 中清理副作用