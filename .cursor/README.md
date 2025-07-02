# .cursor 目录

此目录用于存放Cursor编辑器相关的配置和规则文件。

## 规则组织结构

Cursor规则按照项目结构进行组织：

```
mini-vue/
  .cursor/
    rules/                  # 项目级规则
      common.mdc            # 通用开发环境与规范
      typescript.mdc        # TypeScript编码规范
    README.md               # 说明文档
  src/
    compiler/
      .cursor/rules/        # 编译器特定规则
        compiler-rules.mdc
    compiler-sfc/
      .cursor/rules/        # SFC编译器特定规则
        sfc-rules.mdc
    reactivity/
      .cursor/rules/        # 响应式系统特定规则
        reactivity-rules.mdc
```

## Cursor Rules 说明

Cursor Rules是系统规则，也就是大模型的系统提示词。每次新开一个聊天上下文时，这些规则会预置在新上下文的头部，作为前置的聊天背景，可以引导或约束模型对用户的输出。

### Rules 类型
1. **Always**（始终应用这个规则）
2. **Auto Attached**（可以填写正则表达式，用于设置哪些文件需要运用这个Rule）
3. **Agent Requested**（可以填写description，AI通过描述和问题自主决定是否使用）
4. **Manual**（默认类型，只有使用 @Cursor rule 指令手动选中才会使用） 