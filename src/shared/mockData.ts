/**
 * 共享工具模块 - Mock 数据
 * 
 * 职责：提供默认的测试数据，用于开发和调试
 * 
 * 输入：无
 * 输出：默认的 Level 数据对象
 */

import { Level, TileType } from '@/types/Level';

/**
 * 创建默认的空关卡
 * @param id 关卡ID
 * @param width 宽度
 * @param height 高度
 */
export function createEmptyLevel(
  id: string = 'level_001',
  width: number = 10,
  height: number = 10
): Level {
  const tiles: Level['tiles'] = [];
  
  for (let y = 0; y < height; y++) {
    const row: Level['tiles'][0] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        type: TileType.EMPTY,
        x,
        y,
      });
    }
    tiles.push(row);
  }
  
  return {
    id,
    name: `关卡 ${id}`,
    width,
    height,
    tiles,
  };
}

/**
 * 默认关卡数据
 */
export const defaultLevel = createEmptyLevel();

