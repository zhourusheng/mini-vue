# Mini-Vue

一个用于学习Vue3核心原理的迷你实现版本。

## 最新版本 (v1.2.0)

升级了模板编译系统，支持更多高级特性和优化。

### 新增特性

- 支持更完整的模板语法解析和编译
- 添加静态提升(hoisting)优化
- 支持v-once、v-memo等新指令
- 支持动态插槽名
- 改进了空白处理策略
- 添加了模板编译CLI工具

## 功能特性

Mini-Vue实现了Vue3的核心功能，包括：

1. 响应式系统
   - 基于Proxy的响应式实现
   - 支持ref、reactive、computed等API
   - 支持effect、watch、watchEffect等监听API

2. 运行时渲染系统
   - 虚拟DOM实现
   - Diff算法
   - 组件系统

3. 模板编译系统
   - 模板解析
   - AST转换
   - 代码生成

## 使用方法

### 安装

```bash
npm install @donglan/mvue
```

### 使用示例

```javascript
import { createApp, ref } from '@donglan/mvue'

const app = createApp({
  setup() {
    const count = ref(0)
    const increment = () => {
      count.value++
    }
    
    return {
      count,
      increment
    }
  }
})

app.mount('#app')
```

### 模板编译

从v1.2.0开始，你可以使用模板编译工具：

```bash
# 安装全局命令
npm link

# 编译模板文件
mvue-compile template.html -o render.js

# 查看帮助
mvue-compile --help
```

## 实现细节

### 响应式系统

Mini-Vue的响应式系统基于ES6的Proxy实现，通过拦截对象的属性访问和修改操作，实现依赖追踪和自动更新。

### 运行时核心

运行时系统负责管理组件树、处理虚拟DOM渲染和更新。它包含了高效的Diff算法，能够最小化DOM操作以提高性能。

### 模板编译系统

模板编译系统将Vue模板编译成渲染函数，主要包含三个阶段：

1. **解析(Parse)**: 将模板字符串解析为抽象语法树(AST)
2. **转换(Transform)**: 对AST进行各种转换和优化
3. **生成(Generate)**: 生成JavaScript渲染函数代码

#### 编译优化

- **静态提升**: 将静态内容提升到渲染函数之外，避免重复创建
- **补丁标记**: 为动态内容生成优化的补丁标记，提高更新性能
- **空白处理**: 智能处理模板中的空白字符，减小生成代码体积

## 示例项目

查看`example`目录中的示例项目，体验Mini-Vue的各项功能。

## 贡献指南

欢迎贡献代码和提出问题！请遵循以下步骤：

1. Fork本仓库
2. 创建你的特性分支: `git checkout -b feature/amazing-feature`
3. 提交你的改动: `git commit -m 'Add some amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

## 许可证

MIT 