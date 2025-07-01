import { SourceLocation } from '../compiler/types'

// SFC块类型
export const enum SFCBlockType {
  Template,
  Script,
  Style,
  Custom
}

// SFC块描述接口
export interface SFCBlock {
  type: SFCBlockType
  content: string
  loc: SourceLocation
  attrs: Record<string, string | true>
  lang?: string
  src?: string
  scoped?: boolean
  module?: string | boolean
}

// SFC模板块
export interface SFCTemplateBlock extends SFCBlock {
  type: SFCBlockType.Template
}

// SFC脚本块
export interface SFCScriptBlock extends SFCBlock {
  type: SFCBlockType.Script
  setup?: boolean // 是否是<script setup>
}

// SFC样式块
export interface SFCStyleBlock extends SFCBlock {
  type: SFCBlockType.Style
  scoped?: boolean
  module?: string | boolean
}

// SFC自定义块
export interface SFCCustomBlock extends SFCBlock {
  type: SFCBlockType.Custom
  customType: string
}

// SFC解析结果
export interface SFCParseResult {
  descriptor: SFCDescriptor
  errors: Error[]
}

// SFC描述符
export interface SFCDescriptor {
  filename: string
  source: string
  template: SFCTemplateBlock | null
  script: SFCScriptBlock | null
  scriptSetup: SFCScriptBlock | null
  styles: SFCStyleBlock[]
  customBlocks: SFCCustomBlock[]
}

// 解析器选项
export interface SFCParseOptions {
  filename?: string
  sourceMap?: boolean
  sourceRoot?: string
  pad?: boolean | 'line' | 'space'
}

// 解析SFC文件
export function parseSFC(
  source: string,
  options: SFCParseOptions = {}
): SFCParseResult {
  const { filename = 'anonymous.vue' } = options
  const errors: Error[] = []
  const descriptor: SFCDescriptor = {
    filename,
    source,
    template: null,
    script: null,
    scriptSetup: null,
    styles: [],
    customBlocks: []
  }

  // 使用正则表达式解析SFC块
  const blockRE = /^<(template|script|style)(?:\s+[^>]*)?>([\s\S]*?)<\/\1>/gm
  const customBlockRE = /^<([a-z][a-z0-9-]*)(?:\s+[^>]*)?>([\s\S]*?)<\/\1>/gm
  const attrRE = /\s+([a-z][a-z0-9-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g

  // 解析属性
  function parseAttrs(attrString: string): Record<string, string | true> {
    const attrs: Record<string, string | true> = {}
    let match: RegExpExecArray | null
    attrRE.lastIndex = 0
    
    while ((match = attrRE.exec(attrString))) {
      const name = match[1]
      const value = match[2] || match[3] || match[4] || true
      attrs[name] = value
    }
    
    return attrs
  }

  // 计算位置信息
  function calculateLoc(
    source: string,
    start: number,
    end: number
  ): SourceLocation {
    const lines = source.slice(0, start).split('\n')
    const lineStart = lines.length
    const columnStart = lines[lines.length - 1]?.length || 0

    const linesEnd = source.slice(0, end).split('\n')
    const lineEnd = linesEnd.length
    const columnEnd = linesEnd[linesEnd.length - 1]?.length || 0

    return {
      start: {
        line: lineStart,
        column: columnStart,
        offset: start
      },
      end: {
        line: lineEnd,
        column: columnEnd,
        offset: end
      },
      source: source.slice(start, end)
    }
  }

  // 解析标准块 (template, script, style)
  let match: RegExpExecArray | null
  blockRE.lastIndex = 0
  
  while ((match = blockRE.exec(source))) {
    const [fullMatch, tag, content] = match
    const start = match.index
    const end = start + fullMatch.length
    const loc = calculateLoc(source, start, end)
    
    // 获取开始标签
    const startTagMatch = fullMatch.match(new RegExp(`^<${tag}([^>]*)>`))
    const startTag = startTagMatch ? startTagMatch[1] : ''
    const attrs = parseAttrs(startTag)
    const lang = attrs.lang as string | undefined

    if (tag === 'template') {
      if (descriptor.template) {
        errors.push(new Error('一个SFC只能包含一个<template>块'))
        continue
      }
      descriptor.template = {
        type: SFCBlockType.Template,
        content: content.trim(),
        loc,
        attrs,
        lang
      }
    } else if (tag === 'script') {
      const isSetup = attrs.setup !== undefined
      const scriptBlock: SFCScriptBlock = {
        type: SFCBlockType.Script,
        content: content.trim(),
        loc,
        attrs,
        lang,
        setup: isSetup
      }
      
      if (isSetup) {
        if (descriptor.scriptSetup) {
          errors.push(new Error('一个SFC只能包含一个<script setup>块'))
          continue
        }
        descriptor.scriptSetup = scriptBlock
      } else {
        if (descriptor.script) {
          errors.push(new Error('一个SFC只能包含一个<script>块'))
          continue
        }
        descriptor.script = scriptBlock
      }
    } else if (tag === 'style') {
      const styleBlock: SFCStyleBlock = {
        type: SFCBlockType.Style,
        content: content.trim(),
        loc,
        attrs,
        lang,
        scoped: attrs.scoped !== undefined,
        module: attrs.module !== undefined 
          ? attrs.module === true 
            ? true 
            : attrs.module as string
          : undefined
      }
      descriptor.styles.push(styleBlock)
    }
  }

  // 解析自定义块
  customBlockRE.lastIndex = 0
  
  while ((match = customBlockRE.exec(source))) {
    const [fullMatch, tag, content] = match
    
    // 跳过已处理的标准块
    if (tag === 'template' || tag === 'script' || tag === 'style') {
      continue
    }
    
    const start = match.index
    const end = start + fullMatch.length
    const loc = calculateLoc(source, start, end)
    
    // 获取开始标签
    const startTagMatch = fullMatch.match(new RegExp(`^<${tag}([^>]*)>`))
    const startTag = startTagMatch ? startTagMatch[1] : ''
    const attrs = parseAttrs(startTag)
    
    descriptor.customBlocks.push({
      type: SFCBlockType.Custom,
      customType: tag,
      content: content.trim(),
      loc,
      attrs,
      lang: attrs.lang as string | undefined
    })
  }

  return {
    descriptor,
    errors
  }
} 