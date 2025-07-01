/**
 * 副作用函数类
 */
export declare class ReactiveEffect<T = any> {
  active: boolean;
  deps: Set<ReactiveEffect>[];
  parent: ReactiveEffect | undefined;
  /**
   * 创建副作用函数实例
   * @param fn 原始函数
   * @param scheduler 调度器，可以自定义触发时的行为
   */
  constructor(fn: () => T, scheduler?: (job: ReactiveEffect) => void);
  /**
   * 运行副作用函数
   * @returns 函数执行结果
   */
  run(): T;
  /**
   * 停止副作用函数的追踪
   */
  stop(): void;
}

/**
 * 创建副作用函数
 * @param fn 原始函数
 * @param options 配置选项
 * @returns 停止追踪的函数
 */
export declare function effect<T = any>(
  fn: () => T,
  options?: {
    scheduler?: (job: ReactiveEffect) => void;
    lazy?: boolean;
  }
): {
  (): T;
  effect: ReactiveEffect;
};

/**
 * 判断是否应该进行依赖追踪
 */
export declare function isTracking(): boolean;

/**
 * 追踪属性的依赖关系
 * @param target 目标对象
 * @param key 属性名
 */
export declare function track(target: object, key: unknown): void;

/**
 * 追踪依赖集合
 * @param dep 依赖集合
 */
export declare function trackEffects(dep: Set<ReactiveEffect>): void;

/**
 * 触发属性的依赖更新
 * @param target 目标对象
 * @param key 属性名
 */
export declare function trigger(target: object, key: unknown): void;

/**
 * 触发依赖集合中的所有副作用函数
 * @param dep 依赖集合
 */
export declare function triggerEffects(dep: Set<ReactiveEffect>): void; 