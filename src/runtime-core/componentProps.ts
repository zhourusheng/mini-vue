/**
 * 组件Props处理
 */
import { hasOwn } from '../shared'
import { reactive } from '../reactivity'
import { ComponentInternalInstance } from './component'

/**
 * 初始化组件Props
 * @param instance 组件实例
 * @param rawProps 原始Props对象
 */
export function initProps(
  instance: ComponentInternalInstance,
  rawProps: Record<string, any>
) {
  const props: Record<string, any> = {}
  const attrs: Record<string, any> = {}
  
  const options = instance.type.props || {}

  // 遍历所有原始Props
  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key]
      // 如果是声明的prop则添加到props中，否则添加到attrs中
      if (key in options || key.startsWith('on')) {
        props[key] = value
      } else {
        attrs[key] = value
      }
    }
  }

  // 将props设为响应式，可以是shallowReactive，这里简化为reactive
  instance.props = reactive(props)
  instance.attrs = attrs
}

/**
 * 更新组件Props
 * @param instance 组件实例
 * @param rawProps 新的Props
 */
export function updateProps(
  instance: ComponentInternalInstance,
  rawProps: Record<string, any> | null
) {
  // 获取旧的props和attrs
  const { props: oldProps, attrs: oldAttrs } = instance
  
  if (!rawProps) {
    rawProps = {}
  }
  
  const options = instance.type.props || {}
  
  // 更新或添加新props
  for (const key in rawProps) {
    const value = rawProps[key]
    if (key in options || key.startsWith('on')) {
      // 如果值变化，更新props
      if (oldProps[key] !== value) {
        oldProps[key] = value
      }
    } else if (oldAttrs[key] !== value) {
      // 更新attrs
      oldAttrs[key] = value
    }
  }
  
  // 删除不再存在的props
  for (const key in oldProps) {
    if (!hasOwn(rawProps, key) && !key.startsWith('on')) {
      delete oldProps[key]
    }
  }
  
  // 删除不再存在的attrs
  for (const key in oldAttrs) {
    if (!hasOwn(rawProps, key)) {
      delete oldAttrs[key]
    }
  }
} 