/**
 * 计算属性实现
 * 提供基于响应式依赖的缓存计算
 */
import { isFunction } from '../shared'
import { Ref, RefSymbol } from './ref'
import { ReactiveEffect } from './effect'
import { trackEffects, triggerEffects } from './effect'

/**
 * 计算属性选项接口
 */
export interface ComputedOptions<T> {
  /**
   * 计算getter
   */
  get: () => T
  /**
   * 计算setter
   */
  set?: (v: T) => void
}

/**
 * 创建计算属性
 * @param getterOrOptions getter函数或选项对象
 * @returns 计算属性ref
 */
export function computed<T>(
  getterOrOptions: (() => T) | ComputedOptions<T>
): Ref<T> {
  // 初始化getter和setter
  let getter: () => T
  let setter: (v: T) => void = () => {
    console.warn('计算属性是只读的')
  }

  // 根据参数类型设置getter和setter
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions as () => T
  } else {
    getter = getterOrOptions.get
    if (getterOrOptions.set) {
      setter = getterOrOptions.set
    }
  }

  // 创建并返回计算属性实例
  return new ComputedRefImpl(getter, setter)
}

/**
 * 计算属性ref实现
 */
class ComputedRefImpl<T> {
  /**
   * 缓存的值
   */
  private _value!: T
  /**
   * 标记值是否需要重新计算
   */
  private _dirty = true
  /**
   * 用于收集计算属性依赖的副作用集合
   */
  public readonly dep: Set<ReactiveEffect> = new Set()
  /**
   * ref标记
   */
  public readonly [RefSymbol]: true = true as const
  /**
   * 用于自动解包的标识
   */
  public readonly __v_isRef: true = true as const
  /**
   * 副作用函数实例，用于追踪依赖
   */
  private _effect: ReactiveEffect<T>

  constructor(
    getter: () => T,
    private readonly _setter: (value: T) => void
  ) {
    // 创建副作用函数，用于追踪getter中的依赖
    this._effect = new ReactiveEffect(getter, () => {
      // 如果值还没变脏，则设为脏值并触发依赖更新
      if (!this._dirty) {
        this._dirty = true
        triggerEffects(this.dep)
      }
    })
  }

  /**
   * 获取计算值
   */
  get value() {
    // 收集依赖
    trackEffects(this.dep)
    
    // 如果值脏了(需要重新计算)，重新运行getter获取最新值
    if (this._dirty) {
      this._dirty = false
      this._value = this._effect.run()
    }
    
    return this._value
  }

  /**
   * 设置计算值
   */
  set value(newValue: T) {
    // 调用用户提供的setter
    this._setter(newValue)
  }
} 