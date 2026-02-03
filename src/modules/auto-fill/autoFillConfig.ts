/**
 * 模块：自动填充配置管理 (autoFillConfig)
 * 
 * 职责：
 * - 定义自动填充配置的数据结构
 * - 提供配置的加载和保存功能（localStorage）
 * - 提供默认配置
 */

export type CoverageTarget = 'A'; // 先只保留 A，未来扩展再加

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
  maxRopes?: number;                  // （可选）上限，避免巨图太多 rope
  seed?: number | null;               // （可选）用于复现，默认 null
}

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
  maxRopes: undefined,
  seed: null,
};

/**
 * localStorage 键名
 */
const STORAGE_KEY = 'level_editor_auto_fill_config_v1';

/**
 * 加载自动填充配置
 * 从 localStorage 读取，如果不存在或格式错误则返回默认配置
 */
export function loadAutoFillConfig(): AutoFillConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_AUTO_FILL_CONFIG };
    }

    const parsed = JSON.parse(stored);
    
    // 验证并合并配置（确保所有必需字段都存在）
    return {
      ...DEFAULT_AUTO_FILL_CONFIG,
      ...parsed,
      // 确保类型正确
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
      maxRopes: parsed.maxRopes !== undefined ? (typeof parsed.maxRopes === 'number' ? parsed.maxRopes : undefined) : undefined,
      seed: parsed.seed !== undefined ? (typeof parsed.seed === 'number' ? parsed.seed : null) : null,
    };
  } catch (error) {
    console.error('加载自动填充配置失败:', error);
    return { ...DEFAULT_AUTO_FILL_CONFIG };
  }
}

/**
 * 保存自动填充配置到 localStorage
 */
export function saveAutoFillConfig(config: AutoFillConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('保存自动填充配置失败:', error);
  }
}
