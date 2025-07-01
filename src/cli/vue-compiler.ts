#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import { compileVueFile, parseSFC, SFCStyleBlock } from '../compiler-sfc'

// 解析命令行参数
const args = process.argv.slice(2)
const inputFile = args[0]
const outputFile = args[1] || inputFile.replace(/\.vue$/, '.js')

// 检查参数
if (!inputFile) {
  console.error('请提供输入文件路径')
  process.exit(1)
}

// 检查文件是否存在
if (!fs.existsSync(inputFile)) {
  console.error(`文件不存在: ${inputFile}`)
  process.exit(1)
}

// 读取文件内容
const source = fs.readFileSync(inputFile, 'utf-8')
const filename = path.basename(inputFile)

// 编译SFC
console.log(`正在编译: ${inputFile}`)
const { code, errors, tips } = compileVueFile(source, { filename })

// 输出错误和提示
if (errors.length) {
  console.error('编译错误:')
  errors.forEach(err => console.error(`  - ${err.message || err}`))
  process.exit(1)
}

if (tips.length) {
  console.log('提示:')
  tips.forEach(tip => console.log(`  - ${tip}`))
}

// 创建输出目录
const outputDir = path.dirname(outputFile)
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// 写入输出文件
fs.writeFileSync(outputFile, code)
console.log(`编译完成: ${outputFile}`)

// 如果有样式块，也生成对应的CSS文件
// 这里简化处理，实际上需要更复杂的处理
const { descriptor } = parseSFC(source, { filename })
if (descriptor.styles.length) {
  descriptor.styles.forEach((style: SFCStyleBlock, i: number) => {
    const cssFile = outputFile.replace(/\.js$/, `.${i}.css`)
    fs.writeFileSync(cssFile, style.content)
    console.log(`生成样式文件: ${cssFile}`)
  })
} 