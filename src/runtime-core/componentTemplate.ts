/**
 * 组件模板处理模块
 * 支持在组件中使用template选项
 */
import { ComponentInternalInstance } from './component'
import { compileToFunction } from '../compiler'
import { h } from './h'

/**
 * 处理组件模板
 * 如果组件有template选项但没有render函数，则编译模板
 * @param instance 组件实例
 */
export function handleComponentTemplate(instance: ComponentInternalInstance): void {
  const { type: Component } = instance
  
  // 如果已经有render函数，直接使用
  if (Component.render) {
    instance.render = Component.render
    return
  }
  
  // 处理setup返回的template
  if (instance.setupState && instance.setupState.template) {
    try {
      // 编译模板
      const render = compileToFunction(instance.setupState.template, {
        h
      })
      
      // 设置render函数
      instance.render = render
    } catch (error: any) {
      console.error(`模板编译错误: ${error.message}`)
      // 设置一个空的render函数
      instance.render = () => null
    }
    
    return
  }
  
  // 处理组件选项中的template
  if (Component.template) {
    try {
      // 编译模板
      const render = compileToFunction(Component.template, {
        h
      })
      
      // 设置render函数
      instance.render = render
    } catch (error: any) {
      console.error(`模板编译错误: ${error.message}`)
      // 设置一个空的render函数
      instance.render = () => null
    }
    
    return
  }
} 