/**
 * AutoTune：根据难度预测自动调参，避免高流失结构
 */

import { LevelData, RopeData } from '@/types/Level';
import { AutoFillConfig } from './autoFillConfig';
import { computeDifficulty, type DifficultyDiagnostics } from '@/modules/difficulty/difficultyScore';
import { checkHardGuards } from './hardGuards';

export interface TuneResult {
  ropes: RopeData[];
  finalConfig: AutoFillConfig;
  score: number;
  diagnostics: DifficultyDiagnostics;
  attempts: number;
  reason?: string;
  guardErrors?: string[];
}

/** UI 用状态：不拼长字符串，严格按 status 分支渲染 */
export type AutoTuneUIState =
  | { status: 'idle' }
  | { status: 'running' }
  | {
      status: 'success';
      score: number;
      targetMin: number;
      targetMax: number;
      attempts: number;
      diagnostics: DifficultyDiagnostics;
      guardErrors?: string[];
    }
  | {
      status: 'fail';
      score?: number;
      targetMin: number;
      targetMax: number;
      attempts: number;
      reason: string;
      diagnostics?: DifficultyDiagnostics;
      guardErrors?: string[];
    };

function failReasonToMessage(reason: string, attempts: number): string {
  if (reason === 'AutoTune exceeded max attempts') {
    return `AutoTune 未收敛：已尝试 ${attempts} 次，未达到目标区间`;
  }
  return reason;
}

/** 从 TuneResult 转为 AutoTuneUIState（success / fail） */
export function tuneResultToUIState(r: TuneResult): AutoTuneUIState {
  const targetMin = r.finalConfig.targetScoreMin ?? 25;
  const targetMax = r.finalConfig.targetScoreMax ?? 60;
  if (r.reason) {
    return {
      status: 'fail',
      score: r.score,
      targetMin,
      targetMax,
      attempts: r.attempts,
      reason: failReasonToMessage(r.reason, r.attempts),
      diagnostics: r.diagnostics,
      guardErrors: r.guardErrors,
    };
  }
  return {
    status: 'success',
    score: r.score,
    targetMin,
    targetMax,
    attempts: r.attempts,
    diagnostics: r.diagnostics,
    guardErrors: r.guardErrors,
  };
}

function adjustConfig(
  cfg: AutoFillConfig,
  dir: 'easier' | 'harder',
  _reason: string
): AutoFillConfig {
  const next = { ...cfg };
  const minK = next.kMin ?? 0;
  const maxK = next.kMax ?? 3;
  const minLen = next.minLen ?? 2;
  const maxLen = next.maxLen ?? 25;

  if (dir === 'easier') {
    next.kMax = Math.max(minK, maxK - 1);
    next.maxLen = Math.max(minLen, maxLen - 2);
    if (next.maxRopes != null && next.maxRopes > 0) {
      next.maxRopes = Math.max(1, next.maxRopes - 1);
      if (next.minRopes != null && next.maxRopes < next.minRopes) {
        next.minRopes = next.maxRopes;
      }
    }
  } else {
    next.kMax = Math.min(maxK + 1, 15);
    next.maxLen = Math.min(maxLen + 2, 80);
    if (next.maxRopes != null) {
      next.maxRopes = next.maxRopes + 1;
      if (next.minRopes != null && next.maxRopes < next.minRopes) {
        next.minRopes = next.maxRopes;
      }
    }
  }

  if (next.kMax < next.kMin) next.kMin = next.kMax;
  if (next.maxLen < next.minLen) next.minLen = next.maxLen;
  return next;
}

export function autoTuneGenerate(
  levelBase: LevelData,
  config: AutoFillConfig,
  generateOnce: (cfg: AutoFillConfig) => RopeData[]
): TuneResult {
  const targetMin = config.targetScoreMin ?? 25;
  const targetMax = config.targetScoreMax ?? 60;
  const maxAttempts = config.maxTuneAttempts ?? 25;
  const hardGuardsOn = config.hardGuardsEnabled ?? true;

  let cfg: AutoFillConfig = { ...config };
  let lastRopes: RopeData[] = [];
  let lastDiag: DifficultyDiagnostics | null = null;
  let lastGuardErrors: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ropes = generateOnce(cfg);
    const level: LevelData = { ...levelBase, Rope: ropes };

    if (ropes.length === 0) {
      cfg = adjustConfig(cfg, 'easier', 'no ropes');
      continue;
    }

    const diag = computeDifficulty(level);
    lastRopes = ropes;
    lastDiag = diag;
    const score = diag.DifficultyScore;

    if (hardGuardsOn) {
      const guardErrors = checkHardGuards(level);
      lastGuardErrors = guardErrors;
      if (guardErrors.length > 0) {
        cfg = adjustConfig(cfg, 'easier', guardErrors[0]);
        continue;
      }
    }

    if (score >= targetMin && score <= targetMax) {
      return {
        ropes,
        finalConfig: cfg,
        score,
        diagnostics: diag,
        attempts: attempt,
      };
    }

    if (score > targetMax) {
      cfg = adjustConfig(cfg, 'easier', 'score too high');
    } else {
      cfg = adjustConfig(cfg, 'harder', 'score too low');
    }
  }

  return {
    ropes: lastRopes,
    finalConfig: cfg,
    score: lastDiag?.DifficultyScore ?? 0,
    diagnostics: lastDiag ?? computeDifficulty({ ...levelBase, Rope: lastRopes }),
    attempts: maxAttempts,
    reason: 'AutoTune exceeded max attempts',
    guardErrors: lastGuardErrors.length > 0 ? lastGuardErrors : undefined,
  };
}
