/**
 * 模板解析器
 * 将模板字符串解析为AST
 */
import { NodeTypes, ElementNode, TextNode, InterpolationNode, AttributeNode, DirectiveNode, RootNode, ExpressionNode, CompilerOptions } from './types'

/**
 * 解析上下文
 */
interface ParserContext {
  source: string
  options: CompilerOptions
  // 当前正在解析的标签名栈，用于检测结束标签
  tagStack: string[]
}

/**
 * 默认分隔符 {{ }}
 */
const defaultDelimiters: [string, string] = ['{{', '}}']

/**
 * 解析模板为AST
 * @param template 模板字符串
 * @param options 编译选项
 * @returns AST根节点
 */
export function parse(template: string, options: CompilerOptions = {}): RootNode {
  // 创建解析上下文
  const context = createParserContext(template, options)
  
  // 解析子节点
  const children = parseChildren(context)
  
  // 返回根节点
  return {
    type: NodeTypes.ROOT,
    children,
    loc: {
      start: 0,
      end: template.length,
      source: template
    }
  }
}

/**
 * 创建解析上下文
 */
function createParserContext(content: string, options: CompilerOptions): ParserContext {
  return {
    source: content,
    options: options,
    tagStack: []
  }
}

/**
 * 解析子节点
 */
function parseChildren(context: ParserContext) {
  const nodes = []
  
  // 循环解析，直到遇到结束标签或源码解析完毕
  while (!isEnd(context)) {
    const { source } = context
    let node
    
    // 检查是否遇到了结束标签
    if (source.startsWith('</')) {
      // 如果是结束标签，但不是当前标签的结束标签，那么是语法错误
      // 这里我们简单地返回已解析的节点
      break
    }
    
    // 解析插值表达式 {{ ... }}
    if (source.startsWith((context.options.delimiters || defaultDelimiters)[0])) {
      node = parseInterpolation(context)
    }
    // 解析元素节点 <div>...</div>
    else if (source[0] === '<' && /[a-z]/i.test(source[1])) {
      node = parseElement(context)
    }
    // 解析文本节点
    else {
      node = parseText(context)
    }
    
    // 防止无限循环
    if (node === null) {
      break
    }
    
    nodes.push(node)
  }
  
  return nodes
}

/**
 * 判断是否解析结束
 */
function isEnd(context: ParserContext): boolean {
  const { source, tagStack } = context
  
  // 如果源码为空，则解析结束
  if (source.length === 0) {
    return true
  }
  
  // 如果有当前标签，检查是否遇到了结束标签
  if (tagStack.length > 0 && source.startsWith('</')) {
    // 检查是否是当前标签的结束标签
    const match = /^<\/([a-z][^\t\r\n\f />]*)/i.exec(source)
    if (match && match[1] === tagStack[tagStack.length - 1]) {
      return true
    }
  }
  
  return false
}

/**
 * 解析插值表达式 {{ ... }}
 */
function parseInterpolation(context: ParserContext): InterpolationNode {
  const [open, close] = context.options.delimiters || defaultDelimiters
  
  const closeIndex = context.source.indexOf(close, open.length)
  if (closeIndex === -1) {
    throw new Error('插值表达式缺少结束分隔符')
  }
  
  // 消费开始分隔符
  advanceBy(context, open.length)
  
  // 提取表达式内容
  const rawContentLength = closeIndex - open.length
  const rawContent = context.source.slice(0, rawContentLength)
  const content = rawContent.trim()
  
  // 消费表达式内容和结束分隔符
  advanceBy(context, rawContentLength + close.length)
  
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      isStatic: false,
      loc: {
        start: 0,
        end: content.length,
        source: content
      }
    },
    loc: {
      start: 0,
      end: open.length + rawContentLength + close.length,
      source: open + rawContent + close
    }
  }
}

/**
 * 解析元素节点
 */
function parseElement(context: ParserContext): ElementNode | null {
  // 保存原始位置，用于错误恢复
  const start = context.source
  
  // 解析开始标签
  const element = parseStartTag(context)
  if (!element) {
    return null
  }
  
  // 将当前标签名入栈
  context.tagStack.push(element.tag)
  
  // 解析子节点
  const children = parseChildren(context)
  
  // 检查是否有对应的结束标签
  if (context.source.startsWith(`</${element.tag}`)) {
    // 解析结束标签
    parseEndTag(context, element.tag)
    
    // 出栈
    context.tagStack.pop()
    
    // 设置子节点
    element.children = children
    
    return element
  } else {
    // 如果没有找到对应的结束标签，这是一个错误
    // 在实际情况下应该抛出错误，但这里我们简单地恢复原始状态并返回null
    console.warn(`元素 <${element.tag}> 缺少结束标签`)
    context.source = start
    context.tagStack.pop()
    return null
  }
}

/**
 * 解析开始标签
 */
function parseStartTag(context: ParserContext): ElementNode | null {
  // 匹配开始标签
  const match = /^<([a-z][^\t\r\n\f />]*)/i.exec(context.source)
  if (!match) {
    return null
  }
  
  const tag = match[1]
  
  // 消费开始标签
  advanceBy(context, match[0].length)
  
  // 解析属性和指令
  let props = parseAttributes(context)
  
  // 判断是否是自闭合标签
  const isSelfClosing = context.source.startsWith('/>')
  advanceBy(context, isSelfClosing ? 2 : 1)
  
  // 如果是自闭合标签，不需要有结束标签
  if (isSelfClosing) {
    return {
      type: NodeTypes.ELEMENT,
      tag,
      props,
      children: [],
      loc: {
        start: 0,
        end: 0,
        source: ''
      }
    }
  }
  
  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children: [],
    loc: {
      start: 0,
      end: 0,
      source: ''
    }
  }
}

/**
 * 解析结束标签
 */
function parseEndTag(context: ParserContext, expectedTag: string): void {
  // 验证结束标签
  const match = /^<\/([a-z][^\t\r\n\f />]*)/i.exec(context.source)
  if (!match || match[1] !== expectedTag) {
    throw new Error(`结束标签不匹配: 预期 </${expectedTag}>, 实际 ${context.source.slice(0, 10)}...`)
  }
  
  // 消费结束标签
  advanceBy(context, match[0].length)
  
  // 跳过空白字符
  while (/^[\t\r\n\f ]/.test(context.source)) {
    advanceBy(context, 1)
  }
  
  // 消费结束标签的 >
  if (context.source[0] !== '>') {
    throw new Error(`结束标签缺少 '>': ${context.source.slice(0, 10)}...`)
  }
  
  advanceBy(context, 1)
}

/**
 * 解析属性和指令
 */
function parseAttributes(context: ParserContext) {
  const props = []
  const attributeNames = new Set<string>()
  
  // 循环解析属性，直到遇到结束符号
  while (
    context.source.length > 0 &&
    !context.source.startsWith('>') &&
    !context.source.startsWith('/>')
  ) {
    // 跳过空白字符
    if (/^[\t\r\n\f ]/.test(context.source)) {
      advanceBy(context, 1)
      continue
    }
    
    // 解析属性或指令
    const attr = parseAttribute(context)
    
    // 检查属性名重复
    if (attributeNames.has(attr.name)) {
      console.warn(`重复的属性: ${attr.name}`)
    }
    attributeNames.add(attr.name)
    
    props.push(attr)
  }
  
  return props
}

/**
 * 解析单个属性或指令
 */
function parseAttribute(context: ParserContext): AttributeNode | DirectiveNode {
  // 匹配属性名
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
  if (!match) {
    throw new Error('无效的属性名')
  }
  
  const name = match[0]
  advanceBy(context, name.length)
  
  // 解析属性值
  let value: TextNode | undefined = undefined
  
  // 跳过属性名后的空白字符
  while (/^[\t\r\n\f ]/.test(context.source)) {
    advanceBy(context, 1)
  }
  
  // 如果有等号，解析属性值
  if (context.source[0] === '=') {
    advanceBy(context, 1)
    
    // 跳过等号后的空白字符
    while (/^[\t\r\n\f ]/.test(context.source)) {
      advanceBy(context, 1)
    }
    
    value = parseAttributeValue(context)
  }
  
  // 判断是否是指令
  if (name.startsWith('v-')) {
    // 解析指令
    return parseDirective(name, value, context)
  }
  // 判断是否是简写指令 :prop 或 @event
  else if (name.startsWith(':') || name.startsWith('@') || name.startsWith('#')) {
    // 解析简写指令
    return parseShorthandDirective(name, value, context)
  }
  
  // 普通属性
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value,
    loc: {
      start: 0,
      end: name.length + (value ? value.loc!.end + 1 : 0),
      source: name + (value ? `="${value.content}"` : '')
    }
  }
}

/**
 * 解析属性值
 */
function parseAttributeValue(context: ParserContext): TextNode {
  let content = ''
  
  // 判断引号类型
  const quote = context.source[0]
  const isQuoted = quote === '"' || quote === "'"
  
  if (isQuoted) {
    // 消费开始引号
    advanceBy(context, 1)
    
    // 查找结束引号
    const endIndex = context.source.indexOf(quote)
    if (endIndex === -1) {
      throw new Error('属性值缺少结束引号')
    }
    
    // 提取属性值
    content = context.source.slice(0, endIndex)
    
    // 消费属性值和结束引号
    advanceBy(context, endIndex + 1)
  } else {
    // 无引号属性值
    const match = /^[^\t\r\n\f >]+/.exec(context.source)
    if (!match) {
      throw new Error('无效的属性值')
    }
    
    content = match[0]
    advanceBy(context, content.length)
  }
  
  return {
    type: NodeTypes.TEXT,
    content,
    loc: {
      start: 0,
      end: content.length,
      source: content
    }
  }
}

/**
 * 解析指令
 */
function parseDirective(name: string, value: TextNode | undefined, context: ParserContext): DirectiveNode {
  // 提取指令名称（去掉v-前缀）
  const dirName = name.slice(2)
  
  // 解析修饰符
  const modifiers: string[] = []
  let modifierIndex = dirName.indexOf('.')
  let directiveName = modifierIndex > -1 ? dirName.slice(0, modifierIndex) : dirName
  
  // 提取修饰符
  while (modifierIndex > -1) {
    const nextModifierIndex = dirName.indexOf('.', modifierIndex + 1)
    const modifier = dirName.slice(
      modifierIndex + 1,
      nextModifierIndex > -1 ? nextModifierIndex : undefined
    )
    modifiers.push(modifier)
    modifierIndex = nextModifierIndex
  }
  
  // 创建表达式节点
  let exp: ExpressionNode | undefined = undefined
  if (value) {
    exp = {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: value.content,
      isStatic: false,
      loc: value.loc!
    }
  }
  
  return {
    type: NodeTypes.DIRECTIVE,
    name: directiveName,
    exp,
    arg: undefined,
    modifiers,
    loc: {
      start: 0,
      end: name.length + (value ? value.loc!.end + 1 : 0),
      source: name + (value ? `="${value.content}"` : '')
    }
  }
}

/**
 * 解析简写指令
 * :prop => v-bind:prop
 * @event => v-on:event
 * #slot => v-slot:slot
 */
function parseShorthandDirective(name: string, value: TextNode | undefined, context: ParserContext): DirectiveNode {
  let dirName: string
  let argContent: string
  
  if (name.startsWith(':')) {
    // :prop 简写
    dirName = 'bind'
    argContent = name.slice(1)
  } else if (name.startsWith('@')) {
    // @event 简写
    dirName = 'on'
    argContent = name.slice(1)
  } else {
    // #slot 简写
    dirName = 'slot'
    argContent = name.slice(1)
  }
  
  // 解析修饰符
  const modifiers: string[] = []
  let modifierIndex = argContent.indexOf('.')
  let arg = modifierIndex > -1 ? argContent.slice(0, modifierIndex) : argContent
  
  // 提取修饰符
  while (modifierIndex > -1) {
    const nextModifierIndex = argContent.indexOf('.', modifierIndex + 1)
    const modifier = argContent.slice(
      modifierIndex + 1,
      nextModifierIndex > -1 ? nextModifierIndex : undefined
    )
    modifiers.push(modifier)
    modifierIndex = nextModifierIndex
  }
  
  // 创建参数表达式节点
  const argNode: ExpressionNode = {
    type: NodeTypes.SIMPLE_EXPRESSION,
    content: arg,
    isStatic: true,
    loc: {
      start: 0,
      end: arg.length,
      source: arg
    }
  }
  
  // 创建表达式节点
  let exp: ExpressionNode | undefined = undefined
  if (value) {
    exp = {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: value.content,
      isStatic: false,
      loc: value.loc!
    }
  }
  
  return {
    type: NodeTypes.DIRECTIVE,
    name: dirName,
    exp,
    arg: argNode,
    modifiers,
    loc: {
      start: 0,
      end: name.length + (value ? value.loc!.end + 1 : 0),
      source: name + (value ? `="${value.content}"` : '')
    }
  }
}

/**
 * 解析文本节点
 */
function parseText(context: ParserContext): TextNode {
  const [open] = context.options.delimiters || defaultDelimiters
  
  // 查找结束位置（遇到插值表达式或标签）
  let endIndex = context.source.length
  const ltIndex = context.source.indexOf('<')
  const delimiterIndex = context.source.indexOf(open)
  
  // 取最近的结束位置
  if (ltIndex > -1 && ltIndex < endIndex) {
    endIndex = ltIndex
  }
  if (delimiterIndex > -1 && delimiterIndex < endIndex) {
    endIndex = delimiterIndex
  }
  
  // 提取文本内容
  const content = context.source.slice(0, endIndex)
  
  // 消费文本内容
  advanceBy(context, content.length)
  
  return {
    type: NodeTypes.TEXT,
    content,
    loc: {
      start: 0,
      end: content.length,
      source: content
    }
  }
}

/**
 * 前进指定长度，消费已解析的内容
 */
function advanceBy(context: ParserContext, numberOfCharacters: number): void {
  context.source = context.source.slice(numberOfCharacters)
} 