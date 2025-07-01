/**
 * AST转换器
 * 对AST进行优化和转换
 */
import { NodeTypes, RootNode, ElementNode, TextNode, InterpolationNode, CompilerOptions, DirectiveNode, AttributeNode } from './types'

/**
 * 转换上下文
 */
interface TransformContext {
  root: RootNode
  options: CompilerOptions
  helpers: Set<string>
  currentNode: any
  parent: any
  childIndex: number
  removeNode: () => void
  replaceNode: (node: any) => void
}

/**
 * 转换器函数类型
 */
type TransformFn = (node: any, context: TransformContext) => void | (() => void)

/**
 * 转换插件类型
 */
type TransformPlugin = {
  name: string
  transform: TransformFn
  transformExit?: TransformFn
}

/**
 * 转换AST
 * @param root AST根节点
 * @param options 编译选项
 * @returns 转换后的AST
 */
export function transform(root: RootNode, options: CompilerOptions = {}): RootNode {
  // 创建转换上下文
  const context = createTransformContext(root, options)
  
  // 遍历AST
  traverseNode(root, context)
  
  // 返回转换后的AST
  return root
}

/**
 * 创建转换上下文
 */
function createTransformContext(root: RootNode, options: CompilerOptions): TransformContext {
  const context: TransformContext = {
    root,
    options,
    helpers: new Set<string>(),
    currentNode: null,
    parent: null,
    childIndex: 0,
    removeNode: () => {
      if (context.parent) {
        const children = context.parent.children
        const index = context.childIndex
        if (index !== -1) {
          children.splice(index, 1)
        }
      }
    },
    replaceNode: (node) => {
      if (context.parent) {
        const children = context.parent.children
        const index = context.childIndex
        if (index !== -1) {
          children[index] = node
        }
      }
    }
  }
  
  return context
}

/**
 * 遍历AST节点
 */
function traverseNode(node: any, context: TransformContext) {
  // 保存当前节点信息
  const parent = context.parent
  const childIndex = context.childIndex
  
  // 更新上下文
  context.parent = node
  context.currentNode = node
  
  // 应用转换器
  const transformers = getBaseTransformers()
  
  // 进入节点
  const exitFns: Function[] = []
  for (let i = 0; i < transformers.length; i++) {
    const transformer = transformers[i]
    const onExit = transformer.transform(node, context)
    if (onExit) exitFns.push(onExit)
    
    // 如果节点被删除，直接返回
    if (!context.currentNode) {
      return
    }
  }
  
  // 递归遍历子节点
  if (node.type === NodeTypes.ROOT || node.type === NodeTypes.ELEMENT) {
    for (let i = 0; i < node.children.length; i++) {
      context.childIndex = i
      traverseNode(node.children[i], context)
    }
  } else if (node.type === NodeTypes.INTERPOLATION) {
    // 处理插值表达式的内容
    traverseNode(node.content, context)
  }
  
  // 恢复上下文
  context.currentNode = node
  context.parent = parent
  context.childIndex = childIndex
  
  // 执行退出函数
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}

/**
 * 获取基础转换器
 */
function getBaseTransformers(): TransformPlugin[] {
  return [
    transformText,
    transformElement,
    transformDirectives
  ]
}

/**
 * 转换文本节点
 */
const transformText: TransformPlugin = {
  name: 'transformText',
  transform(node, context) {
    if (node.type !== NodeTypes.TEXT) return
    
    // 去除文本节点中的首尾空白
    if (node.content.trim() === '') {
      // 如果是纯空白节点，可以考虑删除
      if (!/\S/.test(node.content)) {
        context.removeNode()
        return
      }
    }
  }
}

/**
 * 转换元素节点
 */
const transformElement: TransformPlugin = {
  name: 'transformElement',
  transform(node, context) {
    if (node.type !== NodeTypes.ELEMENT) return
    
    // 在这里可以处理元素节点，例如添加帮助函数
    context.helpers.add('createVNode')
    
    // 返回退出函数
    return () => {
      // 在所有子节点处理完后执行
      if (node.children.length === 1 && node.children[0].type === NodeTypes.TEXT) {
        // 如果只有一个文本子节点，可以优化
        context.helpers.add('createTextVNode')
      }
    }
  }
}

/**
 * 转换指令
 */
const transformDirectives: TransformPlugin = {
  name: 'transformDirectives',
  transform(node, context) {
    if (node.type !== NodeTypes.ELEMENT) return
    
    // 处理元素上的指令
    for (let i = 0; i < node.props.length; i++) {
      const prop = node.props[i]
      if (prop.type === NodeTypes.DIRECTIVE) {
        // 处理不同类型的指令
        transformDirective(prop, node, context)
      }
    }
  }
}

/**
 * 转换单个指令
 */
function transformDirective(dir: DirectiveNode, node: ElementNode, context: TransformContext) {
  switch (dir.name) {
    case 'bind':
      // 处理v-bind指令
      context.helpers.add('resolveProps')
      break
    case 'on':
      // 处理v-on指令
      context.helpers.add('registerEvents')
      break
    case 'html':
      // 处理v-html指令
      context.helpers.add('createHtml')
      break
    case 'text':
      // 处理v-text指令
      context.helpers.add('createText')
      break
    case 'model':
      // 处理v-model指令
      context.helpers.add('withModel')
      break
    case 'if':
    case 'else-if':
    case 'else':
      // 处理条件渲染指令
      context.helpers.add('renderIf')
      break
    case 'for':
      // 处理列表渲染指令
      context.helpers.add('renderList')
      break
    case 'slot':
      // 处理插槽指令
      context.helpers.add('renderSlot')
      break
  }
} 