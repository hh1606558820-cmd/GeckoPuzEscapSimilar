/**
 * 模块：Rope 颜色池定义 (colorPool)
 * 
 * 职责：
 * - 集中管理 ColorIdx 与颜色名称的映射关系
 * - 提供颜色选项数组，供颜色选择器使用
 * - 后续修改颜色池只需修改此文件即可全局生效
 * 
 * 输入：无
 * 输出：颜色选项数组
 */

/**
 * 颜色选项接口
 */
export interface ColorOption {
  id: number;        // ColorIdx 值（-1, 1~10）
  name: string;      // 颜色名称（中文）
  swatch: string;    // 颜色预览值（hex 颜色值或特殊标识）
  isNoColor?: boolean; // 是否为"无颜色"选项（用于特殊样式）
}

/**
 * Rope 颜色池定义
 * ColorIdx -> 颜色名称映射（枚举固定）
 * 
 * -1 = 无颜色
 * 1 = 橘色
 * 2 = 蓝色
 * 3 = 黄色
 * 4 = 绿色
 * 5 = 黑色
 * 6 = 褐色
 * 7 = 紫色
 * 8 = 粉色
 * 9 = 嫩绿色
 * 10 = 天蓝色
 */
export const COLOR_POOL: ColorOption[] = [
  { id: -1, name: '无颜色', swatch: 'transparent', isNoColor: true },  // 无颜色（使用透明+边框样式）
  { id: 1, name: '橘色', swatch: '#FF9800' },      // 橘色
  { id: 2, name: '蓝色', swatch: '#2196F3' },      // 蓝色
  { id: 3, name: '黄色', swatch: '#FFEB3B' },      // 黄色
  { id: 4, name: '绿色', swatch: '#4CAF50' },      // 绿色
  { id: 5, name: '黑色', swatch: '#212121' },      // 黑色
  { id: 6, name: '褐色', swatch: '#795548' },      // 褐色
  { id: 7, name: '紫色', swatch: '#9C27B0' },      // 紫色
  { id: 8, name: '粉色', swatch: '#E91E63' },      // 粉色
  { id: 9, name: '嫩绿色', swatch: '#8BC34A' },   // 嫩绿色
  { id: 10, name: '天蓝色', swatch: '#03A9F4' },  // 天蓝色
];

/**
 * 根据 ColorIdx 获取颜色选项
 * 
 * @param colorIdx ColorIdx 值
 * @returns 颜色选项，如果不存在则返回默认（id=-1，无颜色）
 */
export function getColorOption(colorIdx: number): ColorOption {
  const option = COLOR_POOL.find((c) => c.id === colorIdx);
  if (option) {
    return option;
  }
  // 如果 ColorIdx 不在 [-1, 1~10]，回退到默认值（无颜色）
  return COLOR_POOL[0]; // id=-1, 无颜色
}

/**
 * 验证 ColorIdx 是否有效
 * 
 * @param colorIdx ColorIdx 值
 * @returns 是否有效（-1 或 1~10）
 */
export function isValidColorIdx(colorIdx: number): boolean {
  return colorIdx === -1 || (colorIdx >= 1 && colorIdx <= 10);
}

/**
 * 获取默认 ColorIdx（新 Rope 使用）
 * 
 * @returns 默认 ColorIdx = -1（无颜色）
 */
export function getDefaultColorIdx(): number {
  return -1; // 无颜色
}

