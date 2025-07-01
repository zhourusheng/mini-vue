/**
 * 编译器相关类型定义
 */

/**
 * AST节点类型枚举
 */
export enum NodeTypes {
  ROOT = 'ROOT',                // 根节点
  ELEMENT = 'ELEMENT',          // 元素节点
  TEXT = 'TEXT',                // 文本节点
  INTERPOLATION = 'INTERPOLATION', // 插值表达式
  SIMPLE_EXPRESSION = 'SIMPLE_EXPRESSION', // 简单表达式
  ATTRIBUTE = 'ATTRIBUTE',      // 属性
  DIRECTIVE = 'DIRECTIVE',      // 指令
  COMPOUND_EXPRESSION = 'COMPOUND_EXPRESSION', // 复合表达式
  COMMENT = 'COMMENT',          // 注释节点
  // 新增节点类型
  JS_CALL_EXPRESSION = 'JS_CALL_EXPRESSION',  // JS函数调用表达式
  JS_OBJECT_EXPRESSION = 'JS_OBJECT_EXPRESSION', // JS对象表达式
  JS_PROPERTY = 'JS_PROPERTY',  // JS对象属性
  JS_ARRAY_EXPRESSION = 'JS_ARRAY_EXPRESSION', // JS数组表达式
  JS_CONDITIONAL_EXPRESSION = 'JS_CONDITIONAL_EXPRESSION', // JS条件表达式
  JS_FUNCTION_EXPRESSION = 'JS_FUNCTION_EXPRESSION', // JS函数表达式
  IF = 'IF',                    // v-if节点
  IF_BRANCH = 'IF_BRANCH',      // v-if分支节点
  FOR = 'FOR',                  // v-for节点
  TEXT_CALL = 'TEXT_CALL',      // 文本调用节点
  VNODE_CALL = 'VNODE_CALL',    // 虚拟节点调用
  JS_EXPRESSION = 'JS_EXPRESSION', // JS表达式
  SLOT = 'SLOT'                 // 插槽
}

/**
 * 指令类型
 */
export enum DirectiveTypes {
  IF = 'if',
  ELSE = 'else',
  ELSE_IF = 'else-if',
  FOR = 'for',
  ON = 'on',
  BIND = 'bind',
  MODEL = 'model',
  SLOT = 'slot',
  HTML = 'html',
  TEXT = 'text',
  SHOW = 'show',
  CLOAK = 'cloak',
  MEMO = 'memo',
  ONCE = 'once',
  PRE = 'pre',
  CUSTOM = 'custom'
}

/**
 * 编译选项
 */
export interface CompilerOptions {
  delimiters?: [string, string] // 插值分隔符，默认 {{ }}
  whitespace?: 'preserve' | 'condense' // 空白处理方式
  comments?: boolean // 是否保留注释
  isNativeTag?: (tag: string) => boolean // 是否为原生标签
  isBuiltInComponent?: (tag: string) => boolean // 是否为内置组件
  hoistStatic?: boolean // 是否提升静态内容
  prefixIdentifiers?: boolean // 是否为标识符添加前缀
  cacheHandlers?: boolean // 是否缓存事件处理函数
  nodeTransforms?: NodeTransform[] // 节点转换函数
  directiveTransforms?: Record<string, DirectiveTransform> // 指令转换函数
  transformHoist?: null | ((node: any) => any) // 提升转换函数
  transformOn?: boolean // 是否转换 v-on
  transformModel?: boolean // 是否转换 v-model
  optimizeImports?: boolean // 是否优化导入
  mode?: 'module' | 'function' // 生成代码的模式
  sourceMap?: boolean // 是否生成 sourceMap
  onError?: (error: Error) => void // 错误处理函数
  inline?: boolean // 是否内联生成的代码
}

/**
 * 节点转换函数
 */
export type NodeTransform = (
  node: any,
  context: TransformContext
) => void | (() => void) | (() => void)[]

/**
 * 指令转换函数
 */
export type DirectiveTransform = (
  dir: any,
  node: any,
  context: TransformContext
) => any

/**
 * 位置信息
 */
export interface Position {
  offset: number // 偏移量
  line: number   // 行号
  column: number // 列号
}

/**
 * 位置范围
 */
export interface SourceLocation {
  start: Position // 开始位置
  end: Position   // 结束位置
  source: string  // 源代码
}

/**
 * 转换上下文
 */
export interface TransformContext {
  options: CompilerOptions
  root: any
  helpers: Set<string>
  helper(name: string): string
  nodeTransforms: NodeTransform[]
  directiveTransforms: Record<string, DirectiveTransform>
  addIdentifiers(exp: string): void
  removeIdentifiers(exp: string): void
  parent: any | null
  childIndex: number
  currentNode: any | null
  identifiers: { [name: string]: number | undefined }
  hoists: any[]
  scopes: {
    vFor: number
    vSlot: number
    vPre: number
    vOnce: number
  }
  inSSR: boolean
  prefixIdentifiers: boolean
  cacheHandlers: boolean
  hasHoist: boolean
  onError: CompilerOptions['onError']
}

/**
 * 代码生成结果
 */
export interface CodegenResult {
  code: string
  ast?: any
  map?: any
  errors?: Error[]
}

/**
 * 解析上下文
 */
export interface ParserContext {
  source: string
  originalSource: string
  offset: number
  line: number
  column: number
  options: CompilerOptions
  inPre: boolean
  inVPre: boolean
  onError: CompilerOptions['onError']
}

/**
 * 解析错误类型
 */
export enum ErrorCodes {
  ABRUPT_CLOSING_OF_EMPTY_COMMENT,
  ABSENCE_OF_DIGITS_IN_NUMERIC_CHARACTER_REFERENCE,
  CDATA_IN_HTML_CONTENT,
  CHARACTER_REFERENCE_OUTSIDE_UNICODE_RANGE,
  CONTROL_CHARACTER_REFERENCE,
  DUPLICATE_ATTRIBUTE,
  END_TAG_WITH_ATTRIBUTES,
  END_TAG_WITH_TRAILING_SOLIDUS,
  EOF_BEFORE_TAG_NAME,
  EOF_IN_CDATA,
  EOF_IN_COMMENT,
  EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT,
  EOF_IN_TAG,
  INCORRECTLY_CLOSED_COMMENT,
  INCORRECTLY_OPENED_COMMENT,
  INVALID_FIRST_CHARACTER_OF_TAG_NAME,
  MISSING_ATTRIBUTE_VALUE,
  MISSING_END_TAG_NAME,
  MISSING_EQUALS_SIGN_BEFORE_ATTRIBUTE_VALUE,
  MISSING_WHITESPACE_BETWEEN_ATTRIBUTES,
  NESTED_COMMENT,
  NONCHARACTER_CHARACTER_REFERENCE,
  NULL_CHARACTER_REFERENCE,
  SURROGATE_CHARACTER_REFERENCE,
  UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME,
  UNEXPECTED_CHARACTER_IN_UNQUOTED_ATTRIBUTE_VALUE,
  UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME,
  UNEXPECTED_NULL_CHARACTER,
  UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME,
  UNEXPECTED_SOLIDUS_IN_TAG,
  X_INVALID_END_TAG,
  X_MISSING_END_TAG,
  X_MISSING_INTERPOLATION_END,
  X_MISSING_DIRECTIVE_NAME,
  X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END
}

/**
 * 基础节点接口
 */
export interface Node {
  type: NodeTypes
  loc?: SourceLocation
}

/**
 * 根节点
 */
export interface RootNode extends Node {
  type: NodeTypes.ROOT
  children: TemplateChildNode[]
  helpers?: Set<string>
  components?: string[]
  directives?: string[]
  imports?: string[]
  hoists?: any[]
  codegenNode?: any
}

/**
 * 元素节点
 */
export interface ElementNode extends Node {
  type: NodeTypes.ELEMENT
  tag: string
  tagType?: number
  isSelfClosing?: boolean
  props: Array<AttributeNode | DirectiveNode>
  children: TemplateChildNode[]
  codegenNode?: any
}

/**
 * 文本节点
 */
export interface TextNode extends Node {
  type: NodeTypes.TEXT
  content: string
}

/**
 * 插值节点
 */
export interface InterpolationNode extends Node {
  type: NodeTypes.INTERPOLATION
  content: ExpressionNode
}

/**
 * 表达式节点
 */
export interface ExpressionNode extends Node {
  type: NodeTypes.SIMPLE_EXPRESSION
  content: string
  isStatic: boolean
  constType?: number
  identifiers?: string[]
}

/**
 * 属性节点
 */
export interface AttributeNode extends Node {
  type: NodeTypes.ATTRIBUTE
  name: string
  value: TextNode | undefined
}

/**
 * 指令节点
 */
export interface DirectiveNode extends Node {
  type: NodeTypes.DIRECTIVE
  name: string
  exp: ExpressionNode | undefined
  arg: ExpressionNode | undefined
  modifiers: string[]
}

/**
 * 复合表达式节点
 */
export interface CompoundExpressionNode extends Node {
  type: NodeTypes.COMPOUND_EXPRESSION
  children: (string | Node)[]
}

/**
 * 注释节点
 */
export interface CommentNode extends Node {
  type: NodeTypes.COMMENT
  content: string
}

// 模板子节点类型
export type TemplateChildNode =
  | ElementNode
  | TextNode
  | InterpolationNode
  | CommentNode 