#!/usr/bin/env node

/**
 * Mini-Vue 模板编译器命令行工具
 * 用法: node template-compiler.js <template>
 * 或从标准输入读取
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { compile } from '../dist/mvue.esm-bundler.js'

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 解析命令行参数
const args = process.argv.slice(2)
const options = {
  output: null,
  sourceMap: false,
  hoistStatic: true,
  mode: 'function',
  comments: false
}

let templateFile = null
let template = null

// 解析参数
for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  
  if (arg === '-o' || arg === '--output') {
    options.output = args[++i]
  } else if (arg === '--source-map') {
    options.sourceMap = true
  } else if (arg === '--no-hoist') {
    options.hoistStatic = false
  } else if (arg === '--comments') {
    options.comments = true
  } else if (arg === '--module') {
    options.mode = 'module'
  } else if (arg === '--help' || arg === '-h') {
    printHelp()
    process.exit(0)
  } else if (!templateFile && !arg.startsWith('-')) {
    templateFile = arg
  }
}

// 打印帮助信息
function printHelp() {
  console.log(`
Mini-Vue 模板编译器 v1.2.0
用法: node template-compiler.js [选项] [文件]

选项:
  -o, --output <file>  指定输出文件
  --source-map         生成 source map
  --no-hoist           禁用静态提升
  --comments           保留注释
  --module             使用 ES 模块模式生成代码
  -h, --help           显示帮助信息

示例:
  # 编译模板文件
  node template-compiler.js template.html -o render.js
  
  # 从标准输入读取
  echo "<div>{{ msg }}</div>" | node template-compiler.js
  `)
}

// 从文件或标准输入读取模板
async function getTemplate() {
  if (templateFile) {
    return fs.readFileSync(templateFile, 'utf-8')
  }
  
  // 检查是否有管道输入
  if (!process.stdin.isTTY) {
    // 从标准输入读取
    let data = ''
    process.stdin.setEncoding('utf-8')
    
    for await (const chunk of process.stdin) {
      data += chunk
    }
    
    return data
  }
  
  // 没有输入源
  console.error('错误: 没有提供模板！请提供模板文件或通过管道输入。')
  console.error('使用 --help 查看帮助信息。')
  process.exit(1)
}

// 编译模板
async function compileTemplate() {
  try {
    template = await getTemplate()
    
    // 编译模板
    const result = compile(template, {
      sourceMap: options.sourceMap,
      hoistStatic: options.hoistStatic,
      comments: options.comments,
      mode: options.mode
    })
    
    // 处理结果
    if (options.output) {
      fs.writeFileSync(options.output, result.code, 'utf-8')
      console.log(`已将编译结果写入到 ${options.output}`)
      
      // 如果有source map，也写入文件
      if (options.sourceMap && result.map) {
        fs.writeFileSync(`${options.output}.map`, JSON.stringify(result.map), 'utf-8')
        console.log(`已将 source map 写入到 ${options.output}.map`)
      }
    } else {
      // 输出到控制台
      console.log(result.code)
    }
  } catch (error) {
    console.error('编译错误:', error.message)
    process.exit(1)
  }
}

// 运行编译器
compileTemplate() 