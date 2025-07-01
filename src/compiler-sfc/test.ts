import { parseSFC, compileSFC, compileVueFile } from './index'

// 测试SFC字符串
const sfcSource = `
<template>
  <div class="example">{{ msg }}</div>
</template>

<script>
export default {
  data() {
    return {
      msg: 'Hello world!'
    }
  }
}
</script>

<style>
.example {
  color: red;
}
</style>

<custom1>
  This could be e.g. documentation for the component.
</custom1>
`

// 测试解析SFC
console.log('测试解析SFC:')
const parseResult = parseSFC(sfcSource, { filename: 'Example.vue' })
console.log('解析结果:', JSON.stringify(parseResult.descriptor, null, 2))
console.log('错误数量:', parseResult.errors.length)

// 测试编译SFC
console.log('\n测试编译SFC:')
const compileResult = compileSFC(parseResult.descriptor, { filename: 'Example.vue' })
console.log('编译结果代码:')
console.log(compileResult.code)
console.log('编译错误数量:', compileResult.errors.length)

// 测试一步到位API
console.log('\n测试一步到位API:')
const oneStepResult = compileVueFile(sfcSource, { filename: 'Example.vue' })
console.log('编译结果代码:')
console.log(oneStepResult.code)
console.log('编译错误数量:', oneStepResult.errors.length)

// 输出测试结果
console.log('\n测试完成!')
if (parseResult.errors.length === 0 && 
    compileResult.errors.length === 0 && 
    oneStepResult.errors.length === 0) {
  console.log('✅ 所有测试通过!')
} else {
  console.log('❌ 测试失败!')
} 