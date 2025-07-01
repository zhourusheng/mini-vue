/**
 * 共享工具函数
 */

/**
 * 判断是否为对象类型
 * @param val 需要判断的值
 * @returns 是否为对象
 */
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

/**
 * 判断是否为函数类型
 * @param val 需要判断的值
 * @returns 是否为函数
 */
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'

/**
 * 判断是否为字符串类型
 * @param val 需要判断的值
 * @returns 是否为字符串
 */
export const isString = (val: unknown): val is string =>
  typeof val === 'string'

/**
 * 判断是否为数组类型
 * @param val 需要判断的值
 * @returns 是否为数组
 */
export const isArray = Array.isArray

/**
 * 判断是否为数值类型
 * @param val 需要判断的值
 * @returns 是否为数值
 */
export const isNumber = (val: unknown): val is number =>
  typeof val === 'number'

/**
 * 判断对象是否具有指定的属性
 * @param obj 对象
 * @param key 键名
 * @returns 是否存在该属性
 */
export const hasOwn = (obj: object, key: string | symbol): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key)

/**
 * 空对象，用于各种默认值
 */
export const EMPTY_OBJ: { readonly [key: string]: any } = Object.freeze({})

/**
 * 空数组，用于各种默认值
 */
export const EMPTY_ARR: readonly any[] = Object.freeze([])

/**
 * 空函数，用于各种默认函数值
 */
export const NOOP = () => {}

/**
 * 总是返回false的函数
 */
export const NO = () => false

/**
 * 将连字符格式字符串转换为驼峰格式
 * @param str 连字符字符串，例如 'font-size'
 * @returns 驼峰格式字符串，例如 'fontSize'
 */
export const camelize = (str: string): string => {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

/**
 * 将首字母转换为大写
 * @param str 输入字符串
 * @returns 首字母大写的字符串
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * 为事件名添加on前缀，并将首字母大写
 * @param event 事件名
 * @returns 带on前缀的事件处理函数名
 */
export const toHandlerKey = (event: string): string => {
  return event ? `on${capitalize(event)}` : ``
}

/**
 * 合并对象
 * @param target 目标对象
 * @param sources 源对象列表
 * @returns 合并后的对象
 */
export function extend<T extends object, U extends object>(
  target: T,
  ...sources: U[]
): T & U {
  const result = Object.assign({}, target) as T & U
  sources.forEach(source => {
    Object.keys(source).forEach(key => {
      (result as any)[key] = (source as any)[key]
    })
  })
  return result
} 