/**
 * ref实现
 * 提供对基本类型值的响应式
 */
import { trackEffects, triggerEffects, isTracking, ReactiveEffect } from './effect'
import { reactive, isProxy, toRaw, isReactive, isReadonly } from './reactive'
import { hasOwn, isObject, isArray } from '../shared'

/**
 * ref对象的标识符，用于判断一个对象是否为ref
 */
export const RefSymbol = Symbol('refSymbol')

/**
 * ref对象接口
 */
export interface Ref<T = any> {
  /**
   * ref标识符
   */
  [RefSymbol]: true
  /**
   * 用于自动解包的标识
   */
  __v_isRef: true
  /**
   * ref的值
   */
  value: T
}

/**
 * 创建一个包含内部值的响应式对象
 * @param value 原始值
 * @returns 包装后的ref对象
 */
export function ref<T>(value: T): Ref<T> {
  return createRef(value)
}

/**
 * 创建一个浅层ref，只有.value是响应式的，值本身不会被转换
 * @param value 原始值
 * @returns 包装后的浅层ref对象
 */
export function shallowRef<T>(value: T): Ref<T> {
  return createRef(value, true)
}

/**
 * 判断值是否为ref对象
 * @param r 需要判断的值
 * @returns 是否为ref对象
 */
export function isRef<T>(r: any): r is Ref<T> {
  return !!(r && r[RefSymbol] === true)
}

/**
 * 如果参数是一个ref，则返回内部值，否则返回参数本身
 * @param ref 可能是ref的值
 * @returns 如果是ref则返回内部值，否则返回原值
 */
export function unref<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? ref.value : ref
}

/**
 * 创建ref对象
 */
class RefImpl<T> {
  /**
   * ref内部的值
   */
  private _value: T
  /**
   * 原始值
   */
  private _rawValue: T
  /**
   * 依赖集合
   */
  public dep: Set<ReactiveEffect> = new Set()
  /**
   * ref标识
   */
  public readonly [RefSymbol]: true = true as const
  /**
   * 用于自动解包的标识
   */
  public readonly __v_isRef: true = true as const

  constructor(value: T, private readonly _shallow = false) {
    // 如果是浅层模式，直接使用原始值
    // 否则可能需要转换为响应式对象
    this._rawValue = value
    this._value = _shallow ? value : convert(value)
  }

  /**
   * value的getter
   */
  get value() {
    // 追踪依赖
    if (isTracking()) {
      trackEffects(this.dep)
    }
    return this._value
  }

  /**
   * value的setter
   */
  set value(newValue) {
    // 如果新值与原始值相同，不做处理
    if (Object.is(toRaw(newValue), this._rawValue)) {
      return
    }
    
    // 更新原始值
    this._rawValue = newValue
    // 更新内部值（可能需要转换为响应式）
    this._value = this._shallow ? newValue : convert(newValue)
    // 触发依赖更新
    triggerEffects(this.dep)
  }
}

/**
 * 转换值为响应式或保持原样
 * @param value 需要转换的值
 * @returns 转换后的值
 */
const convert = <T>(value: T): T => isObject(value) ? reactive(value) : value

/**
 * 创建ref
 * @param rawValue 原始值
 * @param shallow 是否浅层ref
 * @returns ref对象
 */
function createRef<T>(rawValue: T, shallow = false): Ref<T> {
  return new RefImpl<T>(rawValue, shallow)
}

/**
 * 将一个响应式对象的属性转换为ref
 * @param object 响应式对象
 * @param key 属性名
 * @returns 指向该属性的ref
 */
export function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K
): Ref<T[K]> {
  // 如果已经是ref，直接返回
  if (isRef(object[key])) {
    return object[key] as any
  }
  
  return new ObjectRefImpl(object, key)
}

/**
 * 将响应式对象的所有属性转换为ref
 * @param object 响应式对象
 * @returns 包含所有属性ref的对象
 */
export function toRefs<T extends object>(object: T): {
  [K in keyof T]: Ref<T[K]>
} {
  const ret: any = {}
  // 遍历对象的所有属性，转换为ref
  for (const key in object) {
    ret[key] = toRef(object, key)
  }
  return ret
}

/**
 * 对象属性的ref实现
 */
class ObjectRefImpl<T extends object, K extends keyof T> {
  /**
   * ref标识
   */
  public readonly [RefSymbol]: true = true as const
  /**
   * 用于自动解包的标识
   */
  public readonly __v_isRef: true = true as const

  constructor(private readonly _object: T, private readonly _key: K) {}

  /**
   * 通过代理对象访问原对象的属性
   */
  get value() {
    return this._object[this._key]
  }

  /**
   * 通过代理对象设置原对象的属性
   */
  set value(newValue) {
    this._object[this._key] = newValue
  }
}

/**
 * 接受一个对象，该对象可能包含ref，返回一个普通对象
 * 通过代理使访问嵌套ref的.value变得不需要
 * @param objectWithRefs 可能包含ref的对象
 * @returns 代理对象
 */
export function proxyRefs<T extends object>(objectWithRefs: T): T {
  // 如果已经是响应式对象，直接返回
  if (isReactive(objectWithRefs)) {
    return objectWithRefs
  }
  
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      // 自动展开ref
      return unref(Reflect.get(target, key, receiver))
    },
    set(target: any, key, value, receiver) {
      // 如果原属性是ref，而新值不是ref，则设置.value
      const oldValue = target[key]
      if (isRef(oldValue) && !isRef(value)) {
        oldValue.value = value
        return true
      } else {
        // 否则直接设置新值
        return Reflect.set(target, key, value, receiver)
      }
    }
  })
} 