/**
 * 模块：Rope 路径编辑逻辑 (ropeLogic)
 * 
 * 职责：
 * - 封装 Rope 路径的编辑逻辑（追加、撤销）
 * - 校验相邻格子规则
 * - 自动计算 D、H、BendCount 等字段
 * 
 * 输入：
 * - 当前路径、新点击的格子、地图尺寸等
 * 
 * 输出：
 * - 更新后的路径和计算字段
 */

import { RopeData } from '@/types/Level';
import { indexToXY } from '@/modules/rope-visualizer/geometry';

/**
 * 方向枚举（左下角原点，y 向上递增）
 * 1 = 上（dx=0, dy=+1，y 增大）
 * 2 = 下（dx=0, dy=-1，y 减小）
 * 3 = 右（dx=+1, dy=0，x 增大）
 * 4 = 左（dx=-1, dy=0，x 减小）
 */
export enum Direction {
  Up = 1,
  Down = 2,
  Right = 3,
  Left = 4,
  Invalid = 0,
}

/**
 * 计算两个相邻格子之间的方向（基于坐标判断，避免跨行误判）
 * 
 * @param fromIndex 起始格子 index
 * @param toIndex 目标格子 index
 * @param MapX 地图宽度
 * @returns 方向枚举值
 */
export function calculateDirection(
  fromIndex: number,
  toIndex: number,
  MapX: number
): Direction {
  // 使用坐标判断，避免 delta==±1 跨行误判
  const pos1 = indexToXY(fromIndex, MapX);
  const pos2 = indexToXY(toIndex, MapX);
  
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  
  // 方向映射（逻辑坐标，左下角原点，y向上）
  if (dx === 0 && dy === 1) {
    return Direction.Up;      // 上（y 增大）
  } else if (dx === 0 && dy === -1) {
    return Direction.Down;    // 下（y 减小）
  } else if (dx === 1 && dy === 0) {
    return Direction.Right;  // 右（x 增大）
  } else if (dx === -1 && dy === 0) {
    return Direction.Left;   // 左（x 减小）
  }
  
  return Direction.Invalid;
}

/**
 * 检查两个格子是否相邻（上下左右）
 * 
 * @param fromIndex 起始格子 index
 * @param toIndex 目标格子 index
 * @param MapX 地图宽度
 * @returns 是否相邻
 */
export function isAdjacent(
  fromIndex: number,
  toIndex: number,
  MapX: number
): boolean {
  const direction = calculateDirection(fromIndex, toIndex, MapX);
  return direction !== Direction.Invalid;
}

/**
 * 追加路径点
 * 校验相邻规则和重复规则
 * 
 * @param currentPath 当前路径（Index 数组）
 * @param newIndex 新点击的格子 index
 * @param MapX 地图宽度
 * @returns { success: boolean, path: number[], message?: string }
 */
export function appendPathPoint(
  currentPath: number[],
  newIndex: number,
  MapX: number
): { success: boolean; path: number[]; message?: string } {
  // 检查重复规则
  if (currentPath.includes(newIndex)) {
    return {
      success: false,
      path: currentPath,
      message: '不允许重复格子',
    };
  }

  // 如果路径为空，直接添加
  if (currentPath.length === 0) {
    return {
      success: true,
      path: [newIndex],
    };
  }

  // 检查相邻规则
  const lastIndex = currentPath[currentPath.length - 1];
  if (!isAdjacent(lastIndex, newIndex, MapX)) {
    return {
      success: false,
      path: currentPath,
      message: '新格子必须与最后一个格子相邻（上下左右）',
    };
  }

  // 追加新点
  return {
    success: true,
    path: [...currentPath, newIndex],
  };
}

/**
 * 撤销路径点（移除最后一个）
 * 
 * @param currentPath 当前路径（Index 数组）
 * @returns 更新后的路径
 */
export function undoPathPoint(currentPath: number[]): number[] {
  if (currentPath.length === 0) {
    return [];
  }
  return currentPath.slice(0, -1);
}

/**
 * 计算 H（头部）
 * H = Index[0]（最先点击的格子），若 Index 为空则 H = 0
 * 
 * @param path 路径（Index 数组）
 * @returns H 值
 */
export function calculateH(path: number[]): number {
  return path.length > 0 ? path[0] : 0;
}

/**
 * 获取方向的反方向
 * 
 * @param dir 方向枚举值
 * @returns 反方向枚举值
 */
function oppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case Direction.Up:
      return Direction.Down;
    case Direction.Down:
      return Direction.Up;
    case Direction.Right:
      return Direction.Left;
    case Direction.Left:
      return Direction.Right;
    default:
      return Direction.Invalid;
  }
}

/**
 * 计算 D（头部朝向）
 * D 表示 Rope 的头部朝向，与第一段移动方向相反
 * 使用 Index[0] → Index[1] 的方向，然后取反
 * 若 Index.length < 2 或不相邻 → D = 0
 * 
 * @param path 路径（Index 数组）
 * @param MapX 地图宽度
 * @returns D 值（方向枚举）
 */
export function calculateD(path: number[], MapX: number): number {
  if (path.length < 2) {
    return Direction.Invalid;
  }
  // 取第一段：Index[0] -> Index[1] 的移动方向
  const firstSegmentDir = calculateDirection(path[0], path[1], MapX);
  if (firstSegmentDir === Direction.Invalid) {
    return Direction.Invalid;
  }
  // D = 头部朝向 = 第一段移动方向的反方向
  return oppositeDirection(firstSegmentDir);
}

/**
 * 计算 BendCount（拐弯次数）
 * 从 Index[1] → Index[2] 开始判断
 * 每一段计算方向 delta
 * 若当前段方向 ≠ 上一段方向 → BendCount +1
 * 初始直线不算拐弯
 * 
 * @param path 路径（Index 数组）
 * @param MapX 地图宽度
 * @returns 拐弯次数
 */
export function calculateBendCount(path: number[], MapX: number): number {
  if (path.length < 3) {
    return 0; // 至少需要 3 个点才能有拐弯
  }

  let bendCount = 0;
  let lastDirection = calculateDirection(path[0], path[1], MapX);

  // 从第二段开始判断（Index[1] → Index[2]）
  for (let i = 2; i < path.length; i++) {
    const currentDirection = calculateDirection(path[i - 1], path[i], MapX);
    if (currentDirection !== lastDirection) {
      bendCount++;
    }
    lastDirection = currentDirection;
  }

  return bendCount;
}

/**
 * 根据路径自动计算并更新 Rope 的所有字段
 * 
 * @param path 路径（Index 数组）
 * @param MapX 地图宽度
 * @param existingRope 现有的 Rope 数据（保留 ColorIdx）
 * @returns 更新后的完整 RopeData
 */
export function calculateRopeFields(
  path: number[],
  MapX: number,
  existingRope?: Partial<RopeData>
): RopeData {
  return {
    D: calculateD(path, MapX),
    H: calculateH(path),
    Index: [...path],
    BendCount: calculateBendCount(path, MapX),
    ColorIdx: existingRope?.ColorIdx ?? -1,
  };
}

