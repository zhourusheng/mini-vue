/**
 * 生命周期钩子API实现
 */
import { currentInstance, ComponentInternalInstance, setCurrentInstance } from './component'

// 生命周期钩子名称
export const enum LifecycleHooks {
  BEFORE_MOUNT = 'beforeMount',
  MOUNTED = 'mounted',
  BEFORE_UPDATE = 'beforeUpdate',
  UPDATED = 'updated',
  BEFORE_UNMOUNT = 'beforeUnmount',
  UNMOUNTED = 'unmounted'
}

/**
 * 创建生命周期钩子注册函数
 * @param type 钩子类型
 * @returns 钩子注册函数
 */
function createLifecycleHook(type: LifecycleHooks) {
  return (hook: Function) => {
    // 获取当前组件实例
    const instance = currentInstance
    
    if (instance) {
      // 获取组件实例上该类型的钩子数组，如果不存在则创建
      const hooks = instance.lifeCycles[type] || (instance.lifeCycles[type] = [])
      
      // 注册钩子函数
      hooks.push(hook)
    } else {
      console.warn(`${type} 钩子只能在 setup 中调用!`)
    }
  }
}

/**
 * 在组件挂载前调用
 */
export const onBeforeMount = createLifecycleHook(LifecycleHooks.BEFORE_MOUNT)

/**
 * 在组件挂载后调用
 */
export const onMounted = createLifecycleHook(LifecycleHooks.MOUNTED)

/**
 * 在组件更新前调用
 */
export const onBeforeUpdate = createLifecycleHook(LifecycleHooks.BEFORE_UPDATE)

/**
 * 在组件更新后调用
 */
export const onUpdated = createLifecycleHook(LifecycleHooks.UPDATED)

/**
 * 在组件卸载前调用
 */
export const onBeforeUnmount = createLifecycleHook(LifecycleHooks.BEFORE_UNMOUNT)

/**
 * 在组件卸载后调用
 */
export const onUnmounted = createLifecycleHook(LifecycleHooks.UNMOUNTED)

/**
 * 调用组件实例上的指定生命周期钩子
 * @param instance 组件实例
 * @param type 钩子类型
 */
export function callLifecycleHooks(
  instance: ComponentInternalInstance,
  type: LifecycleHooks
) {
  // 获取指定类型的钩子函数数组
  const hooks = instance.lifeCycles[type]
  
  if (hooks) {
    // 保存当前实例状态
    const prevInstance = currentInstance
    
    // 设置当前实例为钩子所属实例，以便钩子内部可以访问实例
    setCurrentInstance(instance)
    
    try {
      // 按注册顺序调用所有钩子函数
      hooks.forEach(hook => hook())
    } finally {
      // 恢复原来的当前实例
      setCurrentInstance(prevInstance)
    }
  }
} 