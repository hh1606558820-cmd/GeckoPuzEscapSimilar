/**
 * 模块：不规则 Rope 自动填充核心算法 (autoFill)
 * 
 * 职责：
 * - 根据构型（shapeMask）自动生成多条不规则 Rope
 * - 实现生长式随机走算法
 * - 禁止回头、禁止 2x2 绕圈
 * - 校验至少一条可消
 * 
 * 输入：
 * - shapeMask: Set<number> - 可用格子集合（构型）
 * - 配置参数（minLen, maxLen, Kmin, Kmax, turnChance, corridorBias等）
 * 
 * 输出：
 * - 生成的 RopeData[] 数组
 */

import { RopeData } from '@/types/Level';
import { indexToXY, xyToIndex } from '@/modules/rope-visualizer/geometry';
import { calculateDirection, Direction } from '@/modules/rope-editor/ropeLogic';
import { calculateRopeFields } from '@/modules/rope-editor/ropeLogic';

/**
 * 自动填充配置参数
 */
export interface AutoFillConfig {
  minLen: number;          // 最小长度（默认 2）
  maxLen: number;          // 最大长度（默认 25）
  Kmin: number;            // 最小拐弯次数
  Kmax: number;            // 最大拐弯次数
  turnChance: number;      // 转弯概率（0~1，默认 0.35）
  corridorBias: number;    // 直走偏好（0~1，默认 0.6）
  overwriteExisting: boolean; // 是否覆盖现有 Rope（默认 false）
}

/**
 * 自动填充结果
 */
export interface AutoFillResult {
  ropes: RopeData[];
  warnings: string[];
  errors: string[];
}

/**
 * 获取格子的邻居（上下左右）
 */
function getNeighbors(index: number, MapX: number, MapY: number): number[] {
  const { x, y } = indexToXY(index, MapX);
  const neighbors: number[] = [];
  
  // 上（y+1）
  if (y + 1 < MapY) {
    neighbors.push(xyToIndex(x, y + 1, MapX));
  }
  // 下（y-1）
  if (y - 1 >= 0) {
    neighbors.push(xyToIndex(x, y - 1, MapX));
  }
  // 右（x+1）
  if (x + 1 < MapX) {
    neighbors.push(xyToIndex(x + 1, y, MapX));
  }
  // 左（x-1）
  if (x - 1 >= 0) {
    neighbors.push(xyToIndex(x - 1, y, MapX));
  }
  
  return neighbors;
}

/**
 * 检查是否形成 2x2 绕圈
 * 当尝试加入 next 时，检查 next 与 current 形成的 2x2 方块四个角是否都会被占用
 */
function no2x2Loop(
  current: number,
  next: number,
  path: number[],
  occupied: Set<number>,
  MapX: number,
  MapY: number
): boolean {
  const currentPos = indexToXY(current, MapX);
  const nextPos = indexToXY(next, MapX);
  
  // 计算 2x2 方块的四个角
  const dx = nextPos.x - currentPos.x;
  const dy = nextPos.y - currentPos.y;
  
  // 如果 current 和 next 不相邻，不可能形成 2x2
  if (Math.abs(dx) + Math.abs(dy) !== 1) {
    return true;
  }
  
  // 计算 2x2 方块的四个角
  // 假设 current 和 next 是相邻的，找到包含它们的 2x2 方块
  const corners: number[] = [];
  
  // 情况1：水平相邻（dx = ±1, dy = 0）
  if (dy === 0) {
    const minY = Math.min(currentPos.y, nextPos.y);
    // 检查上方和下方的 2x2 方块
    if (minY + 1 < MapY) {
      corners.push(xyToIndex(currentPos.x, minY + 1, MapX));
      corners.push(xyToIndex(nextPos.x, minY + 1, MapX));
    }
    if (minY - 1 >= 0) {
      corners.push(xyToIndex(currentPos.x, minY - 1, MapX));
      corners.push(xyToIndex(nextPos.x, minY - 1, MapX));
    }
  }
  // 情况2：垂直相邻（dx = 0, dy = ±1）
  else if (dx === 0) {
    const minX = Math.min(currentPos.x, nextPos.x);
    // 检查左侧和右侧的 2x2 方块
    if (minX + 1 < MapX) {
      corners.push(xyToIndex(minX + 1, currentPos.y, MapX));
      corners.push(xyToIndex(minX + 1, nextPos.y, MapX));
    }
    if (minX - 1 >= 0) {
      corners.push(xyToIndex(minX - 1, currentPos.y, MapX));
      corners.push(xyToIndex(minX - 1, nextPos.y, MapX));
    }
  }
  
  // 检查四个角是否都被占用（包括 path 和 occupied）
  const allOccupied = new Set([...path, ...occupied]);
  const occupiedCorners = corners.filter(corner => allOccupied.has(corner));
  
  // 如果四个角都被占用，则形成 2x2 绕圈，拒绝
  if (corners.length === 4 && occupiedCorners.length === 4) {
    return false;
  }
  
  return true;
}

/**
 * 检查至少一条 Rope 可消
 * 使用 validateRopeMovability 的逻辑
 */
function checkAtLeastOneMovable(ropes: RopeData[], MapX: number, MapY: number): boolean {
  if (ropes.length === 0) {
    return false;
  }
  
  const maxIndex = MapX * MapY - 1;
  
  // 构建占用集合
  const occupiedAll = new Set<number>();
  ropes.forEach((rope) => {
    rope.Index.forEach((index) => {
      occupiedAll.add(index);
    });
  });
  
  // 检查每条 Rope 是否可移动
  for (const rope of ropes) {
    if (rope.Index.length < 2 || rope.D === 0 || rope.D < 1 || rope.D > 4) {
      continue;
    }
    
    // 计算下一格
    let nextIndex: number;
    switch (rope.D) {
      case 1: // 上
        nextIndex = rope.H + MapX;
        break;
      case 2: // 下
        nextIndex = rope.H - MapX;
        break;
      case 3: // 右
        nextIndex = rope.H + 1;
        break;
      case 4: // 左
        nextIndex = rope.H - 1;
        break;
      default:
        continue;
    }
    
    // 若 nextIndex 越界 => 可消
    if (nextIndex < 0 || nextIndex > maxIndex) {
      return true;
    }
    
    // 若 nextIndex 未被占用 => 可消
    if (!occupiedAll.has(nextIndex)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 计算最终朝向 D（最后两格的方向）
 * D = 最后一段移动方向（Index[last-1] -> Index[last]）
 */
function calculateFinalDirection(path: number[], MapX: number): number {
  if (path.length < 2) {
    return 0; // 无效
  }
  const lastIndex = path.length - 1;
  const dir = calculateDirection(path[lastIndex - 1], path[lastIndex], MapX);
  return dir === Direction.Invalid ? 0 : dir;
}

/**
 * 反转 Rope 的 Index 并重新计算 D/H/BendCount
 */
function reverseRope(rope: RopeData, MapX: number): RopeData {
  const reversedIndex = [...rope.Index].reverse();
  // 重新计算所有字段
  const reversedRope = calculateRopeFields(reversedIndex, MapX, { ColorIdx: rope.ColorIdx });
  // 但 D 应该是最终朝向（最后两格的方向），而不是第一段的反方向
  // 所以需要重新计算 D
  reversedRope.D = calculateFinalDirection(reversedIndex, MapX);
  return reversedRope;
}

/**
 * 尝试修复"至少一条可消"问题
 * 通过反转若干 Rope 的 Index
 */
function tryFixMovability(
  ropes: RopeData[],
  MapX: number,
  MapY: number,
  maxAttempts: number = 10
): { ropes: RopeData[]; fixed: boolean } {
  if (checkAtLeastOneMovable(ropes, MapX, MapY)) {
    return { ropes, fixed: true };
  }
  
  // 尝试反转若干 Rope
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const newRopes = [...ropes];
    // 随机选择一些 Rope 进行反转
    const indicesToReverse = new Set<number>();
    const numToReverse = Math.min(Math.ceil(newRopes.length / 2), 5);
    while (indicesToReverse.size < numToReverse) {
      indicesToReverse.add(Math.floor(Math.random() * newRopes.length));
    }
    
    // 反转选中的 Rope
    indicesToReverse.forEach((i) => {
      newRopes[i] = reverseRope(newRopes[i], MapX);
    });
    
    if (checkAtLeastOneMovable(newRopes, MapX, MapY)) {
      return { ropes: newRopes, fixed: true };
    }
  }
  
  return { ropes, fixed: false };
}

/**
 * 自动填充主函数
 */
export function autoFillIrregular(
  shapeMask: Set<number>,
  existingRopes: RopeData[],
  MapX: number,
  MapY: number,
  config: AutoFillConfig
): AutoFillResult {
  const result: AutoFillResult = {
    ropes: [],
    warnings: [],
    errors: [],
  };
  
  // 如果 MapX 或 MapY 为 0，无法生成
  if (MapX === 0 || MapY === 0) {
    result.errors.push('地图尺寸为 0，无法生成 Rope');
    return result;
  }
  
  // 如果 shapeMask 为空，无法生成
  if (shapeMask.size === 0) {
    result.errors.push('构型为空，无法生成 Rope');
    return result;
  }
  
  // 获取可用格子集合
  const availableCells = new Set(shapeMask);
  
  // 如果覆盖现有 Rope，先清空
  let occupied = new Set<number>();
  if (!config.overwriteExisting) {
    // 收集现有 Rope 占用的格子
    existingRopes.forEach((rope) => {
      rope.Index.forEach((index) => {
        occupied.add(index);
      });
    });
  }
  
  // 未使用的格子 = 可用格子 - 已占用
  const unusedCells = new Set<number>();
  availableCells.forEach((cell) => {
    if (!occupied.has(cell)) {
      unusedCells.add(cell);
    }
  });
  
  if (unusedCells.size === 0) {
    result.warnings.push('没有可用的格子用于生成 Rope');
    return result;
  }
  
  // 失败起点集合（避免重复尝试）
  const failedStarts = new Set<number>();
  
  // 最大尝试次数
  const maxAttempts = unusedCells.size * 10;
  let attempts = 0;
  
  // 生长式随机走
  while (unusedCells.size > 0 && attempts < maxAttempts) {
    attempts++;
    
    // 选择起点：优先选择"可走邻居最少"的格子（减少碎片）
    let start: number | null = null;
    let minNeighbors = Infinity;
    
    for (const cell of unusedCells) {
      if (failedStarts.has(cell)) {
        continue;
      }
      
      const neighbors = getNeighbors(cell, MapX, MapY);
      const availableNeighbors = neighbors.filter(
        (n) => availableCells.has(n) && !occupied.has(n) && n !== cell
      );
      
      if (availableNeighbors.length < minNeighbors) {
        minNeighbors = availableNeighbors.length;
        start = cell;
      }
    }
    
    // 如果找不到起点，随机选择一个
    if (start === null) {
      const cellsArray = Array.from(unusedCells);
      if (cellsArray.length === 0) break;
      start = cellsArray[Math.floor(Math.random() * cellsArray.length)];
    }
    
    // 目标拐弯次数
    const Ktarget = Math.floor(Math.random() * (config.Kmax - config.Kmin + 1)) + config.Kmin;
    
    // 开始生长
    const path: number[] = [start];
    let current = start;
    let currentDir: Direction | null = null;
    let turns = 0;
    
    // 临时占用（用于路径生成过程中的检查）
    const tempOccupied = new Set(occupied);
    tempOccupied.add(start);
    
    while (path.length < config.maxLen) {
      // 获取当前格子的邻居
      const neighbors = getNeighbors(current, MapX, MapY);
      
      // 筛选候选：在 shape 内、未被占用、不是上一格、通过 no2x2Loop 检查
      const candidates: number[] = [];
      for (const neighbor of neighbors) {
        // 在 shape 内
        if (!availableCells.has(neighbor)) continue;
        // 未被占用
        if (tempOccupied.has(neighbor)) continue;
        // 不是上一格（禁止回头）
        if (path.length > 0 && neighbor === path[path.length - 1]) continue;
        // 通过 no2x2Loop 检查
        if (!no2x2Loop(current, neighbor, path, tempOccupied, MapX, MapY)) continue;
        
        candidates.push(neighbor);
      }
      
      // 如果没有候选，结束生长
      if (candidates.length === 0) {
        break;
      }
      
      // 给候选打分
      const scores: Array<{ candidate: number; score: number }> = [];
      for (const candidate of candidates) {
        let score = 1.0; // 基础分数
        
        // 计算方向
        const dir = calculateDirection(current, candidate, MapX);
        
        // 若与 currentDir 同方向 => +corridorBias
        if (currentDir !== null && dir === currentDir) {
          score += config.corridorBias;
        }
        
        // 若为转弯且 turns < Ktarget => +turnChance
        if (currentDir !== null && dir !== currentDir) {
          if (turns < Ktarget) {
            score += config.turnChance;
          } else {
            // 若为转弯但 turns >= Ktarget => 禁止
            score = 0;
          }
        }
        
        if (score > 0) {
          scores.push({ candidate, score });
        }
      }
      
      // 如果没有有效候选，结束生长
      if (scores.length === 0) {
        break;
      }
      
      // 按权重随机选择
      const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
      let random = Math.random() * totalScore;
      let next: number | null = null;
      
      for (const { candidate, score } of scores) {
        random -= score;
        if (random <= 0) {
          next = candidate;
          break;
        }
      }
      
      if (next === null) {
        next = scores[0].candidate;
      }
      
      // 更新状态
      const nextDir = calculateDirection(current, next, MapX);
      if (currentDir !== null && nextDir !== currentDir) {
        turns++;
      }
      currentDir = nextDir;
      path.push(next);
      tempOccupied.add(next);
      current = next;
    }
    
    // 检查路径长度
    if (path.length < config.minLen) {
      // 回滚占用并将 start 标记为"失败起点"
      failedStarts.add(start);
      continue;
    }
    
    // 生成 Rope
    const rope = calculateRopeFields(path, MapX, { ColorIdx: -1 });
    // 修正 D：应该是最终朝向（最后两格的方向），而不是第一段的反方向
    rope.D = calculateFinalDirection(path, MapX);
    result.ropes.push(rope);
    
    // 占用 path 中格子，从 unusedCells 移除
    path.forEach((index) => {
      occupied.add(index);
      unusedCells.delete(index);
    });
  }
  
  // 如果覆盖现有 Rope，替换；否则追加
  if (config.overwriteExisting) {
    result.ropes = result.ropes;
  } else {
    result.ropes = [...existingRopes, ...result.ropes];
  }
  
  // 校验至少一条可消
  const movabilityCheck = tryFixMovability(result.ropes, MapX, MapY);
  if (!movabilityCheck.fixed) {
    result.warnings.push('生成后没有可消的 Rope，但已尝试修复。若仍不满足，请手动调整。');
  }
  result.ropes = movabilityCheck.ropes;
  
  // 计算覆盖率
  const totalShapeCells = shapeMask.size;
  const coveredCells = new Set<number>();
  result.ropes.forEach((rope) => {
    rope.Index.forEach((index) => {
      if (shapeMask.has(index)) {
        coveredCells.add(index);
      }
    });
  });
  const coverage = (coveredCells.size / totalShapeCells) * 100;
  result.warnings.push(`覆盖率: ${coverage.toFixed(1)}% (${coveredCells.size}/${totalShapeCells})`);
  
  return result;
}

