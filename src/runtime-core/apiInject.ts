/**
 * 依赖注入API实现
 */
import { currentInstance } from './component'

/**
 * 提供一个值，可以被后代组件注入
 * @param key 提供值的键
 * @param value 提供的值
 */
export function provide<T>(key: string | symbol, value: T) {
  // 只能在setup中调用
  if (!currentInstance) {
    console.warn(`provide() 只能在 setup 中调用!`)
    return
  }

  // 获取当前实例的provides对象
  let { provides } = currentInstance
  
  // 获取父级provides
  const parentProvides = currentInstance.parent?.provides
  
  // 如果当前provides与父级相同，说明是第一次调用provide
  // 需要创建一个新的provides对象，以原型链方式继承父级provides
  if (provides === parentProvides) {
    provides = currentInstance.provides = Object.create(parentProvides || null)
  }
  
  // 设置provide的值
  provides[key as string] = value
}

/**
 * 注入上级组件提供的值
 * @param key 注入值的键
 * @param defaultValue 默认值，在找不到提供值时使用
 * @returns 注入的值或默认值
 */
export function inject<T>(
  key: string | symbol,
  defaultValue?: T
): T | undefined {
  // 只能在setup中调用
  if (!currentInstance) {
    console.warn(`inject() 只能在 setup 中调用!`)
    return defaultValue
  }

  // 获取父级的provides对象
  const provides = currentInstance.parent?.provides
  
  // 如果有提供值，返回它
  if (provides && key in provides) {
    return provides[key as string] as T
  } 
  // 否则返回默认值
  else {
    return defaultValue
  }
} 