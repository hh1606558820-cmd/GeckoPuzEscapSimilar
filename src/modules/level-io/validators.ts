/**
 * 模块：关卡校验规则 (validators)
 * 
 * 职责：
 * - 提供关卡数据的校验规则（纯函数）
 * - 返回错误信息数组，便于显示给用户
 * 
 * 输入：
 * - levelData: LevelData - 关卡数据
 * 
 * 输出：
 * - errors: string[] - 错误信息数组（空数组表示通过）
 */

import { LevelData } from '@/types/Level';
import { isAdjacent } from '@/modules/rope-editor/ropeLogic';

/**
 * 校验结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Rule A：所有 Rope 的 ColorIdx 是否在有效范围内
 * 
 * 规则：
 * - ColorIdx 允许为 -1, 1~11（-1=无色，1~11=有颜色）
 * - 如果存在 ColorIdx 越界（<-1 或 >11 或 非数字）：报错 "Rope #N ColorIdx 越界"
 * - ColorIdx=-1 是合法的，不会阻止生成
 * 
 * @param levelData 关卡数据
 * @returns 错误信息数组
 */
export function validateColorIdx(levelData: LevelData): string[] {
  const errors: string[] = [];

  levelData.Rope.forEach((rope, index) => {
    // 检查是否为数字
    if (typeof rope.ColorIdx !== 'number' || isNaN(rope.ColorIdx)) {
      errors.push(`Rope #${index + 1} ColorIdx 无效（必须是数字）`);
      return;
    }
    // 检查是否越界（<-1 或 >11 或 在 -1 和 1 之间）
    if (rope.ColorIdx < -1 || rope.ColorIdx > 11 || (rope.ColorIdx > -1 && rope.ColorIdx < 1)) {
      errors.push(`Rope #${index + 1} ColorIdx 越界（允许范围：-1 或 1~11，当前值：${rope.ColorIdx}）`);
    }
  });

  return errors;
}

/**
 * Rule B：检测关卡内是否存在 Rope 无法连接为一条线的情况
 * 
 * 定义为：该 Rope 的 Index 不是一条连续的上下左右相邻链条（必须可视为一根线）
 * 
 * 规则：
 * - Index.length >= 2（否则报错 "Rope #N 路径长度不足"）
 * - 相邻两格必须上下左右相邻（dx,dy 必须是 (0,±1) 或 (±1,0)）
 * - Index 内不能重复格子
 * - Index 中每个 index 必须在 [0, MapX*MapY-1] 范围内
 * 
 * @param levelData 关卡数据
 * @returns 错误信息数组
 */
export function validateRopePaths(levelData: LevelData): string[] {
  const errors: string[] = [];
  const { MapX, MapY, Rope } = levelData;
  const maxIndex = MapX * MapY - 1;

  Rope.forEach((rope, ropeIndex) => {
    const ropeNum = ropeIndex + 1;
    const { Index } = rope;

    // 检查路径长度
    if (Index.length < 2) {
      errors.push(`Rope #${ropeNum} 路径长度不足（至少需要2个点）`);
      return; // 路径长度不足，不再检查其他规则
    }

    // 检查是否有重复格子
    const uniqueIndices = new Set(Index);
    if (uniqueIndices.size !== Index.length) {
      errors.push(`Rope #${ropeNum} 路径中存在重复格子`);
      return; // 有重复，不再检查其他规则
    }

    // 检查每个 index 是否在有效范围内
    for (let i = 0; i < Index.length; i++) {
      if (Index[i] < 0 || Index[i] > maxIndex) {
        errors.push(`Rope #${ropeNum} 路径中的格子 Index ${Index[i]} 超出范围 [0, ${maxIndex}]`);
        return; // 越界，不再检查其他规则
      }
    }

    // 检查相邻两格是否上下左右相邻
    for (let i = 0; i < Index.length - 1; i++) {
      const fromIndex = Index[i];
      const toIndex = Index[i + 1];

      if (!isAdjacent(fromIndex, toIndex, MapX)) {
        errors.push(`Rope #${ropeNum} 路径中格子 ${fromIndex} 和 ${toIndex} 不相邻（必须上下左右相邻）`);
        return; // 不相邻，不再检查其他规则
      }
    }
  });

  return errors;
}

/**
 * Rule C：检测初始状态下是否存在"全部绳子都不可消"的情况
 * 
 * 判定规则（最终规则，左下角原点，y 向上递增）：
 * - 计算每条 Rope 的"下一格"（使用 H（头部，Index[0]）和 D（头部朝向））：
 *   - D=1 上：H + MapX（y 增大）
 *   - D=2 下：H - MapX（y 减小）
 *   - D=3 右：H + 1（x 增大）
 *   - D=4 左：H - 1（x 减小）
 * - 判定是否被挡：
 *   - 若 nextIndex 越界（<0 或 >= MapX*MapY） => 视为"可消/可动"（不被挡）
 *   - 若 nextIndex 在地图内 => 若 nextIndex 被任意 Rope 的 Index 占用（包括自己身体、也包括其他 Rope） => 被挡
 *   - 否则 => 不被挡
 * - 关卡级判定：
 *   - 如果每一条 Rope 都被挡 => 报错
 *   - 只要存在一条不被挡 => 通过
 * 
 * @param levelData 关卡数据
 * @returns 错误信息数组
 */
export function validateRopeMovability(levelData: LevelData): string[] {
  const errors: string[] = [];
  const { MapX, MapY, Rope } = levelData;
  const maxIndex = MapX * MapY - 1;

  // 预先构建占用集合，包含所有 Rope 的所有 Index
  const occupiedAll = new Set<number>();
  Rope.forEach((rope) => {
    rope.Index.forEach((index) => {
      occupiedAll.add(index);
    });
  });

  // 检查每条 Rope 是否可移动
  const movableRopes: number[] = [];
  const blockedRopes: number[] = [];

  Rope.forEach((rope, ropeIndex) => {
    const ropeNum = ropeIndex + 1;

    // 如果 Rope 路径长度不足 2，无法判断方向，跳过
    if (rope.Index.length < 2) {
      return; // 已在 Rule B 中检查，这里跳过
    }

    // 如果方向 D 无效，跳过
    if (rope.D === 0 || rope.D < 1 || rope.D > 4) {
      return; // 方向无效，无法判断
    }

    // 计算下一格（左下角原点，y 向上递增）
    let nextIndex: number;
    switch (rope.D) {
      case 1: // 上（y 增大）
        nextIndex = rope.H + MapX;
        break;
      case 2: // 下（y 减小）
        nextIndex = rope.H - MapX;
        break;
      case 3: // 右（x 增大）
        nextIndex = rope.H + 1;
        break;
      case 4: // 左（x 减小）
        nextIndex = rope.H - 1;
        break;
      default:
        return; // 无效方向
    }

    // 判定是否被挡
    // 若 nextIndex 越界（<0 或 >= MapX*MapY） => 视为"可消/可动"（不被挡）
    if (nextIndex < 0 || nextIndex > maxIndex) {
      movableRopes.push(ropeNum);
      return;
    }

    // 在地图内：若 nextIndex 被任意 Rope 的 Index 占用 => 被挡
    if (occupiedAll.has(nextIndex)) {
      blockedRopes.push(ropeNum);
      return;
    }

    // 不被阻挡，可移动
    movableRopes.push(ropeNum);
  });

  // 关卡级判定：如果每一条 Rope 都被挡 => 报错
  if (blockedRopes.length > 0 && movableRopes.length === 0 && Rope.length > 0) {
    errors.push('初始状态所有 Rope 均被阻挡，可能全部不可消');
  }

  return errors;
}

/**
 * 执行所有校验规则
 * 
 * @param levelData 关卡数据
 * @returns 校验结果（包含是否通过和所有错误信息）
 */
export function validateLevel(levelData: LevelData): ValidationResult {
  const errors: string[] = [];

  // Rule A：校验颜色
  errors.push(...validateColorIdx(levelData));

  // Rule B：校验路径
  errors.push(...validateRopePaths(levelData));

  // Rule C：校验可移动性（仅在 Rule A 和 Rule B 通过时检查）
  if (errors.length === 0) {
    errors.push(...validateRopeMovability(levelData));
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

