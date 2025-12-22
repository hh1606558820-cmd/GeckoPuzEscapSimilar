/**
 * 模块：Rope 数据变更 (ropeMutations)
 * 
 * 职责：
 * - 更新 Rope 属性的纯函数
 * - 删除 Rope 的纯函数
 * - 确保数据不可变性
 * 
 * 输入：
 * - ropes: RopeData[] - 当前 Rope 数组
 * - ropeIndex: number - 要操作的 Rope 索引
 * - 更新参数（ColorIdx 等）
 * 
 * 输出：
 * - 更新后的 Rope 数组（新数组，不修改原数组）
 */

import { RopeData } from '@/types/Level';

/**
 * 更新 Rope 的 ColorIdx
 * 
 * @param ropes 当前 Rope 数组
 * @param ropeIndex 要更新的 Rope 索引
 * @param colorIdx 新的 ColorIdx 值
 * @returns 更新后的 Rope 数组（新数组）
 */
export function updateRopeColorIdx(
  ropes: RopeData[],
  ropeIndex: number,
  colorIdx: number
): RopeData[] {
  if (ropeIndex < 0 || ropeIndex >= ropes.length) {
    return ropes; // 索引无效，返回原数组
  }

  // 创建新数组，只更新指定的 Rope
  return ropes.map((rope, index) => {
    if (index === ropeIndex) {
      return {
        ...rope,
        ColorIdx: colorIdx,
      };
    }
    return rope;
  });
}

/**
 * 删除指定的 Rope
 * 
 * @param ropes 当前 Rope 数组
 * @param ropeIndex 要删除的 Rope 索引
 * @returns 更新后的 Rope 数组（新数组，已移除指定 Rope）
 */
export function deleteRope(
  ropes: RopeData[],
  ropeIndex: number
): RopeData[] {
  if (ropeIndex < 0 || ropeIndex >= ropes.length) {
    return ropes; // 索引无效，返回原数组
  }

  // 使用 filter 创建新数组，排除指定索引的 Rope
  return ropes.filter((_, index) => index !== ropeIndex);
}

/**
 * 批量更新 Rope 的多个属性
 * 
 * @param ropes 当前 Rope 数组
 * @param ropeIndex 要更新的 Rope 索引
 * @param updates 要更新的属性（部分 RopeData）
 * @returns 更新后的 Rope 数组（新数组）
 */
export function updateRopeProperties(
  ropes: RopeData[],
  ropeIndex: number,
  updates: Partial<RopeData>
): RopeData[] {
  if (ropeIndex < 0 || ropeIndex >= ropes.length) {
    return ropes; // 索引无效，返回原数组
  }

  // 创建新数组，合并更新
  return ropes.map((rope, index) => {
    if (index === ropeIndex) {
      return {
        ...rope,
        ...updates,
      };
    }
    return rope;
  });
}

