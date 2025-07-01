/**
 * 模板编译系统测试
 */
import { compile, compileToFunction } from './compile'
import { h } from '../runtime-core'

/**
 * 测试模板编译
 */
export function testCompiler() {
  // 测试简单模板
  const template1 = `<div>Hello {{ name }}</div>`
  const result1 = compile(template1, { h })
  console.log('编译结果1:', result1.code)
  
  // 测试带指令的模板
  const template2 = `
    <div class="container" :title="message" @click="handleClick">
      <p v-if="show">{{ message }}</p>
      <ul>
        <li v-for="item in items">{{ item.name }}</li>
      </ul>
      <input v-model="value" />
      <div v-html="htmlContent"></div>
    </div>
  `
  const result2 = compile(template2, { h })
  console.log('编译结果2:', result2.code)
  
  // 测试组件模板
  const template3 = `
    <my-component 
      :prop="value" 
      @event="handleEvent">
      <template #header>
        <h1>{{ title }}</h1>
      </template>
      <template #default>
        <p>{{ content }}</p>
      </template>
    </my-component>
  `
  const result3 = compile(template3, { h })
  console.log('编译结果3:', result3.code)
  
  // 测试新增的高级特性
  
  // 1. v-once 指令
  const template4 = `<div v-once>静态内容: {{ staticValue }}</div>`
  const result4 = compile(template4, { 
    h,
    hoistStatic: true 
  })
  console.log('编译结果4 (v-once):', result4.code)
  
  // 2. v-memo 指令
  const template5 = `<div v-memo="[count]">仅当count变化时更新: {{ message }}</div>`
  const result5 = compile(template5, { h })
  console.log('编译结果5 (v-memo):', result5.code)
  
  // 3. 动态插槽
  const template6 = `
    <my-component>
      <template v-for="item in items" #[item.slot]="slotProps">
        {{ item.content }} - {{ slotProps.data }}
      </template>
    </my-component>
  `
  const result6 = compile(template6, { h })
  console.log('编译结果6 (动态插槽):', result6.code)
  
  // 4. 自定义指令
  const template7 = `<input v-focus v-highlight:warning.animate="color" />`
  const result7 = compile(template7, { h })
  console.log('编译结果7 (自定义指令):', result7.code)
  
  // 5. 空白处理选项测试
  const template8 = `
    <div>
      多行文本
      测试空白处理
    </div>
  `
  const resultPreserve = compile(template8, { 
    h,
    whitespace: 'preserve' 
  })
  console.log('编译结果8a (保留空白):', resultPreserve.code)
  
  const resultCondense = compile(template8, { 
    h,
    whitespace: 'condense'
  })
  console.log('编译结果8b (压缩空白):', resultCondense.code)
  
  // 生成可执行的渲染函数
  try {
    const render = compileToFunction(`<div>测试渲染函数 {{ msg }}</div>`, { h })
    const vnode = render.call({ msg: '成功' })
    console.log('渲染结果:', vnode)
  } catch (error) {
    console.error('渲染函数执行错误:', error)
  }
}

// 执行测试
// testCompiler() 