/**
 * 模块：自动填充配置管理 (autoFillConfig)
 * 
 * 职责：
 * - 定义自动填充配置的数据结构
 * - 提供配置的加载和保存功能（localStorage）
 * - 提供默认配置
 */

export type CoverageTarget = 'A'; // 先只保留 A，未来扩展再加

/** 关卡类型模板 id */
export type AutoFillPresetId = 'normal' | 'hard' | 'extreme';

/**
 * 自动填充配置接口
 */
export interface AutoFillConfig {
  targetCoverage: CoverageTarget;     // A：尽量覆盖构型格
  minLen: number;                     // 最小长度
  maxLen: number;                     // 最大长度
  kMin: number;                       // 最小拐弯数
  kMax: number;                       // 最大拐弯数
  forbidUturn: boolean;               // 回头：否 => true
  forbidHeadTurn: boolean;            // 头转弯：否 => true
  forbid2x2Loop: boolean;             // 2x2 绕圈：否 => true
  ensureAtLeastOneMovable: boolean;   // 至少一条可消：是 => true
  shapePreference: 'C';               // 形态偏好：C（迷宫走廊+蛇形）
  dDefinition: 'B';                   // D 定义：B
  minRopes?: number | null;            // 最少生成绳子数（空=不限制）
  maxRopes?: number | null;            // 最多生成绳子数（空=不限制）
  seed?: number | null;                // （可选）用于复现，默认 null
  // 留存约束（可选，后验校验用）
  minMovableRopes?: number;           // 首步可动数量阈值
  maxHighBendRatio?: number;          // 高拐弯占比阈值
  highBendThreshold?: number;        // 何为高拐弯（默认 3/4/6）
  maxAvgBend?: number;               // 平均拐弯上限
  minMainRopeLen?: number;            // 主线最小长度（困难/超困难用）
  maxColors?: number;                 // 颜色数上限（普通关用）
}

/**
 * 存储结构：localStorage 中带 presetId
 */
export type StoredAutoFillConfig = AutoFillConfig & { presetId?: AutoFillPresetId };

/**
 * 三套预设（普通/困难/超困难）
 */
export const AUTO_FILL_PRESETS: Record<AutoFillPresetId, { name: string; config: Partial<AutoFillConfig> }> = {
  normal: {
    name: '普通关（4-30）',
    config: {
      targetCoverage: 'A',
      minLen: 2,
      maxLen: 14,
      kMin: 0,
      kMax: 2,
      forbidUturn: true,
      forbidHeadTurn: true,
      forbid2x2Loop: true,
      ensureAtLeastOneMovable: true,
      shapePreference: 'C',
      dDefinition: 'B',
      minMovableRopes: 2,
      highBendThreshold: 3,
      maxHighBendRatio: 0.15,
      maxAvgBend: 1.5,
      maxColors: 4,
    },
  },
  hard: {
    name: '困难关（31-60）',
    config: {
      targetCoverage: 'A',
      minLen: 3,
      maxLen: 20,
      kMin: 1,
      kMax: 4,
      forbidUturn: true,
      forbidHeadTurn: true,
      forbid2x2Loop: true,
      ensureAtLeastOneMovable: true,
      shapePreference: 'C',
      dDefinition: 'B',
      minMovableRopes: 2,
      highBendThreshold: 4,
      maxHighBendRatio: 0.30,
      maxAvgBend: 2.5,
      minMainRopeLen: 15,
    },
  },
  extreme: {
    name: '超困难关（60+）',
    config: {
      targetCoverage: 'A',
      minLen: 4,
      maxLen: 25,
      kMin: 2,
      kMax: 7,
      forbidUturn: true,
      forbidHeadTurn: true,
      forbid2x2Loop: true,
      ensureAtLeastOneMovable: true,
      shapePreference: 'C',
      dDefinition: 'B',
      minMovableRopes: 1,
      highBendThreshold: 6,
      maxHighBendRatio: 0.35,
      maxAvgBend: 3.5,
      minMainRopeLen: 18,
    },
  },
};

export const DEFAULT_PRESET_ID: AutoFillPresetId = 'normal';

/**
 * 默认配置
 */
export const DEFAULT_AUTO_FILL_CONFIG: AutoFillConfig = {
  targetCoverage: 'A',
  minLen: 2,
  maxLen: 25,
  kMin: 0,
  kMax: 3,
  forbidUturn: true,
  forbidHeadTurn: true,
  forbid2x2Loop: true,
  ensureAtLeastOneMovable: true,
  shapePreference: 'C',
  dDefinition: 'B',
  minRopes: null,
  maxRopes: null,
  seed: null,
};

/**
 * localStorage 键名
 */
const STORAGE_KEY = 'level_editor_auto_fill_config_v1';

/**
 * 加载自动填充配置
 * 从 localStorage 读取，如果不存在或格式错误则返回默认配置（含 presetId）
 */
export function loadAutoFillConfig(): StoredAutoFillConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_AUTO_FILL_CONFIG, presetId: DEFAULT_PRESET_ID };
    }

    const parsed = JSON.parse(stored);
    const validPresetIds: AutoFillPresetId[] = ['normal', 'hard', 'extreme'];
    const presetId = validPresetIds.includes(parsed.presetId) ? parsed.presetId : DEFAULT_PRESET_ID;

    // 验证并合并配置（确保所有必需字段都存在）
    return {
      ...DEFAULT_AUTO_FILL_CONFIG,
      ...parsed,
      presetId,
      targetCoverage: parsed.targetCoverage || DEFAULT_AUTO_FILL_CONFIG.targetCoverage,
      minLen: typeof parsed.minLen === 'number' ? parsed.minLen : DEFAULT_AUTO_FILL_CONFIG.minLen,
      maxLen: typeof parsed.maxLen === 'number' ? parsed.maxLen : DEFAULT_AUTO_FILL_CONFIG.maxLen,
      kMin: typeof parsed.kMin === 'number' ? parsed.kMin : DEFAULT_AUTO_FILL_CONFIG.kMin,
      kMax: typeof parsed.kMax === 'number' ? parsed.kMax : DEFAULT_AUTO_FILL_CONFIG.kMax,
      forbidUturn: typeof parsed.forbidUturn === 'boolean' ? parsed.forbidUturn : DEFAULT_AUTO_FILL_CONFIG.forbidUturn,
      forbidHeadTurn: typeof parsed.forbidHeadTurn === 'boolean' ? parsed.forbidHeadTurn : DEFAULT_AUTO_FILL_CONFIG.forbidHeadTurn,
      forbid2x2Loop: typeof parsed.forbid2x2Loop === 'boolean' ? parsed.forbid2x2Loop : DEFAULT_AUTO_FILL_CONFIG.forbid2x2Loop,
      ensureAtLeastOneMovable: typeof parsed.ensureAtLeastOneMovable === 'boolean' ? parsed.ensureAtLeastOneMovable : DEFAULT_AUTO_FILL_CONFIG.ensureAtLeastOneMovable,
      shapePreference: parsed.shapePreference || DEFAULT_AUTO_FILL_CONFIG.shapePreference,
      dDefinition: parsed.dDefinition || DEFAULT_AUTO_FILL_CONFIG.dDefinition,
      minRopes: parsed.minRopes != null && typeof parsed.minRopes === 'number' && !Number.isNaN(parsed.minRopes) ? Math.max(0, Math.floor(parsed.minRopes)) : null,
      maxRopes: parsed.maxRopes != null && typeof parsed.maxRopes === 'number' && !Number.isNaN(parsed.maxRopes) ? Math.max(0, Math.floor(parsed.maxRopes)) : null,
      seed: parsed.seed !== undefined ? (typeof parsed.seed === 'number' ? parsed.seed : null) : null,
    };
  } catch (error) {
    console.error('加载自动填充配置失败:', error);
    return { ...DEFAULT_AUTO_FILL_CONFIG, presetId: DEFAULT_PRESET_ID };
  }
}

/**
 * 保存自动填充配置到 localStorage（含 presetId）
 */
export function saveAutoFillConfig(config: StoredAutoFillConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('保存自动填充配置失败:', error);
  }
}
