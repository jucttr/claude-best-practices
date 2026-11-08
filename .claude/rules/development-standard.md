## 通用开发规范标准

*最后更新: YYYY-MM-DD*
*版本: vX.Y.Z*

### 代码质量规范
- **提交信息**: 遵循约定式提交规范（`feat`、`fix`、`chore` 等）
- **代码检查**: 使用统一的代码检查配置（涵盖语言规则与框架规则）
- **类型安全**: 启用类型系统严格模式，确保全面的类型安全
- **测试覆盖**: 编写单元测试，包含适当的 mock 和组件测试
- **代码格式**: 使用统一格式化工具，并配合提交前钩子执行

### 核心开发原则
- **类型定义准确性**: 类型定义要准确完善，提高开发效率，便于维护，减少潜在问题
- **避免过度封装**: 迭代节奏较快时，过度封装会导致代码复杂度急剧上升，最终难以维护
- **代码简洁性**: 避免炫技，编写简单易懂的代码，注重可读性
- **逻辑清晰性**: 保持逻辑清晰、代码简单易读、组织结构合理，便于团队长期高效维护
- **注释有效性**: 编写清晰有用的注释，避免无用或冗余的注释
- **路由设计**: 页面避免使用参数化路由，URL 路径参数应使用 query 参数传递

### 命名规范标准
- **文件名**: 使用小写 kebab-case 格式，如 `example-file.tsx`
- **组件**: 使用 PascalCase 格式，如 `ExampleComponent`
- **钩子函数**: 使用 camelCase 格式，以 `use` 开头，如 `useExampleData`
- **普通函数**: 使用 camelCase 格式，如 `calculateExample`
- **常量**: 使用 SNAKE_CASE 格式，如 `EXAMPLE_CONSTANT`
- **类型定义**: 使用 PascalCase 格式，如 `ExampleData`
- **接口定义**: 使用 PascalCase 格式，如 `ExampleResponse`
- **枚举定义**: 使用 PascalCase 格式，如 `ExampleStatus`

### 页面组件结构规范
```
pages/example-page/
├── index.tsx                            # 页面主入口文件
├── example-page.module.css              # 页面样式文件
├── components/                          # 页面专用组件
│   ├── example-header.tsx
│   └── example-settings.tsx
└── hooks/                               # 页面专用 hooks
    └── use-example-data.ts
```

### 模块导入规范
- **导入顺序**: 核心库 > 应用框架 > 第三方库 > 内部组件库 > 项目内部模块 > 样式文件
- **路径别名**: 使用项目配置的路径别名，如 `@/utils`、`@/components`
- **类型导入**: 类型定义使用类型专用导入语法，如 `import type { ExampleType } from 'module'`
- **多项导入**: 从同一库导入多个内容时使用解构语法
- **避免相对路径**: 禁止使用 `../../../` 形式的相对路径，必须使用路径别名

### 导入示例
```
// ✅ 正确的导入顺序和格式
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { clsx } from 'clsx';
import { Button, Input } from '@example/ui';
import { useExampleData } from '@/hooks/use-example-data';
import type { ExampleEntity } from '@/types/example';
import styles from './example-page.module.css';
```

### 代码格式规范
- **缩进**: 使用 2 个空格缩进，不使用 Tab
- **引号**: 统一使用单引号，字符串和 JSX 属性都使用单引号
- **行宽**: 代码行宽不超过 100 个字符
- **分号**: 语句结尾必须使用分号
- **尾随逗号**: 对象、数组等多行结构使用尾随逗号
- **格式化工具**: 严格遵循项目格式化配置

### 类型系统开发规范
- **严格模式**: 启用类型检查严格模式（`strict: true`）
- **类型覆盖**: 所有组件、函数、变量都必须有明确的类型定义
- **接口命名**: 使用 PascalCase 格式，如 `ExampleComponent`
- **类型别名**: 使用 PascalCase 格式，如 `ExampleResponseType`
- **类型声明形式**: 优先使用 `type` 定义类型别名，只有需要声明合并时使用 `interface`
- **属性类型**: 组件属性类型命名为 `ComponentNameProps` 格式
- **类型断言**: 优先使用 `as` 语法而非尖括号语法
- **框架类型**: 使用框架官方提供的类型定义，如 `FC`、`ReactNode`、`MouseEvent` 等

### 类型定义示例
```
// ✅ 正确的类型定义
import type { FC, ReactNode, MouseEvent } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

const Button: FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
  return <button className={`btn btn--${variant}`} {...props}>{children}</button>;
};
```

### 组件开发规范
- **组件类型**: 函数组件使用 `FC<Props>` 类型定义
- **组件形式**: 优先使用函数组件与 Hooks，避免类组件
- **性能优化**: 使用 `memo` 包装组件避免不必要的重新渲染
- **属性解构**: 使用解构赋值提取 props，提高代码可读性
- **样式处理**: 使用 `clsx` 工具处理条件类名
- **命名方式**: 组件名使用 PascalCase 格式
- **定义方式**: 优先使用函数声明而非箭头函数定义组件
- **默认值**: 为组件属性提供合理的默认值
- **函数优化**: 避免在渲染过程中创建函数，使用 `useCallback` 优化

### 组件实现示例
```
import React, { FC, memo, useCallback } from 'react';
import { clsx } from 'clsx';

interface ExampleCardProps {
  label: string;
  imageUrl?: string;
  isActive?: boolean;
  onItemClick?: (label: string) => void;
}

const ExampleCard: FC<ExampleCardProps> = memo(({
  label,
  imageUrl,
  isActive = false,
  onItemClick
}) => {
  const handleClick = useCallback(() => {
    onItemClick?.(label);
  }, [label, onItemClick]);

  return (
    <div
      className={clsx('example-card', { 'example-card--active': isActive })}
      onClick={handleClick}
    >
      {imageUrl && <img src={imageUrl} alt={`${label} image`} />}
      <span className='example-card__label'>{label}</span>
    </div>
  );
});

ExampleCard.displayName = 'ExampleCard';
export default ExampleCard;
```

### 性能优化最佳实践
- **memo**: 合理使用 `memo` 优化组件渲染性能
- **useCallback**: 优化事件处理函数，避免子组件不必要的重新渲染
- **useMemo**: 优化复杂计算，缓存计算结果
- **代码分割**: 使用动态导入实现组件懒加载
- **图片优化**: 使用框架提供的图片组件进行图片优化
- **资源预加载**: 对关键资源进行预加载，提升用户体验

---

*本规范适用于 ExampleOrg 下 example-repo 仓库中的全部项目，确保代码质量和团队协作效率。*
