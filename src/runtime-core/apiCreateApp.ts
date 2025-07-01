/**
 * 应用创建API实现
 */
import { isFunction } from '../shared'
import { createVNode } from './vnode'

/**
 * 应用实例接口
 */
export interface App {
  _component: Record<string, any>
  _container: Element | null
  _props: any
  _context: Record<string, any>
  _instance: any
  mount: (rootContainer: Element | string) => App
  provide: (key: string | symbol, value: any) => App
  component: (name: string, component?: any) => App | any
  directive: (name: string, directive?: any) => App | any
  use: (plugin: any, ...options: any[]) => App
  config: AppConfig
}

/**
 * 应用配置接口
 */
interface AppConfig {
  errorHandler: ((err: any, vm: any, info: string) => void) | null
  warnHandler: ((err: any, vm: any, info: string) => void) | null
  globalProperties: Record<string, any>
}

/**
 * 创建应用API工厂函数
 * @param render 渲染函数
 * @returns 创建应用函数
 */
export function createAppAPI(render: Function) {
  /**
   * 创建应用实例
   * @param rootComponent 根组件
   * @param rootProps 根组件props
   * @returns 应用实例
   */
  return function createApp(rootComponent: any, rootProps = null): App {
    // 应用实例
    const app: App = {
      // 内部属性
      _component: rootComponent,
      _container: null,
      _props: rootProps,
      _context: {},
      _instance: null,
      
      /**
       * 挂载应用
       * @param rootContainer 根容器
       * @returns 应用实例
       */
      mount(rootContainer: Element | string) {
        // 获取根容器元素
        const container = typeof rootContainer === 'string'
          ? document.querySelector(rootContainer)
          : rootContainer
        
        if (!container) {
          console.warn(`容器元素未找到: ${rootContainer}`)
          return this
        }
        
        // 保存容器
        app._container = container
        
        // 创建根组件虚拟节点
        const vnode = createVNode(rootComponent, rootProps)
        
        // 渲染应用
        render(vnode, container)
        
        return this
      },
      
      /**
       * 提供全局属性
       * @param key 属性名
       * @param value 属性值
       * @returns 应用实例
       */
      provide(key: string | symbol, value: any) {
        app._context[key as string] = value
        return this
      },
      
      /**
       * 注册组件
       * @param name 组件名
       * @param component 组件定义
       * @returns 应用实例或组件定义
       */
      component(name: string, component?: any) {
        // 如果没有提供组件，则是获取操作
        if (!component) {
          return app._component[name]
        }
        
        // 注册组件
        app._component[name] = component
        return this
      },
      
      /**
       * 注册指令
       * @param name 指令名
       * @param directive 指令定义
       * @returns 应用实例或指令定义
       */
      directive(name: string, directive?: any) {
        // 简化版，不实现指令功能
        console.warn('directive API在简化版中未实现')
        return this
      },
      
      /**
       * 注册插件
       * @param plugin 插件
       * @param options 插件选项
       * @returns 应用实例
       */
      use(plugin: any, ...options: any[]) {
        // 如果插件有install方法，调用它
        if (isFunction(plugin.install)) {
          plugin.install(app, ...options)
        } 
        // 如果插件本身是函数，直接调用
        else if (isFunction(plugin)) {
          plugin(app, ...options)
        }
        
        return this
      },
      
      /**
       * 配置对象
       */
      config: {
        errorHandler: null,
        warnHandler: null,
        globalProperties: {}
      }
    }
    
    return app
  }
}

// 导出createApp函数，使用默认渲染器
export const createApp = (...args: any[]) => {
  const render = (vnode: any, container: any) => {
    // 这里是一个简单的占位实现，实际上会被runtime-dom中的渲染器替换
    console.warn('请使用runtime-dom提供的createApp');
  };
  return createAppAPI(render)(...args);
} 