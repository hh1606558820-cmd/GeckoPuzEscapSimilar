/**
 * 模块：自动填充 Rope 生成逻辑 (autoFillRopes)
 * 
 * 职责：
 * - 根据构型格（maskIndices）自动生成 Rope 路径
 * - 使用生长式随机走算法（方式 A）
 * - 确保不生成回头 Rope（禁止 U-turn）
 * - 确保不生成头转弯 Rope（D 与 Index[0]->Index[1] 一致）
 * 
 * 输入：
 * - MapX, MapY: 地图尺寸
 * - maskIndices: 构型格集合（需要覆盖的格子）
 * - config: 配置选项（可选）
 * 
 * 输出：
 * - RopeData[]: 生成的 Rope 数组
 */

import { RopeData } from '@/types/Level';
import { calculateDirection, Direction, calculateD, calculateH, calculateBendCount } from '@/modules/rope-editor/ropeLogic';
import { indexToXY, xyToIndex } from '@/modules/rope-visualizer/geometry';
import { AutoFillConfig, DEFAULT_AUTO_FILL_CONFIG } from './autoFillConfig';

/**
 * Mulberry32 伪随机数生成器（用于 seed 复现）
 */
class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/**
 * 获取方向的反方向
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
 * 获取相邻格子（上下左右）
 */
function getAdjacentIndices(index: number, MapX: number, MapY: number): number[] {
  const { x, y } = indexToXY(index, MapX);
  const adjacent: number[] = [];
  
  // 上（y+1）
  if (y + 1 < MapY) {
    adjacent.push(xyToIndex(x, y + 1, MapX));
  }
  // 下（y-1）
  if (y - 1 >= 0) {
    adjacent.push(xyToIndex(x, y - 1, MapX));
  }
  // 右（x+1）
  if (x + 1 < MapX) {
    adjacent.push(xyToIndex(x + 1, y, MapX));
  }
  // 左（x-1）
  if (x - 1 >= 0) {
    adjacent.push(xyToIndex(x - 1, y, MapX));
  }
  
  return adjacent;
}

/**
 * 检查路径是否形成 2x2 绕圈
 */
function has2x2Loop(path: number[], MapX: number): boolean {
  if (path.length < 4) return false;
  
  // 检查是否有 4 个点形成 2x2 正方形
  for (let i = 0; i < path.length - 3; i++) {
    const indices = [path[i], path[i + 1], path[i + 2], path[i + 3]];
    const coords = indices.map(idx => indexToXY(idx, MapX));
    
    // 检查是否形成 2x2 正方形
    const xs = coords.map(c => c.x);
    const ys = coords.map(c => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    if (maxX - minX === 1 && maxY - minY === 1 && 
        xs.filter(x => x === minX).length === 2 &&
        xs.filter(x => x === maxX).length === 2 &&
        ys.filter(y => y === minY).length === 2 &&
        ys.filter(y => y === maxY).length === 2) {
      return true;
    }
  }
  
  return false;
}

/**
 * 验证 Rope 是否有效（检查回头和头转弯）
 */
function validateRope(path: number[], MapX: number, config: AutoFillConfig): boolean {
  if (path.length < 2) return false;
  
  // 检查回头（U-turn）：相邻两步不能立即反向
  if (config.forbidUturn) {
    for (let i = 1; i < path.length; i++) {
      const prevDir = calculateDirection(path[i - 1], path[i], MapX);
      if (i + 1 < path.length) {
        const nextDir = calculateDirection(path[i], path[i + 1], MapX);
        if (nextDir === oppositeDirection(prevDir)) {
          return false; // 发现回头
        }
      }
    }
  }
  
  // 检查头转弯：D 必须与 Index[0]->Index[1] 的方向一致
  if (config.forbidHeadTurn && path.length >= 2) {
    const firstSegmentDir = calculateDirection(path[0], path[1], MapX);
    if (firstSegmentDir === Direction.Invalid) {
      return false;
    }
    
    // 计算 D（头部朝向，与第一段移动方向相反）
    const expectedD = oppositeDirection(firstSegmentDir);
    const actualD = calculateD(path, MapX);
    
    // D 必须一致
    if (actualD !== expectedD) {
      return false; // 头转弯
    }
    
    // 额外检查：确保第一段方向稳定（Index[0] 周围没有其他路径点）
    // 如果 Index[0] 的相邻格中有其他路径点（除了 Index[1]），可能是头转弯
    const headAdjacent = getAdjacentIndices(path[0], MapX, 1000); // MapY 用大值，只检查相邻
    for (let i = 2; i < path.length; i++) {
      if (headAdjacent.includes(path[i])) {
        return false; // 头转弯：Index[0] 周围有其他路径点
      }
    }
  }
  
  // 检查 2x2 绕圈
  if (config.forbid2x2Loop && has2x2Loop(path, MapX)) {
    return false;
  }
  
  return true;
}

/**
 * 生成单个 Rope 路径（生长式随机走）
 */
function generateSingleRope(
  availableIndices: Set<number>,
  MapX: number,
  MapY: number,
  config: AutoFillConfig,
  random: () => number
): number[] | null {
  if (availableIndices.size === 0) return null;
  
  // 从可用格子中随机选择起点
  const availableArray = Array.from(availableIndices);
  let startIndex = availableArray[Math.floor(random() * availableArray.length)];
  
  const path: number[] = [startIndex];
  const usedIndices = new Set<number>([startIndex]);
  let prevDir: Direction | null = null;
  let headDir: Direction | null = null; // 第一段方向（锁定后不允许改变）
  
  const maxAttempts = config.maxLen * 10; // 最大尝试次数
  let attempts = 0;
  
  while (path.length < config.maxLen && attempts < maxAttempts) {
    attempts++;
    
    const currentIndex = path[path.length - 1];
    const adjacent = getAdjacentIndices(currentIndex, MapX, MapY);
    
    // 过滤候选方向
    const candidates = adjacent.filter(nextIndex => {
      // 不能是已使用的格子
      if (usedIndices.has(nextIndex)) return false;
      
      // 必须在可用格子集合中
      if (!availableIndices.has(nextIndex)) return false;
      
      // 如果已确定第一段方向，检查是否会破坏头部方向
      if (path.length === 1 && headDir === null) {
        // 第一段：记录方向
        const dir = calculateDirection(currentIndex, nextIndex, MapX);
        if (dir !== Direction.Invalid) {
          headDir = dir;
          return true;
        }
        return false;
      }
      
        // 如果已确定第一段方向，不允许在 Index[0] 周围添加其他点
      if (path.length >= 2 && headDir !== null) {
        const headAdjacent = getAdjacentIndices(path[0], MapX, MapY);
        if (headAdjacent.includes(nextIndex) && nextIndex !== path[1]) {
          return false; // 禁止在头部周围添加其他点
        }
      }
      
      // 禁止回头（U-turn）
      if (config.forbidUturn && prevDir !== null) {
        const nextDir = calculateDirection(currentIndex, nextIndex, MapX);
        if (nextDir === oppositeDirection(prevDir)) {
          return false; // 回头
        }
      }
      
      return true;
    });
    
    if (candidates.length === 0) {
      // 没有可用的候选方向，结束路径
      break;
    }
    
    // 随机选择下一个格子
    const nextIndex = candidates[Math.floor(random() * candidates.length)];
    const nextDir = calculateDirection(currentIndex, nextIndex, MapX);
    
    path.push(nextIndex);
    usedIndices.add(nextIndex);
    prevDir = nextDir;
    
    // 如果路径长度达到最小值，可以提前结束（随机决定）
    if (path.length >= config.minLen && random() < 0.3) {
      break;
    }
  }
  
  // 检查路径长度
  if (path.length < config.minLen) {
    return null;
  }
  
  // 验证路径（检查回头和头转弯）
  if (!validateRope(path, MapX, config)) {
    return null;
  }
  
  return path;
}

/**
 * 自动填充 Rope 生成主函数
 */
export function autoFillRopes(params: {
  MapX: number;
  MapY: number;
  maskIndices: number[];
  config?: AutoFillConfig;
}): RopeData[] {
  const { MapX, MapY, maskIndices, config = {} } = params;
  
  // 合并配置
  const finalConfig: AutoFillConfig = {
    ...DEFAULT_AUTO_FILL_CONFIG,
    ...config,
  };
  
  // 初始化随机数生成器（支持 seed）
  const seededRandom = finalConfig.seed !== null && finalConfig.seed !== undefined
    ? new SeededRandom(finalConfig.seed)
    : null;
  const random = seededRandom
    ? () => seededRandom.next()
    : Math.random;
  
  // 检查输入
  if (MapX === 0 || MapY === 0) {
    return [];
  }
  
  // 兜底逻辑：如果 mask 为空，使用全图
  const total = MapX * MapY;
  const fillableIndices =
    maskIndices && maskIndices.length > 0
      ? maskIndices
      : Array.from({ length: total }, (_, i) => i);
  
  if (fillableIndices.length === 0) {
    return [];
  }
  
  // 创建可用格子集合
  const availableIndices = new Set(fillableIndices);
  
  // 生成 Rope 列表
  const ropes: RopeData[] = [];
  
  // 性能保护：如果 mask 为空（全图模式），且用户没配 maxRopes，给一个保守默认上限
  const isFullMapMode = !maskIndices || maskIndices.length === 0;
  const inferredMaxRopes = finalConfig.maxRopes ?? (isFullMapMode ? Math.ceil((MapX * MapY) / 20) : 100);
  const maxRopes = inferredMaxRopes; // 最大 Rope 数量（防止无限循环）
  const maxAttemptsPerRope = 50; // 每个 Rope 的最大尝试次数
  
  let totalAttempts = 0;
  
  while (availableIndices.size > 0 && ropes.length < maxRopes && totalAttempts < maxAttemptsPerRope * maxRopes) {
    totalAttempts++;
    
    // 生成单个 Rope
    const path = generateSingleRope(availableIndices, MapX, MapY, finalConfig, random);
    
    if (!path) {
      // 生成失败，尝试减少可用格子或结束
      if (totalAttempts > maxAttemptsPerRope * 10) {
        break; // 多次失败后结束
      }
      continue;
    }
    
    // 创建 RopeData
    const rope: RopeData = {
      D: calculateD(path, MapX),
      H: calculateH(path),
      Index: [...path],
      BendCount: calculateBendCount(path, MapX),
      ColorIdx: -1, // 默认无颜色
    };
    
    // 最终验证：确保 D 与 Index[0]->Index[1] 一致（防止头转弯）
    if (finalConfig.forbidHeadTurn && path.length >= 2) {
      const firstSegmentDir = calculateDirection(path[0], path[1], MapX);
      if (firstSegmentDir === Direction.Invalid) {
        continue; // 第一段方向无效，跳过
      }
      const expectedD = oppositeDirection(firstSegmentDir);
      if (rope.D !== expectedD) {
        // D 不一致，跳过这个 Rope（头转弯）
        continue;
      }
      
      // 额外检查：确保 Index[0] 的相邻格中只有 Index[1]，没有其他路径点
      const headAdjacent = getAdjacentIndices(path[0], MapX, MapY);
      for (let i = 2; i < path.length; i++) {
        if (headAdjacent.includes(path[i])) {
          // 发现头转弯：Index[0] 周围有其他路径点
          continue; // 跳过这个 Rope
        }
      }
    }
    
    ropes.push(rope);
    
    // 从可用格子中移除已使用的格子
    path.forEach(index => {
      availableIndices.delete(index);
    });
    
    // 如果覆盖目标完成，可以提前结束
    if (finalConfig.targetCoverage === 'A' && availableIndices.size === 0) {
      break;
    }
  }
  
  return ropes;
}
