/**
 * 运行时核心模块入口文件
 */

// 虚拟DOM相关
export { h } from './h'
export { Fragment, Text, Comment, createVNode } from './vnode'

// 渲染器相关
export { nextTick } from './renderer'

// 组件相关
export {
  defineComponent,
  getCurrentInstance
} from './component'

// 生命周期钩子
export {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted
} from './apiLifecycle'

// 创建应用
// 注意：这里不导出createApp，由runtime-dom提供实际实现
export { createAppAPI } from './apiCreateApp'

// 依赖注入
export { provide, inject } from './apiInject' 