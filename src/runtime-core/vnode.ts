/**
 * 虚拟DOM节点实现
 */
import { isArray, isFunction, isObject, isString } from '../shared'
import { ShapeFlags } from './shapeFlags'

/**
 * 虚拟节点类型常量
 */
export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
export const Comment = Symbol('Comment')

/**
 * VNode类型
 */
export interface VNode {
  /**
   * 节点类型
   */
  type: any
  /**
   * 节点属性
   */
  props: Record<string, any> | null
  /**
   * 子节点
   */
  children: any
  /**
   * 组件实例
   */
  component: any
  /**
   * DOM元素
   */
  el: Element | null
  /**
   * key属性
   */
  key: string | number | null
  /**
   * 节点形状标志
   */
  shapeFlag: number
  /**
   * 文本内容
   */
  textContent: string | null
  /**
   * 插槽
   */
  slots: Record<string, any>
  /**
   * 父组件提供的属性
   */
  parentProps: Record<string, any> | null
}

/**
 * 创建虚拟节点
 * @param type 节点类型
 * @param props 节点属性
 * @param children 子节点
 * @returns 虚拟节点
 */
export function createVNode(
  type: any,
  props: Record<string, any> | null = null,
  children: any = null
): VNode {
  // 设置shapeFlag，用于快速判断节点类型
  let shapeFlag = 0
  if (isString(type)) {
    // 元素节点
    shapeFlag = ShapeFlags.ELEMENT
  } else if (isFunction(type)) {
    // 函数式组件
    shapeFlag = ShapeFlags.FUNCTIONAL_COMPONENT
  } else if (isObject(type)) {
    // 有状态组件
    shapeFlag = ShapeFlags.STATEFUL_COMPONENT
  }

  // 创建VNode结构
  const vnode: VNode = {
    type,
    props,
    children,
    component: null,
    el: null,
    key: props?.key ?? null,
    shapeFlag,
    textContent: null,
    slots: {},
    parentProps: null
  }

  // 处理子节点类型的标识
  if (children) {
    // 子节点可以是文本或数组或对象(插槽)
    if (isString(children) || typeof children === 'number') {
      // 如果子节点是字符串或数字，则为文本子节点
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
      vnode.textContent = children + ''
    } else if (isArray(children)) {
      // 如果子节点是数组，则为元素子节点
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    } else if (isObject(children)) {
      // 如果子节点是对象，则可能是插槽对象
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN
      vnode.slots = children
    }
  }

  return vnode
}

/**
 * 判断是否为同一VNode
 * @param n1 第一个VNode
 * @param n2 第二个VNode
 * @returns 是否相同
 */
export function isSameVNodeType(n1: VNode, n2: VNode): boolean {
  return n1.type === n2.type && n1.key === n2.key
}

/**
 * 创建文本VNode
 * @param text 文本内容
 * @returns 文本VNode
 */
export function createTextVNode(text: string): VNode {
  return createVNode(Text, null, text)
}

/**
 * 创建注释VNode
 * @param text 注释内容
 * @returns 注释VNode
 */
export function createCommentVNode(text: string): VNode {
  return createVNode(Comment, null, text)
}

/**
 * 规范化子VNode
 * @param children 子节点
 * @returns 规范化后的子节点
 */
export function normalizeChildren(children: any): any {
  if (isArray(children)) {
    return children
  } else if (isString(children) || typeof children === 'number') {
    return createTextVNode(children + '')
  } else {
    return children
  }
}

/**
 * 将children规范化为数组
 * @param children 子节点
 * @returns 子节点数组
 */
export function normalizeChildrenToArray(children: any): any[] {
  if (isArray(children)) {
    return children
  } else if (children == null) {
    return []
  } else {
    return [children]
  }
} 