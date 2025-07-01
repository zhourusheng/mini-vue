/**
 * 虚拟节点形状标志
 * 使用位运算进行节点类型的快速判断
 */
export enum ShapeFlags {
  // 节点类型
  ELEMENT = 1 << 0,               // 0000 0001 元素节点
  FUNCTIONAL_COMPONENT = 1 << 1,  // 0000 0010 函数式组件
  STATEFUL_COMPONENT = 1 << 2,    // 0000 0100 有状态组件
  
  // 子节点类型
  TEXT_CHILDREN = 1 << 3,         // 0000 1000 文本子节点
  ARRAY_CHILDREN = 1 << 4,        // 0001 0000 数组子节点
  SLOTS_CHILDREN = 1 << 5,        // 0010 0000 插槽子节点
  
  // 组件类型的快捷方式
  COMPONENT = STATEFUL_COMPONENT | FUNCTIONAL_COMPONENT // 0000 0110
} 