# Mini-Vue

一个用于学习Vue3核心原理的迷你实现版本。

## 最新版本 (v2.0.1)

升级了单文件组件(SFC)编译系统，支持更多高级特性和优化。

### 新增特性

- 支持单文件组件(SFC)解析和编译
- 支持`<template>`、`<script>`和`<style>`三大块的解析
- 支持`<script setup>`语法
- 支持样式的`scoped`和`module`属性
- 支持自定义块解析
- 改进了模板编译系统的性能和功能

## 功能特性

Mini-Vue实现了Vue3的核心功能，包括：

1. 响应式系统
   - 基于Proxy的响应式实现
   - 支持ref、reactive、computed等API
   - 支持effect、watch、watchEffect等监听API
   - 支持深层响应式和浅层响应式

2. 运行时渲染系统
   - 虚拟DOM实现
   - 高效的Diff算法
   - 完整的组件系统
   - 支持Fragment、Text等特殊节点类型
   - 生命周期钩子函数

3. 模板编译系统
   - 模板解析
   - AST转换
   - 代码生成
   - 静态提升优化
   - 事件缓存优化

4. 单文件组件(SFC)编译系统
   - 解析`.vue`文件的三个主要块
   - 支持自定义块
   - 支持`<script setup>`语法
   - 支持样式的`scoped`和`module`属性

## 使用方法

### 安装

```bash
pnpm add @donglan/mvue
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

你可以使用模板编译工具：

```bash
# 编译模板文件
node vue-compiler.js template.html render.js

# 编译Vue单文件组件
node vue-compiler.js MyComponent.vue MyComponent.js
```

## 实现细节

### 响应式系统

Mini-Vue的响应式系统基于ES6的Proxy实现，通过拦截对象的属性访问和修改操作，实现依赖追踪和自动更新。支持深层响应式和浅层响应式两种模式。

### 运行时核心

运行时系统负责管理组件树、处理虚拟DOM渲染和更新。它包含了高效的Diff算法，能够最小化DOM操作以提高性能。支持组件生命周期、依赖注入、插槽等高级特性。

### 模板编译系统

模板编译系统将Vue模板编译成渲染函数，主要包含三个阶段：

1. **解析(Parse)**: 将模板字符串解析为抽象语法树(AST)
2. **转换(Transform)**: 对AST进行各种转换和优化
3. **生成(Generate)**: 生成JavaScript渲染函数代码

#### 编译优化

- **静态提升**: 将静态内容提升到渲染函数之外，避免重复创建
- **补丁标记**: 为动态内容生成优化的补丁标记，提高更新性能
- **空白处理**: 智能处理模板中的空白字符，减小生成代码体积

### 单文件组件编译

SFC编译器的实现分为几个主要部分：

1. **解析器 (Parser)**: 将SFC源码解析为描述符对象，包含各个块的内容和属性
2. **编译器 (Compiler)**: 将SFC描述符编译为可执行的JavaScript代码
3. **命令行工具 (CLI)**: 提供命令行接口，方便在构建过程中使用

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