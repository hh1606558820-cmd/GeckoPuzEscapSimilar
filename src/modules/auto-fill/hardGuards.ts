/**
 * 高流失结构检测（HardGuards）
 * 基于 computeDifficulty 的 diagnostics，不重复计算。
 */

import { LevelData } from '@/types/Level';
import { computeDifficulty } from '@/modules/difficulty/difficultyScore';

const FIRST_BREAK_THRESHOLD = 10;
const KEY_LOCK_THRESHOLD = 10;
const FREE_AHEAD_THRESHOLD = 0.35;

/**
 * 检测关卡是否触犯高流失约束，返回错误信息列表（空则通过）。
 */
export function checkHardGuards(levelData: LevelData): string[] {
  const errors: string[] = [];
  const diag = computeDifficulty(levelData);

  if (levelData.Rope.length === 0) {
    return errors;
  }

  // G1 开局无可动（必杀）
  if (diag.InitialMovableCount < 1) {
    errors.push('高流失：开局无可动 Rope');
  }

  // G2 主线突破过慢（必杀）
  if (diag.FirstBreakSteps > FIRST_BREAK_THRESHOLD) {
    errors.push('高流失：主线突破步数过大');
  }

  // G3 主线锁深过深（必杀）
  if (diag.KeyLockDepth > KEY_LOCK_THRESHOLD) {
    errors.push('高流失：主线锁定链过深');
  }

  // G4 初始可动过少（常见流失）
  if (diag.N <= 30) {
    if (diag.InitialMovableCount < 2) {
      errors.push('高流失：初始可动过少');
    }
  } else {
    if (diag.InitialMovableCount < 1) {
      errors.push('高流失：初始可动过少');
    }
  }

  // G5 分支过多导致“乱”（流失）
  if (diag.FreeAheadRatio > FREE_AHEAD_THRESHOLD) {
    errors.push('高流失：开局分支过多');
  }

  return errors;
}
