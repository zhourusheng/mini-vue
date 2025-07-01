/**
 * 组件事件触发机制实现
 */
import { camelize, capitalize, toHandlerKey } from '../shared'
import { ComponentInternalInstance } from './component'

/**
 * 组件事件触发函数
 * @param instance 组件实例
 * @param event 事件名称
 * @param args 事件参数
 */
export function emit(
  instance: ComponentInternalInstance,
  event: string,
  ...args: any[]
) {
  // 获取组件实例的props
  const props = instance.props
  
  if (!props) {
    return
  }

  // 处理事件名，支持不同格式：
  // 1. 原始事件名如 'click'
  // 2. 驼峰命名如 'onClick'
  // 3. 连字符形式如 'click-outside' 转换为驼峰的 'onClickOutside'
  
  // 转换事件名为处理函数名格式
  let handler = props[toHandlerKey(event)]
  
  // 如果没找到，尝试驼峰化名称 'click-outside' -> 'clickOutside'
  if (!handler) {
    handler = props[toHandlerKey(camelize(event))]
  }

  // 调用事件处理函数
  if (handler) {
    handler(...args)
  } else {
    // 开发环境可以添加警告
    // console.warn(`事件 ${event} 没有对应的处理函数`)
  }
} 