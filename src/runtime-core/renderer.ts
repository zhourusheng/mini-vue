/**
 * 渲染器实现
 * 负责将虚拟DOM渲染成真实DOM
 */
import { EMPTY_OBJ, isArray, isObject, isString } from '../shared'
import { createComponentInstance, setupComponent, ComponentInternalInstance } from './component'
import { updateProps } from './componentProps'
import { effect } from '../reactivity'
import { ShapeFlags } from './shapeFlags'
import { createVNode, Fragment, isSameVNodeType, Text, VNode, Comment } from './vnode'
import { callLifecycleHooks, LifecycleHooks } from './apiLifecycle'
import { createAppAPI } from './apiCreateApp'

/**
 * 渲染函数
 * @param vnode 虚拟节点
 * @param container 容器
 */
export function render(vnode: VNode | null, container: any) {
  // 这里是一个简单的占位实现，实际会被具体渲染器的render函数替换
  console.warn('请使用具体渲染器的render函数');
}

// 当前活跃的渲染器实例
export let activeRenderer: any = null

// 微任务队列
const queue: Function[] = []
// 是否有待处理的刷新微任务
let pending = false
// Promise.resolve()
const p = Promise.resolve()

/**
 * 将一个任务推入微任务队列
 * @param fn 要执行的任务
 */
export function queueJob(fn: Function) {
  // 如果任务不在队列中，添加它
  if (!queue.includes(fn)) {
    queue.push(fn)
    
    // 如果没有等待的刷新，触发一次
    if (!pending) {
      pending = true
      
      // 在下一个微任务中执行队列
      p.then(() => {
        pending = false
        const tasks = [...queue]
        queue.length = 0
        
        // 执行所有排队的任务
        tasks.forEach(task => task())
      })
    }
  }
}

/**
 * 在下一个DOM更新周期执行回调
 * @param fn 要执行的回调函数
 */
export function nextTick(fn?: () => void): Promise<void> {
  const p = Promise.resolve()
  return fn ? p.then(fn) : p
}

/**
 * 渲染器选项接口
 */
export interface RendererOptions {
  /**
   * 创建DOM元素
   */
  createElement: (type: string) => any
  /**
   * 设置DOM元素的文本内容
   */
  setElementText: (el: any, text: string) => void
  /**
   * 插入DOM元素
   */
  insertElement: (parent: any, child: any, anchor?: any) => void
  /**
   * 移除DOM元素
   */
  removeElement: (el: any) => void
  /**
   * 创建文本节点
   */
  createText: (text: string) => any
  /**
   * 设置文本内容
   */
  setText: (node: any, text: string) => void
  /**
   * 处理DOM属性
   */
  patchProp: (el: any, key: string, prevValue: any, nextValue: any) => void
}

/**
 * 创建渲染器
 * @param options 平台特定的渲染选项
 * @returns 渲染器
 */
export function createRenderer(options: RendererOptions) {
  const {
    createElement,
    setElementText,
    insertElement,
    removeElement,
    createText,
    setText,
    patchProp
  } = options
  
  /**
   * 挂载组件
   * @param initialVNode 组件虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件
   */
  function mountComponent(
    initialVNode: VNode,
    container: any,
    anchor: any,
    parentComponent: ComponentInternalInstance | null
  ) {
    // 创建组件实例
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ))
    
    // 设置组件实例
    setupComponent(instance)
    
    // 设置并运行带有副作用的渲染函数
    setupRenderEffect(instance, initialVNode, container, anchor)
  }
  
  /**
   * 设置组件渲染函数的副作用
   * @param instance 组件实例
   * @param initialVNode 虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   */
  function setupRenderEffect(
    instance: ComponentInternalInstance,
    initialVNode: VNode,
    container: any,
    anchor: any
  ) {
    // 组件更新函数
    function componentUpdateFn() {
      if (!instance.isMounted) {
        // 挂载前生命周期钩子
        callLifecycleHooks(instance, LifecycleHooks.BEFORE_MOUNT)
        
        // 渲染组件
        const subTree = (instance.subTree = instance.render!.call(
          instance.proxy,
          instance.proxy
        ))
        
        // 递归地渲染组件树
        patch(null, subTree, container, anchor, instance)
        
        // 保存对应的DOM元素
        initialVNode.el = subTree.el
        
        // 设置为已挂载
        instance.isMounted = true
        
        // 挂载后生命周期钩子
        callLifecycleHooks(instance, LifecycleHooks.MOUNTED)
      } else {
        // 更新组件
        
        // 更新前生命周期钩子
        callLifecycleHooks(instance, LifecycleHooks.BEFORE_UPDATE)
        
        // 如果有要更新的props
        if (instance.next) {
          const { next, vnode } = instance
          
          // 更新组件实例的虚拟节点
          instance.vnode = next
          instance.next = null
          
          // 更新props
          updateProps(instance, next.props)
        }
        
        // 渲染新的组件树
        const nextTree = instance.render!.call(instance.proxy, instance.proxy)
        const prevTree = instance.subTree
        
        // 更新子树引用
        instance.subTree = nextTree
        
        // 对比新旧树并更新DOM
        patch(prevTree, nextTree, container, anchor, instance)
        
        // 更新后生命周期钩子
        callLifecycleHooks(instance, LifecycleHooks.UPDATED)
      }
    }
    
    // 使用effect包装组件的渲染函数，创建响应式依赖
    const effect_ = (instance.update = effect(componentUpdateFn, {
      scheduler: () => queueJob(effect_)
    }))
  }
  
  /**
   * 更新组件
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   */
  function updateComponent(n1: VNode, n2: VNode) {
    // 获取组件实例
    const instance = (n2.component = n1.component)
    
    // 保存要更新的虚拟节点
    instance!.next = n2
    
    // 触发更新
    instance!.update!()
  }
  
  /**
   * 处理元素
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件
   */
  function processElement(
    n1: VNode | null,
    n2: VNode,
    container: any,
    anchor: any,
    parentComponent: ComponentInternalInstance | null
  ) {
    if (n1 === null) {
      // 挂载元素
      mountElement(n2, container, anchor, parentComponent)
    } else {
      // 更新元素
      patchElement(n1, n2, parentComponent)
    }
  }
  
  /**
   * 挂载元素
   * @param vnode 虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件
   */
  function mountElement(
    vnode: VNode,
    container: any,
    anchor: any,
    parentComponent: ComponentInternalInstance | null
  ) {
    const { type, props, children, shapeFlag } = vnode
    
    // 创建元素
    const el = (vnode.el = createElement(type as string))
    
    // 设置属性
    if (props) {
      for (const key in props) {
        patchProp(el, key, null, props[key])
      }
    }
    
    // 处理子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本子节点
      setElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 数组子节点
      mountChildren(children, el, null, parentComponent)
    }
    
    // 插入到容器
    insertElement(container, el, anchor)
  }
  
  /**
   * 挂载子节点
   * @param children 子节点数组
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件
   */
  function mountChildren(
    children: any[],
    container: any,
    anchor: any,
    parentComponent: ComponentInternalInstance | null
  ) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      patch(null, child, container, anchor, parentComponent)
    }
  }
  
  /**
   * 更新元素
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param parentComponent 父组件
   */
  function patchElement(
    n1: VNode,
    n2: VNode,
    parentComponent: ComponentInternalInstance | null
  ) {
    // 复用DOM元素
    const el = (n2.el = n1.el)
    
    // 获取新旧属性
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    
    // 更新子节点
    patchChildren(n1, n2, el, null, parentComponent)
    
    // 更新属性
    patchProps(el, n2, oldProps, newProps)
  }
  
  /**
   * 更新子节点
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件
   */
  function patchChildren(
    n1: VNode,
    n2: VNode,
    container: any,
    anchor: any,
    parentComponent: ComponentInternalInstance | null
  ) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1
    const { shapeFlag, children: c2 } = n2
    
    // 新子节点是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果旧子节点是数组，卸载它们
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1)
      }
      
      // 如果新旧文本不同，设置文本内容
      if (c1 !== c2) {
        setElementText(container, c2 as string)
      }
    } 
    // 新子节点是数组
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 旧子节点也是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 进行子节点的DIFF算法
        patchKeyedChildren(c1, c2, container, anchor, parentComponent)
      }
      // 旧子节点是文本或无子节点
      else {
        // 清空容器
        setElementText(container, '')
        // 挂载新子节点
        mountChildren(c2, container, anchor, parentComponent)
      }
    }
    // 新子节点为空
    else {
      // 旧子节点是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1)
      }
      // 旧子节点是文本
      else if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        setElementText(container, '')
      }
      // 如果都为空，无需操作
    }
  }
  
  /**
   * 卸载子节点
   * @param children 子节点数组
   */
  function unmountChildren(children: any[]) {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }
  
  /**
   * 使用DIFF算法比较子节点列表
   * @param c1 旧子节点数组
   * @param c2 新子节点数组
   * @param container 容器
   * @param parentAnchor 父锚点元素
   * @param parentComponent 父组件
   */
  function patchKeyedChildren(
    c1: any[],
    c2: any[],
    container: any,
    parentAnchor: any,
    parentComponent: ComponentInternalInstance | null
  ) {
    // 简化版DIFF算法：从头开始比较，相同则patch，不同则创建新的，旧的卸载
    // 注：完整版还应该包含从尾部比较、处理中间乱序等逻辑
    
    let i = 0
    const l2 = c2.length
    const l1 = c1.length
    
    // 从头部开始比较，直到找到不同的节点
    while (i < l1 && i < l2) {
      const n1 = c1[i]
      const n2 = c2[i]
      
      if (isSameVNodeType(n1, n2)) {
        // 相同类型节点，递归patch
        patch(n1, n2, container, parentAnchor, parentComponent)
      } else {
        // 不同类型，停止比较
        break
      }
      i++
    }
    
    // 旧子节点已遍历完，剩余的新子节点直接添加
    if (i >= l1) {
      if (i < l2) {
        const nextPos = i + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor
        // 挂载剩余新节点
        for (let j = i; j < l2; j++) {
          patch(null, c2[j], container, anchor, parentComponent)
        }
      }
    }
    // 新子节点已遍历完，卸载剩余的旧子节点
    else if (i >= l2) {
      // 卸载剩余旧节点
      for (let j = i; j < l1; j++) {
        unmount(c1[j])
      }
    }
    // 新旧子节点都有剩余，采用key比较
    else {
      const s1 = i
      const s2 = i
      
      // 新子节点中待处理的数量
      const toBePatched = l2 - s2
      // 已处理的数量
      let patched = 0
      
      // 为新子节点创建key到索引的映射
      const keyToNewIndexMap = new Map()
      for (let i = s2; i < l2; i++) {
        const child = c2[i]
        if (child.key != null) {
          keyToNewIndexMap.set(child.key, i)
        }
      }
      
      // 遍历剩余旧子节点，尝试复用或卸载
      for (let i = s1; i < l1; i++) {
        const oldChild = c1[i]
        
        // 如果已处理的新节点数量超过了总数，直接卸载旧节点
        if (patched >= toBePatched) {
          unmount(oldChild)
          continue
        }
        
        // 尝试找到与旧节点对应的新节点的索引
        let newIndex
        if (oldChild.key != null) {
          // 有key，直接查找
          newIndex = keyToNewIndexMap.get(oldChild.key)
        } else {
          // 没有key，遍历查找相同类型的节点
          for (let j = s2; j < l2; j++) {
            if (isSameVNodeType(oldChild, c2[j])) {
              newIndex = j
              break
            }
          }
        }
        
        // 没找到对应新节点，卸载旧节点
        if (newIndex === undefined) {
          unmount(oldChild)
        } else {
          // 找到了对应新节点，进行patch
          const newChild = c2[newIndex]
          patch(oldChild, newChild, container, null, parentComponent)
          patched++
          
          // 处理完的新节点设为null，防止重复处理
          c2[newIndex] = null as any
        }
      }
      
      // 插入剩余未处理的新节点
      for (let i = s2; i < l2; i++) {
        const child = c2[i]
        // 跳过已处理的节点
        if (child !== null) {
          const anchor = i + 1 < l2 ? c2[i + 1].el : parentAnchor
          patch(null, child, container, anchor, parentComponent)
        }
      }
    }
  }
  
  /**
   * 更新元素的属性
   * @param el 元素
   * @param vnode 虚拟节点
   * @param oldProps 旧属性
   * @param newProps 新属性
   */
  function patchProps(
    el: any,
    vnode: VNode,
    oldProps: Record<string, any>,
    newProps: Record<string, any>
  ) {
    // 属性不同时才更新
    if (oldProps !== newProps) {
      // 设置新属性或更新属性
      for (const key in newProps) {
        const next = newProps[key]
        const prev = oldProps[key]
        
        if (next !== prev) {
          patchProp(el, key, prev, next)
        }
      }
      
      // 移除不再存在的属性
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            patchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }
  
  /**
   * 处理组件
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件
   */
  function processComponent(
    n1: VNode | null,
    n2: VNode,
    container: any,
    anchor: any,
    parentComponent: ComponentInternalInstance | null
  ) {
    if (n1 === null) {
      // 挂载组件
      mountComponent(n2, container, anchor, parentComponent)
    } else {
      // 更新组件
      updateComponent(n1, n2)
    }
  }
  
  /**
   * 处理文本节点
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   */
  function processText(n1: VNode | null, n2: VNode, container: any) {
    if (n1 === null) {
      // 创建并插入文本节点
      const textNode = (n2.el = createText(n2.children as string))
      insertElement(container, textNode)
    } else {
      // 复用并更新文本节点
      const el = (n2.el = n1.el)
      if (n2.children !== n1.children) {
        setText(el, n2.children as string)
      }
    }
  }
  
  /**
   * 处理Fragment节点
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件
   */
  function processFragment(
    n1: VNode | null,
    n2: VNode,
    container: any,
    anchor: any,
    parentComponent: ComponentInternalInstance | null
  ) {
    // Fragment只处理其子节点
    if (n1 === null) {
      mountChildren(n2.children as any[], container, anchor, parentComponent)
    } else {
      patchChildren(n1, n2, container, anchor, parentComponent)
    }
  }
  
  /**
   * 处理注释节点
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   */
  function processComment(n1: VNode | null, n2: VNode, container: any) {
    // 简化实现：与文本节点类似
    if (n1 === null) {
      // 使用document.createComment而不是直接访问
      const commentNode = (n2.el = createText(n2.children as string))
      insertElement(container, commentNode)
    } else {
      n2.el = n1.el
    }
  }
  
  /**
   * 卸载节点
   * @param vnode 要卸载的虚拟节点
   */
  function unmount(vnode: VNode) {
    if (vnode.type === Fragment) {
      // Fragment节点，卸载其子节点
      unmountChildren(vnode.children as any[])
    } else if (vnode.shapeFlag & ShapeFlags.COMPONENT) {
      // 组件节点
      const instance = vnode.component
      
      // 调用卸载前生命周期钩子
      callLifecycleHooks(instance!, LifecycleHooks.BEFORE_UNMOUNT)
      
      // 卸载子树
      unmount(instance!.subTree!)
      
      // 设置为已卸载状态
      instance!.isUnmounted = true
      
      // 调用卸载后生命周期钩子
      callLifecycleHooks(instance!, LifecycleHooks.UNMOUNTED)
    } else {
      // 普通节点，直接移除
      removeElement(vnode.el)
    }
  }
  
  /**
   * 渲染虚拟节点到容器中
   * @param n1 旧的虚拟节点
   * @param n2 新的虚拟节点
   * @param container 容器
   * @param anchor 锚点元素
   * @param parentComponent 父组件实例
   */
  function patch(
    n1: VNode | null,
    n2: VNode,
    container: any,
    anchor: any = null,
    parentComponent: ComponentInternalInstance | null = null
  ) {
    // 如果新旧节点类型不同，卸载旧节点
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1)
      n1 = null
    }
    
    // 根据节点类型进行不同的处理
    const { type, shapeFlag } = n2
    
    switch (type) {
      case Text:
        // 处理文本节点
        processText(n1, n2, container)
        break
      case Comment:
        // 处理注释节点
        processComment(n1, n2, container)
        break
      case Fragment:
        // 处理Fragment节点
        processFragment(n1, n2, container, anchor, parentComponent)
        break
      default:
        // 处理组件或元素
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 普通DOM元素
          processElement(n1, n2, container, anchor, parentComponent)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 组件
          processComponent(n1, n2, container, anchor, parentComponent)
        }
    }
  }
  
  // 返回渲染器
  return {
    render: function(vnode: VNode | null, container: any) {
      if (vnode === null) {
        // 如果没有新的虚拟节点，但容器中有旧的虚拟节点，卸载它
        if (container._vnode) {
          unmount(container._vnode)
        }
      } else {
        // 否则更新或挂载新的虚拟节点
        patch(container._vnode || null, vnode, container)
      }
      
      // 保存当前虚拟节点为容器的旧节点
      container._vnode = vnode
    },
    createApp: function(rootComponent: any, rootProps: any = null) {
      // 使用createAppAPI创建应用
      const app = createAppAPI(this.render)(rootComponent, rootProps)
      return app
    }
  }
} 