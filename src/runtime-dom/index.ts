/**
 * DOM平台特定的运行时代码
 */
import { createRenderer as _createRenderer } from '../runtime-core/renderer'
import { isString, isFunction, isObject } from '../shared'

// 重新导出createRenderer
export { createRenderer } from '../runtime-core/renderer'

/**
 * DOM节点操作
 */

/**
 * 创建DOM元素
 * @param type 元素类型
 * @returns DOM元素
 */
function createElement(type: string): Element {
  return document.createElement(type)
}

/**
 * 设置DOM元素文本内容
 * @param node DOM节点
 * @param text 文本内容
 */
function setElementText(node: Element, text: string): void {
  node.textContent = text
}

/**
 * 向指定父节点中添加子节点
 * @param parent 父节点
 * @param child 子节点
 * @param anchor 插入位置的参考节点
 */
function insertElement(
  parent: Element,
  child: Element,
  anchor: Element | null = null
): void {
  parent.insertBefore(child, anchor)
}

/**
 * 移除DOM节点
 * @param child 要移除的子节点
 */
function removeElement(child: Element): void {
  const parent = child.parentNode
  if (parent) {
    parent.removeChild(child)
  }
}

/**
 * 创建文本节点
 * @param text 文本内容
 * @returns 文本节点
 */
function createText(text: string): Text {
  return document.createTextNode(text)
}

/**
 * 设置文本节点内容
 * @param node 文本节点
 * @param text 文本内容
 */
function setText(node: Text, text: string): void {
  node.nodeValue = text
}

/**
 * 添加事件监听
 * @param el DOM元素
 * @param event 事件名
 * @param handler 事件处理函数
 */
function addEventHandler(
  el: Element,
  event: string,
  handler: Function,
  options?: any
): void {
  el.addEventListener(event, handler as any, options)
}

/**
 * 移除事件监听
 * @param el DOM元素
 * @param event 事件名
 * @param handler 事件处理函数
 */
function removeEventHandler(
  el: Element,
  event: string,
  handler: Function,
  options?: any
): void {
  el.removeEventListener(event, handler as any, options)
}

/**
 * 修补DOM属性操作
 * @param el DOM元素
 * @param key 属性名
 * @param prevValue 旧值
 * @param nextValue 新值
 */
function patchProp(
  el: Element,
  key: string,
  prevValue: any,
  nextValue: any
): void {
  if (key === 'class') {
    // 处理class属性
    el.className = nextValue || ''
  } else if (key === 'style') {
    // 处理style属性
    if (nextValue && isObject(nextValue)) {
      for (const styleName in nextValue) {
        (el as HTMLElement).style[styleName as any] = nextValue[styleName]
      }
      
      // 移除不再存在的样式
      if (prevValue && isObject(prevValue)) {
        for (const styleName in prevValue) {
          if (!(nextValue && styleName in nextValue)) {
            (el as HTMLElement).style[styleName as any] = ''
          }
        }
      }
    } else {
      // 字符串形式
      (el as HTMLElement).style.cssText = nextValue || ''
    }
  } else if (key.startsWith('on')) {
    // 处理事件
    const eventName = key.slice(2).toLowerCase()
    
    // 移除旧的事件监听
    if (prevValue) {
      removeEventHandler(el, eventName, prevValue)
    }
    
    // 添加新的事件监听
    if (nextValue) {
      addEventHandler(el, eventName, nextValue)
    }
  } else if (key !== 'key') {
    // 处理普通属性
    if (nextValue === null || nextValue === undefined) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, nextValue)
    }
  }
}

/**
 * 创建应用实例
 * @returns 应用实例
 */
export function createApp(rootComponent: any, rootProps: any = null) {
  // 使用DOM渲染器创建应用
  const app = renderer.createApp(rootComponent, rootProps)
  
  // 保存原始的mount方法
  const { mount } = app
  
  // 重写mount方法，添加DOM特定的逻辑
  app.mount = function(containerOrSelector: Element | string): any {
    // 获取容器元素
    const container = typeof containerOrSelector === 'string'
      ? document.querySelector(containerOrSelector)
      : containerOrSelector
    
    if (!container) {
      console.warn(`容器元素未找到: ${containerOrSelector}`)
      return this
    }
    
    // 清空容器内容
    container.innerHTML = ''
    
    // 调用原始mount方法
    return mount(container)
  }
  
  return app
}

// 创建渲染器
const renderer = _createRenderer({
  createElement,
  setElementText,
  insertElement,
  removeElement,
  createText,
  setText,
  patchProp
})

// 导出DOM渲染器
export { renderer, createElement, setElementText, insertElement, removeElement, patchProp }

// 导出render函数
export const render = renderer.render 