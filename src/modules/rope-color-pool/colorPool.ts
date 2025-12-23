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
  id: number;        // ColorIdx 值（-1, 1~11）
  name: string;      // 颜色名称（中文）
  swatch: string;    // 颜色预览值（hex 颜色值或特殊标识）
  isNoColor?: boolean; // 是否为"无色"选项（用于特殊样式）
}

/**
 * Rope 颜色池定义
 * ColorIdx -> 颜色名称映射（枚举固定）
 * 
 * -1 = 无色
 * 1  = 红色   #FF5048
 * 2  = 黄色   #FFE73E
 * 3  = 天蓝   #4AC6FF
 * 4  = 绿色   #80F153
 * 5  = 橙色   #FF9942
 * 6  = 紫色   #B65AFF
 * 7  = 粉色   #FF5AFF
 * 8  = 深蓝   #605EFF
 * 9  = 黑色   #656368
 * 10 = 白色   #FFFFFF
 * 11 = 褐色   #BE8164
 */
export const COLOR_POOL: ColorOption[] = [
  { id: -1, name: '无色', swatch: 'transparent', isNoColor: true },  // 无色（使用透明+边框样式）
  { id: 1, name: '红色', swatch: '#FF5048' },      // 红色
  { id: 2, name: '黄色', swatch: '#FFE73E' },      // 黄色
  { id: 3, name: '天蓝', swatch: '#4AC6FF' },      // 天蓝
  { id: 4, name: '绿色', swatch: '#80F153' },      // 绿色
  { id: 5, name: '橙色', swatch: '#FF9942' },      // 橙色
  { id: 6, name: '紫色', swatch: '#B65AFF' },      // 紫色
  { id: 7, name: '粉色', swatch: '#FF5AFF' },      // 粉色
  { id: 8, name: '深蓝', swatch: '#605EFF' },      // 深蓝
  { id: 9, name: '黑色', swatch: '#656368' },      // 黑色
  { id: 10, name: '白色', swatch: '#FFFFFF' },    // 白色
  { id: 11, name: '褐色', swatch: '#BE8164' },    // 褐色
];

/**
 * 根据 ColorIdx 获取颜色选项
 * 
 * @param colorIdx ColorIdx 值
 * @returns 颜色选项，如果不存在则返回默认（id=-1，无色）
 */
export function getColorOption(colorIdx: number): ColorOption {
  const option = COLOR_POOL.find((c) => c.id === colorIdx);
  if (option) {
    return option;
  }
  // 如果 ColorIdx 不在 [-1, 1~11]，回退到默认值（无色）
  return COLOR_POOL[0]; // id=-1, 无色
}

/**
 * 验证 ColorIdx 是否有效
 * 
 * @param colorIdx ColorIdx 值
 * @returns 是否有效（-1 或 1~11）
 */
export function isValidColorIdx(colorIdx: number): boolean {
  return colorIdx === -1 || (colorIdx >= 1 && colorIdx <= 11);
}

/**
 * 获取默认 ColorIdx（新 Rope 使用）
 * 
 * @returns 默认 ColorIdx = -1（无色）
 */
export function getDefaultColorIdx(): number {
  return -1; // 无色
}

/**
 * 根据 ColorIdx 获取对应的 hex 颜色值
 * 
 * @param colorIdx ColorIdx 值
 * @returns hex 颜色值（如 '#FF5048'），如果 ColorIdx = -1 则返回默认编辑器颜色
 */
export function getColorHexByIdx(colorIdx: number): string {
  const option = getColorOption(colorIdx);
  // 如果 ColorIdx = -1（无色），返回默认编辑器颜色
  if (option.id === -1) {
    return '#999999'; // 默认编辑器颜色（灰色）
  }
  // 返回对应的 hex 颜色值
  return option.swatch;
}

