/**
 * 模块：自动填充配置弹窗 (AutoFillConfigDialog)
 * 
 * 职责：
 * - 显示自动填充配置编辑界面
 * - 提供配置的编辑、保存、恢复默认值功能
 */

import React, { useState, useEffect } from 'react';
import { AutoFillConfig, DEFAULT_AUTO_FILL_CONFIG } from './autoFillConfig';
import './AutoFillConfigDialog.css';

interface AutoFillConfigDialogProps {
  config: AutoFillConfig;
  maskCount: number;
  onSave: (config: AutoFillConfig) => void;
  onCancel: () => void;
  onReset: () => void;
}

export const AutoFillConfigDialog: React.FC<AutoFillConfigDialogProps> = ({
  config,
  maskCount,
  onSave,
  onCancel,
  onReset,
}) => {
  const [localConfig, setLocalConfig] = useState<AutoFillConfig>({ ...config });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 当外部 config 变化时更新本地配置
  useEffect(() => {
    setLocalConfig({ ...config });
    setErrors({});
  }, [config]);

  // 验证配置
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // minLen 验证
    if (localConfig.minLen < 2 || localConfig.minLen > 100) {
      newErrors.minLen = '最小长度必须在 2~100 之间';
    }

    // maxLen 验证
    if (localConfig.maxLen < 2 || localConfig.maxLen > 200) {
      newErrors.maxLen = '最大长度必须在 2~200 之间';
    } else if (localConfig.maxLen < localConfig.minLen) {
      newErrors.maxLen = '最大长度必须 ≥ 最小长度';
    }

    // kMin 验证
    if (localConfig.kMin < 0 || localConfig.kMin > 50) {
      newErrors.kMin = '最小拐弯数必须在 0~50 之间';
    }

    // kMax 验证
    if (localConfig.kMax < 0 || localConfig.kMax > 50) {
      newErrors.kMax = '最大拐弯数必须在 0~50 之间';
    } else if (localConfig.kMax < localConfig.kMin) {
      newErrors.kMax = '最大拐弯数必须 ≥ 最小拐弯数';
    }

    // maxRopes 验证
    if (localConfig.maxRopes !== undefined && localConfig.maxRopes < 1) {
      newErrors.maxRopes = '最大 Rope 数量必须 ≥ 1';
    }

    // seed 验证（可选）
    if (localConfig.seed !== null && localConfig.seed !== undefined) {
      if (typeof localConfig.seed !== 'number' || !Number.isInteger(localConfig.seed)) {
        newErrors.seed = 'Seed 必须是整数';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理保存
  const handleSave = () => {
    if (validate()) {
      onSave(localConfig);
    }
  };

  // 处理恢复默认
  const handleReset = () => {
    const defaultConfig = { ...DEFAULT_AUTO_FILL_CONFIG };
    setLocalConfig(defaultConfig);
    setErrors({});
    onReset();
    // 注意：onReset 会保存默认配置，这里不需要再次保存
  };

  // 更新配置字段
  const updateField = <K extends keyof AutoFillConfig>(
    field: K,
    value: AutoFillConfig[K]
  ) => {
    setLocalConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="auto-fill-config-dialog-overlay" onClick={onCancel}>
      <div className="auto-fill-config-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="auto-fill-config-dialog-header">
          <h2>自动填充设置</h2>
          <button className="auto-fill-config-dialog-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="auto-fill-config-dialog-content">
          {/* 说明 */}
          <div className="auto-fill-config-section">
            <div className="auto-fill-config-info">
              <p>
                <strong>提示：</strong>未配置构型时，自动填充默认对整张地图生效。
                {maskCount === 0 && (
                  <span style={{ color: '#2196f3', marginLeft: '8px' }}>
                    （当前：全图模式）
                  </span>
                )}
                {maskCount > 0 && (
                  <span style={{ color: '#4caf50', marginLeft: '8px' }}>
                    （当前：构型格 {maskCount} 个）
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* 基础设置 */}
          <div className="auto-fill-config-section">
            <h3>基础设置</h3>
            <div className="auto-fill-config-field">
              <label>
                <span>最小长度 (minLen):</span>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={localConfig.minLen}
                  onChange={(e) => updateField('minLen', parseInt(e.target.value, 10) || 2)}
                />
              </label>
              {errors.minLen && <span className="auto-fill-config-error">{errors.minLen}</span>}
            </div>
            <div className="auto-fill-config-field">
              <label>
                <span>最大长度 (maxLen):</span>
                <input
                  type="number"
                  min="2"
                  max="200"
                  value={localConfig.maxLen}
                  onChange={(e) => updateField('maxLen', parseInt(e.target.value, 10) || 25)}
                />
              </label>
              {errors.maxLen && <span className="auto-fill-config-error">{errors.maxLen}</span>}
              {maskCount > 0 && localConfig.maxLen > maskCount && (
                <span className="auto-fill-config-hint">
                  提示：最大长度超过构型格数量 ({maskCount})
                </span>
              )}
            </div>
          </div>

          {/* 拐弯设置 */}
          <div className="auto-fill-config-section">
            <h3>拐弯设置</h3>
            <div className="auto-fill-config-field">
              <label>
                <span>最小拐弯数 (kMin):</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={localConfig.kMin}
                  onChange={(e) => updateField('kMin', parseInt(e.target.value, 10) || 0)}
                />
              </label>
              {errors.kMin && <span className="auto-fill-config-error">{errors.kMin}</span>}
            </div>
            <div className="auto-fill-config-field">
              <label>
                <span>最大拐弯数 (kMax):</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={localConfig.kMax}
                  onChange={(e) => updateField('kMax', parseInt(e.target.value, 10) || 3)}
                />
              </label>
              {errors.kMax && <span className="auto-fill-config-error">{errors.kMax}</span>}
            </div>
          </div>

          {/* 约束开关 */}
          <div className="auto-fill-config-section">
            <h3>约束开关</h3>
            <div className="auto-fill-config-field">
              <label>
                <input
                  type="checkbox"
                  checked={localConfig.forbidUturn}
                  onChange={(e) => updateField('forbidUturn', e.target.checked)}
                />
                <span>禁止回头 (forbidUturn)</span>
              </label>
            </div>
            <div className="auto-fill-config-field">
              <label>
                <input
                  type="checkbox"
                  checked={localConfig.forbidHeadTurn}
                  onChange={(e) => updateField('forbidHeadTurn', e.target.checked)}
                />
                <span>禁止头转弯 (forbidHeadTurn)</span>
              </label>
            </div>
            <div className="auto-fill-config-field">
              <label>
                <input
                  type="checkbox"
                  checked={localConfig.forbid2x2Loop}
                  onChange={(e) => updateField('forbid2x2Loop', e.target.checked)}
                />
                <span>禁止 2×2 绕圈 (forbid2x2Loop)</span>
              </label>
            </div>
            <div className="auto-fill-config-field">
              <label>
                <input
                  type="checkbox"
                  checked={localConfig.ensureAtLeastOneMovable}
                  onChange={(e) => updateField('ensureAtLeastOneMovable', e.target.checked)}
                />
                <span>至少一条可消 (ensureAtLeastOneMovable)</span>
              </label>
            </div>
          </div>

          {/* 形态偏好 */}
          <div className="auto-fill-config-section">
            <h3>形态偏好</h3>
            <div className="auto-fill-config-field">
              <label>
                <span>形态偏好 (shapePreference):</span>
                <select
                  value={localConfig.shapePreference}
                  onChange={(e) => updateField('shapePreference', e.target.value as 'C')}
                >
                  <option value="C">C - 迷宫走廊+蛇形</option>
                </select>
              </label>
            </div>
          </div>

          {/* 高级设置 */}
          <div className="auto-fill-config-section">
            <h3>高级设置</h3>
            <div className="auto-fill-config-field">
              <label>
                <span>最大 Rope 数量 (maxRopes):</span>
                <input
                  type="number"
                  min="1"
                  placeholder="不限制"
                  value={localConfig.maxRopes || ''}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    updateField('maxRopes', value === '' ? undefined : parseInt(value, 10));
                  }}
                />
              </label>
              {errors.maxRopes && <span className="auto-fill-config-error">{errors.maxRopes}</span>}
              <span className="auto-fill-config-hint">
                提示：大地图建议限制 Rope 数量
                {maskCount === 0 && (
                  <span style={{ display: 'block', marginTop: '4px', color: '#f57c00' }}>
                    （全图模式下，未设置时将自动使用保守上限：地图格子数/20）
                  </span>
                )}
              </span>
            </div>
            <div className="auto-fill-config-field">
              <label>
                <span>随机种子 (seed):</span>
                <input
                  type="number"
                  placeholder="不设置"
                  value={localConfig.seed ?? ''}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    updateField('seed', value === '' ? null : parseInt(value, 10) || null);
                  }}
                />
              </label>
              {errors.seed && <span className="auto-fill-config-error">{errors.seed}</span>}
              <span className="auto-fill-config-hint">提示：用于复现生成结果</span>
            </div>
          </div>
        </div>

        <div className="auto-fill-config-dialog-footer">
          <button className="auto-fill-config-btn auto-fill-config-btn-secondary" onClick={handleReset}>
            恢复默认
          </button>
          <button className="auto-fill-config-btn auto-fill-config-btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button className="auto-fill-config-btn auto-fill-config-btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
