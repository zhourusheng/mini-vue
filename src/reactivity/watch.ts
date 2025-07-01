/**
 * watch API实现
 */
import { isRef, Ref } from './ref'
import { isReactive } from './reactive'
import { effect, ReactiveEffect } from './effect'
import { isFunction, isObject } from '../shared'

export interface WatchOptions {
  immediate?: boolean
  deep?: boolean
}

// 获取响应式对象的值
function getValue(source: any) {
  return isRef(source) ? source.value : source
}

// 遍历对象的所有属性，触发依赖收集
function traverse(value: any, seen = new Set()) {
  if (!isObject(value) || seen.has(value)) {
    return value
  }
  
  seen.add(value)
  
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen)
    }
  } else {
    for (const key in value) {
      traverse(value[key], seen)
    }
  }
  
  return value
}

/**
 * 监听一个响应式对象或ref，当值变化时调用回调函数
 * @param source 要监听的响应式对象或ref
 * @param cb 当值变化时调用的回调函数
 * @param options 选项
 * @returns 停止监听的函数
 */
export function watch<T = any>(
  source: Ref<T> | (() => T) | T,
  cb: (newValue: T, oldValue: T) => void,
  options: WatchOptions = {}
) {
  const { immediate = false, deep = false } = options
  
  let getter: () => any
  
  // 处理不同类型的source
  if (isRef(source)) {
    // 如果是ref，直接返回其值
    getter = () => source.value
  } else if (isFunction(source)) {
    // 如果是函数，直接使用
    getter = source as () => T
  } else if (isReactive(source)) {
    // 如果是响应式对象
    getter = () => source
    // 如果需要深度监听
    if (deep) {
      getter = () => traverse(source)
    }
  } else {
    // 不是响应式对象，直接返回
    getter = () => {}
    console.warn(`watch source must be a ref, reactive object, or getter function.`)
  }
  
  // 保存旧值和新值
  let oldValue: T
  let newValue: T
  
  // 清理函数，在下一次回调之前执行
  let cleanup: (() => void) | undefined
  const onInvalidate = (fn: () => void) => {
    cleanup = fn
  }
  
  // 实际执行回调的函数
  const job = () => {
    newValue = effectFn()
    
    // 在调用回调之前执行清理函数
    if (cleanup) {
      cleanup()
    }
    
    // 调用回调函数
    cb(newValue, oldValue)
    
    // 更新旧值
    oldValue = newValue
  }
  
  // 创建effect
  const effectFn = effect(getter, {
    lazy: true,
    scheduler: job // 当依赖变化时，调用job函数
  })
  
  // 初始化
  if (immediate) {
    // 如果需要立即执行
    job()
  } else {
    // 否则先获取旧值
    oldValue = effectFn()
  }
  
  // 返回停止监听的函数
  return () => {
    effectFn.effect.stop()
  }
}

/**
 * 监听多个源
 */
export function watchEffect(effect: (onInvalidate: (fn: () => void) => void) => void) {
  // 简单实现，直接使用watch
  return watch(() => {
    effect((fn) => fn)
    return 0
  }, () => {})
} 