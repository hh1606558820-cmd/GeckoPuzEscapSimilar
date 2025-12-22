/**
 * 模块：Rope 颜色池统一导出 (index)
 * 
 * 职责：
 * - 统一导出颜色池相关的类型和组件
 * - 方便其他模块导入使用
 */

export { COLOR_POOL, getColorOption, isValidColorIdx, getDefaultColorIdx } from './colorPool';
export type { ColorOption } from './colorPool';
export { RopeColorPicker } from './RopeColorPicker';

