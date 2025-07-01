/**
 * 组件实现
 */
import { reactive, proxyRefs } from '../reactivity'
import { isFunction, isObject, EMPTY_OBJ } from '../shared'
import { ShapeFlags } from './shapeFlags'
import { emit } from './componentEmits'
import { initProps } from './componentProps'
import { initSlots } from './componentSlots'
import { VNode } from './vnode'
import { handleComponentTemplate } from './componentTemplate'

/**
 * 当前正在处理的组件实例
 */
export let currentInstance: ComponentInternalInstance | null = null

/**
 * 设置当前活动的组件实例
 * @param instance 组件实例
 */
export function setCurrentInstance(instance: ComponentInternalInstance | null) {
  currentInstance = instance
}

/**
 * 获取当前组件实例
 * @returns 当前组件实例
 */
export function getCurrentInstance(): ComponentInternalInstance | null {
  return currentInstance
}

/**
 * 组件内部实例类型
 */
export interface ComponentInternalInstance {
  /**
   * 组件的VNode
   */
  vnode: VNode
  /**
   * 组件类型，即组件选项
   */
  type: any
  /**
   * 父组件实例
   */
  parent: ComponentInternalInstance | null
  /**
   * 组件代理，暴露给用户使用
   */
  proxy: any
  /**
   * 是否已挂载
   */
  isMounted: boolean
  /**
   * 组件根元素
   */
  subTree: VNode | null
  /**
   * 更新函数
   */
  update: Function | null
  /**
   * 下一个要渲染的VNode
   */
  next: VNode | null
  /**
   * 效果作用域
   */
  scope: any
  /**
   * 渲染函数
   */
  render: Function | null
  /**
   * 组件的props
   */
  props: Record<string, any>
  /**
   * 组件的emits
   */
  emit: Function
  /**
   * 组件的插槽
   */
  slots: Record<string, any>
  /**
   * 组件的属性
   */
  attrs: Record<string, any>
  /**
   * 组件的状态数据
   */
  data: Record<string, any>
  /**
   * 组件的setup返回值
   */
  setupState: any
  /**
   * 组件的上下文
   */
  ctx: any
  /**
   * 组件的provide对象
   */
  provides: Record<string, any>
  /**
   * 组件的注册的生命周期钩子
   */
  lifeCycles: Record<string, Function[]>
  /**
   * 是否是未挂载的组件
   */
  isUnmounted: boolean
}

/**
 * 创建组件实例
 * @param vnode 组件的VNode
 * @param parent 父组件实例
 * @returns 组件实例
 */
export function createComponentInstance(
  vnode: VNode,
  parent: ComponentInternalInstance | null
): ComponentInternalInstance {
  // 获取组件类型
  const type = vnode.type

  // 创建组件实例对象
  const instance: ComponentInternalInstance = {
    vnode,
    type,
    parent,
    proxy: null,
    isMounted: false,
    subTree: null,
    update: null,
    next: null,
    scope: null,
    render: null,
    props: EMPTY_OBJ,
    emit: null as any, // 先占位，后面会赋值
    slots: {},
    attrs: {},
    data: {},
    setupState: {},
    ctx: {},
    provides: parent ? parent.provides : {},
    lifeCycles: {},
    isUnmounted: false
  }

  // 绑定emit方法到实例
  instance.emit = emit.bind(null, instance)
  
  // 设置上下文对象
  instance.ctx = { _: instance }
  
  return instance
}

/**
 * 准备组件，设置props, slots, setup等
 * @param instance 组件实例
 */
export function setupComponent(instance: ComponentInternalInstance) {
  const { props, children } = instance.vnode

  // 初始化props
  initProps(instance, props || {})
  
  // 初始化slots
  initSlots(instance, children)

  // 处理有状态组件
  setupStatefulComponent(instance)

  // 处理模板
  handleComponentTemplate(instance)
}

/**
 * 设置有状态组件
 * @param instance 组件实例
 */
function setupStatefulComponent(instance: ComponentInternalInstance) {
  const Component = instance.type
  
  // 创建代理，使用户可以直接访问组件的状态
  instance.proxy = new Proxy(instance.ctx, {
    get(target, key: string) {
      const { setupState, props, data } = instance
      
      // 按照setupState > props > data的优先级访问数据
      if (setupState && key in setupState) {
        // 自动解包ref
        const value = setupState[key]
        // 检查是否为ref对象，如果是则返回.value
        if (value && typeof value === 'object' && value.__v_isRef) {
          return value.value
        }
        return value
      } else if (props && key in props) {
        return props[key]
      } else if (data && key in data) {
        return data[key]
      }
      
      // 内部属性
      if (key === '$slots') {
        return instance.slots
      } else if (key === '$props') {
        return instance.props
      } else if (key === '$attrs') {
        return instance.attrs
      } else if (key === '$emit') {
        return instance.emit
      }
      
      return undefined
    }
  })
  
  // 调用setup函数
  const { setup } = Component
  if (setup) {
    // 设置当前实例
    setCurrentInstance(instance)
    
    try {
      // 创建setup上下文
      const setupContext = {
        attrs: instance.attrs,
        slots: instance.slots,
        emit: instance.emit,
        expose: () => {} // 暂时不实现expose功能
      }
      
      // 调用setup函数
      const setupResult = setup(instance.props, setupContext)
      
      // 处理setup返回结果
      handleSetupResult(instance, setupResult)
    } finally {
      // 清除当前实例
      setCurrentInstance(null)
    }
  } else {
    // 无setup函数，直接完成组件设置
    finishComponentSetup(instance)
  }
}

/**
 * 处理setup返回结果
 * @param instance 组件实例
 * @param setupResult setup返回值
 */
function handleSetupResult(
  instance: ComponentInternalInstance,
  setupResult: any
) {
  // setup可以返回函数(render函数)或对象(暴露给模板的数据)
  if (isFunction(setupResult)) {
    // 如果返回函数，作为render函数
    instance.render = setupResult
  } else if (isObject(setupResult)) {
    // 如果返回对象，则暴露给模板
    // 通过proxyRefs包装，使模板中可以省略.value访问ref
    instance.setupState = proxyRefs(setupResult)
  }
  
  finishComponentSetup(instance)
}

/**
 * 完成组件设置
 * @param instance 组件实例
 */
function finishComponentSetup(instance: ComponentInternalInstance) {
  const Component = instance.type
  
  // 如果没有render函数，尝试从组件选项中获取
  if (!instance.render) {
    if (Component.render) {
      instance.render = Component.render
    }
    // 这里本应该有编译模板的逻辑，但简化版先不实现
  }
  
  // 兼容Vue2的选项式API - 简化版暂不完全实现
  if (Component.data) {
    // data必须是函数
    if (isFunction(Component.data)) {
      instance.data = reactive(Component.data.call(instance.proxy))
    }
  }
  
  // 其他Vue2选项如methods, computed等暂不实现
}

/**
 * 定义组件
 * @param options 组件选项
 * @returns 组件定义
 */
export function defineComponent(options: any) {
  return options
} 