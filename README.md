# @donglan/mVue

一个简化版的Vue3实现，用于学习Vue3核心原理。

## 特性

- ✅ 响应式系统 (reactive, ref, computed, effect)
- ✅ 组件系统
- ✅ 虚拟DOM与diff算法
- ✅ 生命周期钩子
- ✅ 依赖注入 (provide/inject)
- ✅ 基础应用API (createApp, component)
- ✅ 简化版的渲染器

## 安装

```bash
# 从npm私服安装
npm install @donglan/mVue --registry=http://114.55.81.115/
# 或使用pnpm
pnpm add @donglan/mVue --registry=http://114.55.81.115/
```

或者直接使用构建后的版本：

```html
<script src="path/to/mvue.global.js"></script>
```

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test
```

## 快速开始

### 使用响应式API

```js
import { ref, reactive, computed, effect } from '@donglan/mVue'

// 使用ref
const count = ref(0)
console.log(count.value) // 0
count.value++
console.log(count.value) // 1

// 使用reactive
const state = reactive({
  count: 0,
  message: 'Hello'
})
state.count++
console.log(state.count) // 1

// 使用computed
const doubleCount = computed(() => count.value * 2)
console.log(doubleCount.value) // 2

// 使用effect
effect(() => {
  console.log(`Count: ${count.value}, Double: ${doubleCount.value}`)
})
// 输出: Count: 1, Double: 2
count.value++
// 自动输出: Count: 2, Double: 4
```

### 创建组件和应用

```js
import { createApp, ref, h } from '@donglan/mVue'

// 创建一个计数器组件
const Counter = {
  setup() {
    const count = ref(0)
    
    const increment = () => {
      count.value++
    }
    
    return {
      count,
      increment
    }
  },
  render() {
    return h('div', null, [
      h('p', null, `当前计数: ${this.count.value}`),
      h('button', { onClick: this.increment }, '增加')
    ])
  }
}

// 创建应用实例
const app = createApp({
  render() {
    return h(Counter)
  }
})

// 挂载到DOM
app.mount('#app')
```

## API参考

### 响应式API

- `reactive(obj)`: 将一个对象转换为响应式对象
- `ref(value)`: 创建一个响应式的ref对象
- `computed(() => {})`: 创建一个计算属性
- `effect(() => {})`: 创建一个副作用函数
- `readonly(obj)`: 创建一个只读的响应式对象
- `toRef(obj, key)`: 将对象的一个属性转换为ref
- `toRefs(obj)`: 将响应式对象的所有属性转换为ref对象
- `isRef(value)`: 检查值是否为ref对象
- `isReactive(value)`: 检查值是否为reactive对象
- `isReadonly(value)`: 检查值是否为只读对象
- `unref(value)`: 如果是ref则返回内部值，否则返回原值
- `proxyRefs(obj)`: 对象的ref属性自动解包

### 组件API

- `defineComponent(options)`: 定义组件
- `getCurrentInstance()`: 获取当前组件实例
- `onBeforeMount(fn)`: 注册挂载前钩子
- `onMounted(fn)`: 注册挂载后钩子
- `onBeforeUpdate(fn)`: 注册更新前钩子
- `onUpdated(fn)`: 注册更新后钩子
- `onBeforeUnmount(fn)`: 注册卸载前钩子
- `onUnmounted(fn)`: 注册卸载后钩子
- `provide(key, value)`: 提供数据给后代组件
- `inject(key, defaultValue?)`: 注入祖先组件提供的数据

### 应用API

- `createApp(rootComponent)`: 创建应用实例
- `app.mount('#selector')`: 挂载应用
- `app.component('name', Component)`: 注册全局组件
- `app.provide(key, value)`: 提供应用级数据
- `app.use(plugin)`: 使用插件

### 渲染API

- `h(type, props?, children?)`: 创建虚拟节点
- `createVNode(type, props?, children?)`: 创建虚拟节点
- `render(vnode, container)`: 渲染虚拟节点到容器

## 目录结构

```
src/
├── reactivity/         # 响应式系统
│   ├── reactive.ts     # 响应式对象
│   ├── ref.ts          # ref实现
│   ├── effect.ts       # 依赖收集与触发
│   └── computed.ts     # 计算属性
├── runtime-core/       # 运行时核心
│   ├── vnode.ts        # 虚拟节点
│   ├── renderer.ts     # 渲染器
│   ├── component.ts    # 组件实现
│   ├── h.ts            # h函数
│   └── apiLifecycle.ts # 生命周期API
├── runtime-dom/        # DOM平台相关
│   └── index.ts        # DOM渲染器
└── shared/             # 共享工具函数
    └── index.ts        # 工具函数
```

## 协议

MIT 