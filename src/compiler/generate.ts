/**
 * 代码生成器
 * 将AST转换为渲染函数代码
 */
import { NodeTypes, RootNode, ElementNode, TextNode, InterpolationNode, CompilerOptions, DirectiveNode, AttributeNode, ExpressionNode, CodegenResult } from './types'

/**
 * 代码生成上下文
 */
interface CodegenContext {
  code: string
  indentLevel: number
  options: CompilerOptions
  push(code: string): void
  indent(): void
  deindent(): void
  newline(): void
}

/**
 * 生成代码
 * @param ast AST根节点
 * @param options 编译选项
 * @returns 生成的代码
 */
export function generate(ast: RootNode, options: CompilerOptions = {}): CodegenResult {
  // 创建代码生成上下文
  const context = createCodegenContext(options)
  
  // 生成前导代码
  genPreamble(context)
  
  // 生成渲染函数
  genFunctionPreamble(ast, context)
  
  // 生成根节点
  genNode(ast, context)
  
  // 生成函数结束
  context.push(`}`)
  
  return {
    code: context.code
  }
}

/**
 * 创建代码生成上下文
 */
function createCodegenContext(options: CompilerOptions): CodegenContext {
  return {
    code: '',
    indentLevel: 0,
    options,
    push(code) {
      this.code += code
    },
    indent() {
      this.indentLevel++
      this.newline()
    },
    deindent() {
      this.indentLevel--
      this.newline()
    },
    newline() {
      this.push('\n' + `  `.repeat(this.indentLevel))
    }
  }
}

/**
 * 生成前导代码
 */
function genPreamble(context: CodegenContext) {
  context.push(`// 由 mini-vue 模板编译器生成的代码`)
  context.newline()
}

/**
 * 生成渲染函数前导代码
 */
function genFunctionPreamble(ast: RootNode, context: CodegenContext) {
  context.push(`return function render(_ctx, _cache) {`)
  context.indent()
  context.push(`with (_ctx) {`)
  context.indent()
  context.push(`return `)
}

/**
 * 生成节点代码
 */
function genNode(node: any, context: CodegenContext) {
  switch (node.type) {
    case NodeTypes.ROOT:
      genChildren(node, context)
      break
    case NodeTypes.ELEMENT:
      genElement(node, context)
      break
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    default:
      // 未知节点类型
      context.push(`/* 未知节点类型: ${node.type} */`)
  }
}

/**
 * 生成子节点代码
 */
function genChildren(node: RootNode | ElementNode, context: CodegenContext) {
  const { children } = node
  
  if (children.length === 0) {
    context.push(`null`)
    return
  }
  
  if (children.length === 1) {
    // 只有一个子节点，直接生成
    genNode(children[0], context)
    return
  }
  
  // 多个子节点，生成数组
  context.push(`[`)
  for (let i = 0; i < children.length; i++) {
    genNode(children[i], context)
    if (i < children.length - 1) {
      context.push(`, `)
    }
  }
  context.push(`]`)
}

/**
 * 生成元素节点代码
 */
function genElement(node: ElementNode, context: CodegenContext) {
  const { tag, props, children } = node
  
  context.push(`h(`)
  
  // 生成标签名
  context.push(`"${tag}", `)
  
  // 生成属性
  if (props.length) {
    genProps(props, context)
  } else {
    context.push(`null`)
  }
  
  // 生成子节点
  if (children.length) {
    context.push(`, `)
    if (children.length === 1) {
      // 只有一个子节点
      genNode(children[0], context)
    } else {
      // 多个子节点
      context.push(`[`)
      for (let i = 0; i < children.length; i++) {
        genNode(children[i], context)
        if (i < children.length - 1) {
          context.push(`, `)
        }
      }
      context.push(`]`)
    }
  }
  
  context.push(`)`)
}

/**
 * 生成属性代码
 */
function genProps(props: Array<AttributeNode | DirectiveNode>, context: CodegenContext) {
  context.push(`{`)
  
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    
    if (prop.type === NodeTypes.ATTRIBUTE) {
      // 普通属性
      genAttr(prop, context)
    } else if (prop.type === NodeTypes.DIRECTIVE) {
      // 指令
      genDir(prop, context)
    }
    
    if (i < props.length - 1) {
      context.push(`, `)
    }
  }
  
  context.push(`}`)
}

/**
 * 生成普通属性代码
 */
function genAttr(attr: AttributeNode, context: CodegenContext) {
  const { name, value } = attr
  
  context.push(`${JSON.stringify(name)}: `)
  
  if (value) {
    context.push(`${JSON.stringify(value.content)}`)
  } else {
    context.push(`""`)
  }
}

/**
 * 生成指令代码
 */
function genDir(dir: DirectiveNode, context: CodegenContext) {
  const { name, exp, arg, modifiers } = dir
  
  // 根据指令类型生成不同的代码
  if (name === 'bind') {
    // v-bind
    context.push(`${arg ? arg.content : ''}: `)
    if (exp) {
      genExpression(exp, context)
    } else {
      context.push(`undefined`)
    }
  } else if (name === 'on') {
    // v-on
    const eventName = arg ? arg.content : ''
    context.push(`on${eventName[0].toUpperCase() + eventName.slice(1)}: `)
    
    if (exp) {
      if (modifiers.includes('stop')) {
        context.push(`$event => {`)
        context.push(`$event.stopPropagation(); `)
        context.push(`return ${exp.content}($event)`)
        context.push(`}`)
      } else if (modifiers.includes('prevent')) {
        context.push(`$event => {`)
        context.push(`$event.preventDefault(); `)
        context.push(`return ${exp.content}($event)`)
        context.push(`}`)
      } else {
        context.push(exp.content)
      }
    } else {
      context.push(`() => {}`)
    }
  } else if (name === 'html') {
    // v-html
    context.push(`innerHTML: `)
    if (exp) {
      genExpression(exp, context)
    } else {
      context.push(`""`)
    }
  } else if (name === 'text') {
    // v-text
    context.push(`textContent: `)
    if (exp) {
      genExpression(exp, context)
    } else {
      context.push(`""`)
    }
  } else if (name === 'model') {
    // v-model
    context.push(`model: `)
    if (exp) {
      genExpression(exp, context)
    } else {
      context.push(`undefined`)
    }
  } else {
    // 其他指令
    context.push(`${name}: `)
    if (exp) {
      genExpression(exp, context)
    } else {
      context.push(`undefined`)
    }
  }
}

/**
 * 生成文本节点代码
 */
function genText(node: TextNode, context: CodegenContext) {
  context.push(JSON.stringify(node.content))
}

/**
 * 生成插值表达式代码
 */
function genInterpolation(node: InterpolationNode, context: CodegenContext) {
  context.push(`_ctx.`)
  genExpression(node.content, context)
}

/**
 * 生成表达式代码
 */
function genExpression(node: ExpressionNode, context: CodegenContext) {
  context.push(node.content)
} 