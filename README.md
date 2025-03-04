# Light Helper - VSCode 插件

![VSCode版本要求](https://img.shields.io/badge/vscode-1.75%2B-blue)
![Node版本要求](https://img.shields.io/badge/node-14.x-green)

专为 Light 低代码平台设计的开发辅助工具，提供可视化配置生成和转换能力。

## ✨ 核心功能

### 快速面板生成
- 通过 `lightbase.*` 代码片段快速生成 UI 组件配置
- 支持 input/select/checkbox 等常用组件类型
- 实时预览配置结构 (见 `src/tools/optionsTranser`)

### 配置转换引擎
- 将可视化配置转换为 Light 组件标准 Options
- 自动处理路径别名和模块依赖 (见 `src/tools/optionsTranser/utils/file.ts`)
- 支持递归转译和 AST 解析 (见 `src/tools/optionsTranser/index.ts`)

### 可视化预览
- Webview 实时渲染配置结构
- 支持展开/折叠层级查看
- 一键复制标准化配置


## 🚀 快速开始

### 安装要求
```bash
# 确保使用兼容版本
npm install -g yo@4.3.1 generator-code@1.4.18
```

### 基本使用
- 在 JS/TS 文件中输入 `lightbase.` 触发代码补全
- 右键选择「生成 Light Options」转换配置
- 使用工具栏按钮管理配置结构

### 特色能力
- 智能路径处理：支持 @/ 等路径别名转换（见 filePathTransAlias）
- 增量更新：通过 Set 实现依赖去重（见 transpileRecursively）
- 安全沙箱：Webview 独立上下文通信（见 src/tools/optionsTranser/components/webview.ts）

## 🚀 开发调试
```bash
# 安装依赖
npm install

# 编译运行
npm run compile
F5 启动调试实例


```
## 🛠 技术实现



### 核心模块

#### 1. Webview管理 (`src/tools/optionsTranser/components/webview.ts`)
- **生命周期控制**：实现面板创建/销毁逻辑
- **双缓冲渲染**：骨架屏 → 数据渲染切换
- **安全通信**：通过`postMessage`与扩展进程交互
```typescript
class Webview {
  createWebview() { /* 带错误检查的面板创建 */ }
  renderSkeletonWebview() { /* 加载动画实现 */ }
  onMessageHandler() { /* 安全的消息过滤机制 */ }
}
```


#### 2. 配置转换器 (`src/tools/optionsTranser/index.ts`)
- **Babel 转译**：使用 Babel 转译并分析 AST， ESM → CJS 转换 (transpileFile)
- **依赖追踪**：递归分析文件依赖树 (transpileRecursively)
- **动态加载**：通过临时脚本执行转换结果

```typescript
Apply
transpileFile(filePath) {
  // 使用自定义Babel插件处理路径转换
  plugins: [function customPathPlugin() { ... }]
}
```

#### 3. 路径转换系统 (src/tools/optionsTranser/utils/file.ts)
别名解析：转换@/等路径别名 (filePathTransAlias)
模块定位：基于tsconfig.json的路径映射
扩展处理：智能补全文件扩展名



#### 4. 状态管理 (src/tools/optionsTranser/index.ts)
进度反馈：状态栏多阶段提示 (setStatusBarText)


