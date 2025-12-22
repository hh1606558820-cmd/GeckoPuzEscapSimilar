/**
 * 模块：Rope 命中检测 (ropeHitTest)
 * 
 * 职责：
 * - 根据点击的格子 index 判断命中哪条 Rope（纯函数）
 * - 处理多 Rope 命中的情况（一个格子属于多条 Rope）
 * 
 * 输入：
 * - cellIndex: number - 被点击的格子 index
 * - ropes: RopeData[] - 所有 Rope 数据
 * 
 * 输出：
 * - 命中的 Rope 索引（number），如果没有命中则返回 null
 */

import { RopeData } from '@/types/Level';

/**
 * 检测点击的格子命中了哪条 Rope
 * 
 * 规则：
 * 1. 遍历所有 Rope，检查 rope.Index 是否包含 cellIndex
 * 2. 如果一个格子同时属于多条 Rope：
 *    - 优先选中"Index 中包含该格子且长度最短的 Rope"（更贴近用户直觉）
 *    - 如果长度相同，则选中第一个命中的 Rope
 * 
 * @param cellIndex 被点击的格子 index
 * @param ropes 所有 Rope 数据数组
 * @returns 命中的 Rope 索引（从 0 开始），如果没有命中则返回 null
 */
export function hitTestRope(
  cellIndex: number,
  ropes: RopeData[]
): number | null {
  // 收集所有命中的 Rope（索引和长度）
  const hitRopes: Array<{ index: number; length: number }> = [];

  for (let i = 0; i < ropes.length; i++) {
    const rope = ropes[i];
    // 检查该 Rope 的 Index 数组是否包含这个格子
    if (rope.Index.includes(cellIndex)) {
      hitRopes.push({
        index: i,
        length: rope.Index.length,
      });
    }
  }

  // 如果没有命中任何 Rope，返回 null
  if (hitRopes.length === 0) {
    return null;
  }

  // 如果只命中一条 Rope，直接返回
  if (hitRopes.length === 1) {
    return hitRopes[0].index;
  }

  // 如果命中多条 Rope，选择长度最短的（更贴近用户直觉）
  // 如果长度相同，选择第一个
  hitRopes.sort((a, b) => {
    if (a.length !== b.length) {
      return a.length - b.length; // 按长度升序
    }
    return a.index - b.index; // 长度相同时按索引升序
  });

  return hitRopes[0].index;
}

