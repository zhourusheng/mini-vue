import { SFCDescriptor, SFCParseResult, SFCScriptBlock, SFCTemplateBlock } from './parse'
import { compile } from '../compiler'
import { compileToFunction } from '../compiler/compile'

export interface SFCCompileOptions {
  filename?: string
  sourceMap?: boolean
  sourceRoot?: string
  scopeId?: string
  isProduction?: boolean
  inlineTemplate?: boolean
}

export interface SFCCompileResult {
  code: string
  errors: Error[]
  tips: string[]
}

// 编译SFC模板
export function compileTemplate(
  template: SFCTemplateBlock,
  options: SFCCompileOptions
): SFCCompileResult {
  const { code, errors = [] } = compile(template.content, {
    // 添加模板编译选项
    isNativeTag: (tag: string) => {
      return ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'input', 'textarea', 'select', 'option', 'ul', 'li', 'ol', 'table', 'tr', 'td', 'th'].includes(tag)
    },
    isBuiltInComponent: (tag: string) => {
      return ['transition', 'transition-group', 'keep-alive', 'teleport'].includes(tag)
    }
  })

  return {
    code,
    errors,
    tips: []
  }
}

// 编译SFC脚本
export function compileScript(
  script: SFCScriptBlock,
  options: SFCCompileOptions
): SFCCompileResult {
  // 简单返回脚本内容，实际上可能需要处理TypeScript等
  return {
    code: script.content,
    errors: [],
    tips: []
  }
}

// 将SFC编译为JavaScript模块
export function compileSFC(
  descriptor: SFCDescriptor,
  options: SFCCompileOptions = {}
): SFCCompileResult {
  const { filename = 'anonymous.vue' } = options
  const errors: Error[] = []
  const tips: string[] = []
  
  // 编译脚本
  let scriptCode = ''
  let scriptSetupCode = ''
  
  if (descriptor.script) {
    const scriptResult = compileScript(descriptor.script, options)
    scriptCode = scriptResult.code
    errors.push(...scriptResult.errors)
    tips.push(...scriptResult.tips)
  }
  
  if (descriptor.scriptSetup) {
    const scriptSetupResult = compileScript(descriptor.scriptSetup, options)
    scriptSetupCode = scriptSetupResult.code
    errors.push(...scriptSetupResult.errors)
    tips.push(...scriptSetupResult.tips)
  }
  
  // 编译模板
  let templateCode = 'null'
  if (descriptor.template) {
    const templateResult = compileTemplate(descriptor.template, options)
    templateCode = templateResult.code
    errors.push(...templateResult.errors)
    tips.push(...templateResult.tips)
  }
  
  // 生成样式导入代码
  const styleImports = descriptor.styles.map((style, i) => {
    return `import './${filename.replace(/\.vue$/, '')}.${i}.css'`
  }).join('\n')
  
  // 生成最终代码
  const code = `
${styleImports}

// 导入Vue运行时
import { h, defineComponent } from '@donglan/mvue'

// 脚本部分
${scriptCode}

// 脚本setup部分
${scriptSetupCode}

// 模板渲染函数
const render = ${templateCode}

// 导出组件
export default defineComponent({
  ...script,
  render
})
`.trim()

  return {
    code,
    errors,
    tips
  }
} 