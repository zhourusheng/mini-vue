/**
 * 模板编译器入口
 * 整合解析、转换和代码生成过程
 */
import { parse } from './parse'
import { transform } from './transform'
import { generate } from './generate'
import { CompilerOptions, CodegenResult } from './types'
import { extend } from '../shared'

/**
 * 编译选项扩展
 */
interface ExtendedCompilerOptions extends CompilerOptions {
  h?: Function
  runtimeModuleName?: string
  ssr?: boolean
  scopeId?: string
  filename?: string
  inSSR?: boolean
}

/**
 * 默认编译选项
 */
const defaultCompilerOptions: CompilerOptions = {
  delimiters: ['{{', '}}'],
  whitespace: 'condense',
  comments: false,
  hoistStatic: true,
  cacheHandlers: true,
  prefixIdentifiers: false,
  mode: 'function',
  sourceMap: false
}

/**
 * 编译模板
 * @param template 模板字符串
 * @param options 编译选项
 * @returns 编译结果
 */
export function compile(template: string, options: ExtendedCompilerOptions = {}): CodegenResult {
  try {
    // 合并默认选项
    const finalOptions = extend({}, defaultCompilerOptions, options)
    
    // 1. 解析模板为AST
    const ast = parse(template, finalOptions)
    
    // 2. 转换AST
    const transformedAST = transform(ast, finalOptions)
    
    // 3. 生成代码
    const code = generate(transformedAST, finalOptions)
    
    return code
  } catch (error: any) {
    console.error('模板编译错误:', error)
    return {
      code: `// 编译错误: ${error.message}\nreturn function render() { return null }`,
      errors: [error]
    }
  }
}

/**
 * 编译模板并返回渲染函数
 * @param template 模板字符串
 * @param options 编译选项
 * @returns 渲染函数
 */
export function compileToFunction(template: string, options: ExtendedCompilerOptions = {}): Function {
  const { code } = compile(template, options)
  
  try {
    // 构造环境对象
    const runtimeHelpers = {
      // 可以在这里传入Vue的辅助函数
      h: options.h || ((...args: any[]) => args),
      Text: Symbol('Text'),
      Fragment: Symbol('Fragment'),
      Comment: Symbol('Comment'),
      createVNode: options.h || ((...args: any[]) => args),
      toDisplayString: (val: any) => val == null ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val),
      createCommentVNode: () => null,
      createTextVNode: (text: string) => ({ type: Symbol('Text'), children: text }),
      withDirectives: (vnode: any, directives: any[]) => vnode,
      renderList: (source: any, renderItem: Function) => {
        const result = []
        if (Array.isArray(source) || typeof source === 'string') {
          for (let i = 0, l = source.length; i < l; i++) {
            result.push(renderItem(source[i], i))
          }
        } else if (typeof source === 'number') {
          for (let i = 0; i < source; i++) {
            result.push(renderItem(i + 1, i))
          }
        } else if (typeof source === 'object') {
          for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              result.push(renderItem(source[key], key))
            }
          }
        }
        return result
      },
      renderSlot: (slots: any, name: string, props: any) => slots[name]?.(props),
      resolveComponent: (name: string) => name,
      withModifiers: (fn: Function, modifiers: string[]) => fn
    }
    
    // 使用Function构造函数将代码字符串转换为函数
    return new Function('Vue', code)(runtimeHelpers)
  } catch (error: any) {
    console.error('渲染函数创建错误:', error)
    return () => null
  }
} 