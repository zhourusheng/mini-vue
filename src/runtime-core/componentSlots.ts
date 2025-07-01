/**
 * 组件插槽实现
 */
import { isArray, isFunction, isObject } from '../shared'
import { ShapeFlags } from './shapeFlags'
import { ComponentInternalInstance } from './component'
import { normalizeChildrenToArray } from './vnode'

/**
 * 初始化组件插槽
 * @param instance 组件实例
 * @param children 子节点
 */
export function initSlots(
  instance: ComponentInternalInstance,
  children: any
) {
  // 没有子节点或不是组件，不处理
  if (!children || !(instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN)) {
    instance.slots = {}
    return
  }
  
  // 规范化插槽
  normalizeObjectSlots(children, (instance.slots = {}))
}

/**
 * 将对象形式的插槽标准化
 * @param children 插槽对象
 * @param slots 目标插槽容器
 */
function normalizeObjectSlots(
  children: Record<string, any>,
  slots: Record<string, any>
) {
  // 遍历所有插槽
  for (const slotName in children) {
    const slot = children[slotName]
    
    // 将插槽转换为函数形式，支持作用域插槽
    slots[slotName] = (props: any) => normalizeSlotValue(
      isFunction(slot) ? slot(props) : slot
    )
  }
}

/**
 * 标准化插槽值为数组
 * @param value 插槽内容
 * @returns 标准化后的插槽内容数组
 */
function normalizeSlotValue(value: any): any[] {
  return isArray(value) ? value : [value]
}

/**
 * 渲染插槽
 * @param slots 插槽对象
 * @param name 插槽名称
 * @param props 插槽props
 * @returns 渲染后的插槽内容
 */
export function renderSlot(
  slots: Record<string, any>,
  name: string,
  props = {}
): any[] {
  // 获取具名插槽
  const slot = slots[name]
  
  // 如果插槽不存在，返回空数组
  if (!slot) {
    return []
  }
  
  // 调用插槽函数，传入props
  if (isFunction(slot)) {
    return normalizeChildrenToArray(slot(props))
  }
  
  return normalizeChildrenToArray(slot)
} 