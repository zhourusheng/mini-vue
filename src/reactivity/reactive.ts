/**
 * 实现响应式对象的核心模块
 * 使用Proxy实现对象的响应式
 */
import { isObject } from '../shared'
import { track, trigger } from './effect'

/**
 * 代理配置标识，用于标记不同的代理行为
 */
export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  RAW = '__v_raw'
}

/**
 * 响应式对象WeakMap缓存
 */
const reactiveMap = new WeakMap<object, any>()
const readonlyMap = new WeakMap<object, any>()
const shallowReactiveMap = new WeakMap<object, any>()
const shallowReadonlyMap = new WeakMap<object, any>()

/**
 * 创建响应式对象的处理器
 * @param isReadonly 是否只读
 * @param shallow 是否浅层响应式
 * @returns Proxy处理器
 */
function createReactiveHandler(isReadonly = false, shallow = false) {
  return {
    /**
     * 获取属性时的处理
     * @param target 目标对象
     * @param key 属性名
     * @param receiver 代理对象
     */
    get(target: object, key: string | symbol, receiver: object) {
      // 处理特殊标识属性
      if (key === ReactiveFlags.IS_REACTIVE) {
        return !isReadonly
      } else if (key === ReactiveFlags.IS_READONLY) {
        return isReadonly
      } else if (key === ReactiveFlags.RAW) {
        return target
      }

      const result = Reflect.get(target, key, receiver)

      // 不是只读对象时，进行依赖追踪
      if (!isReadonly) {
        track(target, key)
      }

      // 浅层响应式直接返回结果
      if (shallow) {
        return result
      }

      // 深层次响应式处理，对嵌套对象进行响应式转换
      if (isObject(result)) {
        return isReadonly ? readonly(result) : reactive(result)
      }

      return result
    },

    /**
     * 设置属性时的处理
     * @param target 目标对象
     * @param key 属性名
     * @param value 设置的值
     * @param receiver 代理对象
     */
    set(target: object, key: string | symbol, value: any, receiver: object) {
      // 只读对象不允许修改
      if (isReadonly) {
        console.warn(`属性 ${String(key)} 是只读的`)
        return true
      }
      
      const oldValue = (target as any)[key]
      const result = Reflect.set(target, key, value, receiver)
      
      // 值发生变化时，触发依赖更新
      if (oldValue !== value) {
        trigger(target, key)
      }
      
      return result
    },

    /**
     * 判断属性是否存在时的处理
     * @param target 目标对象
     * @param key 属性名
     */
    has(target: object, key: string | symbol) {
      const result = Reflect.has(target, key)
      // 依赖追踪
      if (!isReadonly) {
        track(target, key)
      }
      return result
    },

    /**
     * 删除属性时的处理
     * @param target 目标对象
     * @param key 属性名
     */
    deleteProperty(target: object, key: string | symbol) {
      // 只读对象不允许删除属性
      if (isReadonly) {
        console.warn(`属性 ${String(key)} 是只读的`)
        return true
      }
      
      const hadKey = Object.prototype.hasOwnProperty.call(target, key)
      const result = Reflect.deleteProperty(target, key)
      
      // 如果属性存在并成功删除，触发依赖更新
      if (hadKey && result) {
        trigger(target, key)
      }
      
      return result
    }
  }
}

/**
 * 标准响应式处理器
 */
const reactiveHandler = createReactiveHandler()
/**
 * 只读响应式处理器
 */
const readonlyHandler = createReactiveHandler(true)
/**
 * 浅层响应式处理器
 */
const shallowReactiveHandler = createReactiveHandler(false, true)
/**
 * 浅层只读响应式处理器
 */
const shallowReadonlyHandler = createReactiveHandler(true, true)

/**
 * 创建响应式对象
 * @param target 目标对象
 * @returns 响应式代理对象
 */
export function reactive<T extends object>(target: T): T {
  // 如果是只读对象的代理，直接返回
  if (isReadonly(target)) {
    return target
  }
  return createReactiveObject(target, reactiveMap, reactiveHandler)
}

/**
 * 创建只读对象
 * @param target 目标对象
 * @returns 只读代理对象
 */
export function readonly<T extends object>(target: T): T {
  return createReactiveObject(target, readonlyMap, readonlyHandler)
}

/**
 * 创建浅层响应式对象（只有第一层属性是响应式的）
 * @param target 目标对象
 * @returns 浅层响应式代理对象
 */
export function shallowReactive<T extends object>(target: T): T {
  return createReactiveObject(target, shallowReactiveMap, shallowReactiveHandler)
}

/**
 * 创建浅层只读对象（只有第一层属性是只读的）
 * @param target 目标对象
 * @returns 浅层只读代理对象
 */
export function shallowReadonly<T extends object>(target: T): T {
  return createReactiveObject(target, shallowReadonlyMap, shallowReadonlyHandler)
}

/**
 * 创建响应式对象的通用函数
 * @param target 目标对象
 * @param proxyMap 代理对象缓存Map
 * @param handler 代理处理器
 * @returns 代理对象
 */
function createReactiveObject<T extends object>(
  target: T,
  proxyMap: WeakMap<object, any>,
  handler: ProxyHandler<any>
): T {
  // 如果不是对象，直接返回
  if (!isObject(target)) {
    console.warn(`reactive 只能用于对象, 收到: ${typeof target}`)
    return target
  }

  // 如果已经是同类型的代理，直接返回
  // 例如: reactive(reactive(obj)) 返回 reactive(obj)
  if (
    (target as any)[ReactiveFlags.RAW] &&
    !((target as any)[ReactiveFlags.IS_REACTIVE] && proxyMap === readonlyMap)
  ) {
    return target
  }

  // 如果已经有缓存，直接返回缓存的代理
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 创建代理
  const proxy = new Proxy(target, handler)
  // 缓存代理
  proxyMap.set(target, proxy)
  return proxy
}

/**
 * 检查一个对象是否是由 reactive 创建的响应式代理
 * @param value 要检查的值
 * @returns 是否为响应式对象
 */
export function isReactive(value: unknown): boolean {
  if (!isObject(value)) return false
  return !!(value as any)[ReactiveFlags.IS_REACTIVE]
}

/**
 * 检查一个对象是否是由 readonly 创建的只读代理
 * @param value 要检查的值
 * @returns 是否为只读对象
 */
export function isReadonly(value: unknown): boolean {
  if (!isObject(value)) return false
  return !!(value as any)[ReactiveFlags.IS_READONLY]
}

/**
 * 检查一个对象是否是由 reactive 或 readonly 创建的代理
 * @param value 要检查的值
 * @returns 是否为代理对象
 */
export function isProxy(value: unknown): boolean {
  return isReactive(value) || isReadonly(value)
}

/**
 * 获取响应式或只读代理的原始对象
 * @param observed 代理对象
 * @returns 原始对象
 */
export function toRaw<T>(observed: T): T {
  // 如果不是对象或没有RAW属性，直接返回
  if (!isObject(observed)) return observed
  
  const raw = (observed as any)[ReactiveFlags.RAW]
  return raw ? toRaw(raw) : observed
} 