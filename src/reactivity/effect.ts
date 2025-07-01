/**
 * 响应式系统的副作用函数实现
 * 负责跟踪和触发依赖
 */

// 当前活跃的副作用函数
let activeEffect: ReactiveEffect | undefined

// 副作用函数是否应该被收集
let shouldTrack = false

/**
 * 副作用函数栈，用于处理嵌套effect
 */
const effectStack: ReactiveEffect[] = []

/**
 * 储存目标对象到其属性的映射
 * WeakMap<目标对象, Map<属性键, Set<依赖函数>>>
 */
const targetMap = new WeakMap<object, Map<any, Set<ReactiveEffect>>>()

/**
 * 副作用函数类
 */
export class ReactiveEffect<T = any> {
  /**
   * 活跃状态标记
   */
  active = true
  /**
   * 依赖此副作用的集合
   */
  deps: Set<ReactiveEffect>[] = []
  /**
   * 父副作用
   */
  parent: ReactiveEffect | undefined = undefined

  /**
   * 创建副作用函数实例
   * @param fn 原始函数
   * @param scheduler 调度器，可以自定义触发时的行为
   */
  constructor(
    public fn: () => T,
    public scheduler?: (job: ReactiveEffect) => void
  ) {}

  /**
   * 运行副作用函数
   * @returns 函数执行结果
   */
  run() {
    // 如果已停止，直接执行原始函数不进行追踪
    if (!this.active) {
      return this.fn()
    }

    // 处理嵌套effect，保存父级effect
    let parent: ReactiveEffect | undefined = activeEffect
    let lastShouldTrack = shouldTrack

    try {
      this.parent = parent
      activeEffect = this
      shouldTrack = true

      // 清除上一轮的依赖集合，重新收集依赖
      cleanupEffect(this)
      
      // 执行函数，会触发代理的getter，从而重新收集依赖
      return this.fn()
    } finally {
      // 恢复之前的状态
      activeEffect = this.parent
      shouldTrack = lastShouldTrack
      this.parent = undefined
    }
  }

  /**
   * 停止副作用函数的追踪
   */
  stop() {
    if (this.active) {
      cleanupEffect(this)
      this.active = false
    }
  }
}

/**
 * 清除副作用函数的所有依赖关系
 * @param effect 需要清除依赖的副作用函数
 */
function cleanupEffect(effect: ReactiveEffect) {
  // 从所有依赖的集合中移除该副作用
  const { deps } = effect
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}

/**
 * 创建副作用函数
 * @param fn 原始函数
 * @param options 配置选项
 * @returns 停止追踪的函数
 */
export function effect<T = any>(
  fn: () => T,
  options?: {
    scheduler?: (job: ReactiveEffect) => void
    lazy?: boolean
  }
): {
  (): T
  effect: ReactiveEffect
} {
  // 创建副作用函数实例
  const _effect = new ReactiveEffect(fn, options?.scheduler)
  
  // 如果不是惰性的，立即执行一次
  if (!options?.lazy) {
    _effect.run()
  }
  
  // 返回的runner函数
  const runner = _effect.run.bind(_effect) as any
  runner.effect = _effect
  
  return runner
}

/**
 * 判断是否应该进行依赖追踪
 */
export function isTracking(): boolean {
  return shouldTrack && activeEffect !== undefined
}

/**
 * 追踪属性的依赖关系
 * @param target 目标对象
 * @param key 属性名
 */
export function track(target: object, key: unknown) {
  // 如果不应该追踪或没有活跃的副作用函数，直接返回
  if (!isTracking()) {
    return
  }
  
  // 获取目标对象的依赖Map
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  
  // 获取属性的依赖集合
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set<ReactiveEffect>()
    depsMap.set(key, dep)
  }
  
  // 追踪依赖
  trackEffects(dep)
}

/**
 * 追踪依赖集合
 * @param dep 依赖集合
 */
export function trackEffects(dep: Set<ReactiveEffect>) {
  // 如果依赖已经被收集，则跳过
  if (dep.has(activeEffect!)) {
    return
  }
  
  // 将当前活跃的副作用函数添加到依赖集合
  dep.add(activeEffect!)
  
  // 同时也记录该依赖集合，用于清理
  activeEffect!.deps.push(dep)
}

/**
 * 触发属性的依赖更新
 * @param target 目标对象
 * @param key 属性名
 */
export function trigger(target: object, key: unknown) {
  // 获取目标对象的依赖Map
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // 没有依赖，直接返回
    return
  }
  
  // 获取需要触发的依赖集合
  const dep = depsMap.get(key)
  
  if (dep) {
    triggerEffects(dep)
  }
}

/**
 * 触发依赖集合中的所有副作用函数
 * @param dep 依赖集合
 */
export function triggerEffects(dep: Set<ReactiveEffect>) {
  // 创建依赖的副本，防止在遍历过程中集合发生变化
  const effects = [...dep]
  
  for (const effect of effects) {
    // 避免递归触发
    if (effect !== activeEffect) {
      // 如果有调度器，则使用调度器运行
      if (effect.scheduler) {
        effect.scheduler(effect)
      } else {
        // 否则直接运行副作用函数
        effect.run()
      }
    }
  }
} 