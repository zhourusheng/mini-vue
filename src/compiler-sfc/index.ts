/**
 * SFC (单文件组件) 编译器
 * 用于解析和编译 Vue 单文件组件 (*.vue)
 */

// 导出解析器
export {
  parseSFC,
  SFCBlock,
  SFCBlockType,
  SFCTemplateBlock,
  SFCScriptBlock,
  SFCStyleBlock,
  SFCCustomBlock,
  SFCParseResult,
  SFCDescriptor,
  SFCParseOptions
} from './parse'

// 导出编译器
export {
  compileSFC,
  compileTemplate,
  compileScript,
  SFCCompileOptions,
  SFCCompileResult
} from './compile'

// 便捷API：解析并编译SFC
import { parseSFC } from './parse'
import { compileSFC, SFCCompileOptions, SFCCompileResult } from './compile'

export function compileVueFile(
  source: string,
  options: SFCCompileOptions = {}
): SFCCompileResult {
  const { descriptor, errors: parseErrors } = parseSFC(source, {
    filename: options.filename
  })
  
  const result = compileSFC(descriptor, options)
  
  // 合并解析错误和编译错误
  result.errors.unshift(...parseErrors)
  
  return result
} 