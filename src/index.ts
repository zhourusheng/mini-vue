/**
 * @donglan/mVue 入口文件
 * 导出所有公共API
 */

// 响应式系统
export {
  reactive,
  readonly,
  shallowReactive,
  shallowReadonly,
  ref,
  shallowRef,
  toRef,
  toRefs,
  unref,
  proxyRefs,
  isRef,
  isProxy,
  isReactive,
  isReadonly,
  effect,
  track,
  trigger,
  computed,
  watch,
  watchEffect
} from './reactivity'

// 运行时核心
export {
  h,
  Fragment,
  Text,
  Comment,
  createVNode,
  nextTick,
  defineComponent,
  getCurrentInstance,
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  provide,
  inject
} from './runtime-core'

// 运行时DOM相关
export { createRenderer, createApp, render } from './runtime-dom'

// 模板编译系统
export {
  compile,
  compileToFunction
} from './compiler'

// SFC编译器 (新增)
export {
  parseSFC,
  compileSFC,
  compileVueFile
} from './compiler-sfc'

// 版本信息
export const version = '1.2.0' 