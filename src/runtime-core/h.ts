/**
 * h函数是createVNode的便捷包装
 * 提供多种重载形式，使创建VNode更加便捷
 */
import { isArray, isObject } from '../shared'
import { createVNode, VNode } from './vnode'

// h('div')
// h('div', { id: 'foo' })
// h('div', { id: 'foo' }, 'hello')
// h('div', { id: 'foo' }, [h('span')])
// h('div', { id: 'foo' }, h('span'))
// h('div', 'hello')
// h('div', [h('span')])
// h(Component, { prop: true }, 'hello')
// h(Component, { prop: true }, [h('span')])

/**
 * 创建虚拟DOM节点的便捷函数
 */
export function h(
  type: any,
  propsOrChildren?: any,
  children?: any
): VNode {
  // 参数数量
  const argLen = arguments.length
  
  // 根据参数数量和类型进行不同的处理
  
  // 只有两个参数: h('div', 'hello') 或 h('div', [h('span')])
  if (argLen === 2) {
    // 如果第二个参数是对象但不是数组，认为是props
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      return createVNode(type, propsOrChildren)
    }
    // 否则第二个参数是children
    else {
      return createVNode(type, null, propsOrChildren)
    }
  }
  
  // 三个参数：第二个是props，第三个是children
  // h('div', {}, 'hello') 或 h('div', {}, [h('span')])
  else if (argLen > 3) {
    // 超过3个参数，将第3个之后的都作为children数组
    children = Array.from(arguments).slice(2)
  }
  // 正好3个参数
  else if (argLen === 3 && isArray(children)) {
    // 第三个参数是数组，直接用作children
    // 无需特殊处理，会在createVNode中正确处理
  }
  
  return createVNode(type, propsOrChildren, children)
} 