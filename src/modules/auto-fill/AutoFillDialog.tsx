/**
 * 模块：自动填充弹窗组件 (AutoFillDialog)
 * 
 * 职责：
 * - 显示自动填充配置参数
 * - 处理用户输入和生成操作
 * 
 * 输入：
 * - isOpen: boolean - 是否显示弹窗
 * - onClose: () => void - 关闭回调
 * - onGenerate: (config: AutoFillConfig) => void - 生成回调
 * 
 * 输出：
 * - 渲染弹窗 UI
 */

import React, { useState, useEffect } from 'react';
import { AutoFillConfig } from './autoFill';
import './AutoFillDialog.css';

interface AutoFillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: AutoFillConfig) => void;
}

export const AutoFillDialog: React.FC<AutoFillDialogProps> = ({
  isOpen,
  onClose,
  onGenerate,
}) => {
  const [config, setConfig] = useState<AutoFillConfig>({
    minLen: 2,
    maxLen: 25,
    Kmin: 0,
    Kmax: 5,
    turnChance: 0.35,
    corridorBias: 0.6,
    overwriteExisting: false,
  });

  // 当弹窗打开时，重置配置
  useEffect(() => {
    if (isOpen) {
      setConfig({
        minLen: 2,
        maxLen: 25,
        Kmin: 0,
        Kmax: 5,
        turnChance: 0.35,
        corridorBias: 0.6,
        overwriteExisting: false,
      });
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleGenerate = () => {
    // 验证配置
    if (config.minLen < 2) {
      alert('最小长度必须 >= 2');
      return;
    }
    if (config.maxLen < config.minLen) {
      alert('最大长度必须 >= 最小长度');
      return;
    }
    if (config.Kmin < 0 || config.Kmax < config.Kmin) {
      alert('拐弯次数范围无效');
      return;
    }
    if (config.turnChance < 0 || config.turnChance > 1) {
      alert('转弯概率必须在 0~1 之间');
      return;
    }
    if (config.corridorBias < 0 || config.corridorBias > 1) {
      alert('直走偏好必须在 0~1 之间');
      return;
    }

    onGenerate(config);
    onClose();
  };

  return (
    <div className="auto-fill-dialog-overlay" onClick={onClose}>
      <div className="auto-fill-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="auto-fill-dialog-header">
          <h2>自动填充不规则 Rope</h2>
          <button className="auto-fill-dialog-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="auto-fill-dialog-content">
          <div className="auto-fill-param-group">
            <label>
              <span>最小长度 (minLen):</span>
              <input
                type="number"
                min="2"
                max="100"
                value={config.minLen}
                onChange={(e) =>
                  setConfig({ ...config, minLen: parseInt(e.target.value, 10) || 2 })
                }
              />
            </label>
            <p className="param-hint">默认: 2</p>
          </div>

          <div className="auto-fill-param-group">
            <label>
              <span>最大长度 (maxLen):</span>
              <input
                type="number"
                min="2"
                max="100"
                value={config.maxLen}
                onChange={(e) =>
                  setConfig({ ...config, maxLen: parseInt(e.target.value, 10) || 25 })
                }
              />
            </label>
            <p className="param-hint">默认: 25</p>
          </div>

          <div className="auto-fill-param-group">
            <label>
              <span>最小拐弯次数 (Kmin):</span>
              <input
                type="number"
                min="0"
                max="20"
                value={config.Kmin}
                onChange={(e) =>
                  setConfig({ ...config, Kmin: parseInt(e.target.value, 10) || 0 })
                }
              />
            </label>
            <p className="param-hint">默认: 0</p>
          </div>

          <div className="auto-fill-param-group">
            <label>
              <span>最大拐弯次数 (Kmax):</span>
              <input
                type="number"
                min="0"
                max="20"
                value={config.Kmax}
                onChange={(e) =>
                  setConfig({ ...config, Kmax: parseInt(e.target.value, 10) || 5 })
                }
              />
            </label>
            <p className="param-hint">默认: 5</p>
          </div>

          <div className="auto-fill-param-group">
            <label>
              <span>转弯概率 (turnChance):</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={config.turnChance}
                onChange={(e) =>
                  setConfig({ ...config, turnChance: parseFloat(e.target.value) || 0.35 })
                }
              />
            </label>
            <p className="param-hint">范围: 0~1，默认: 0.35</p>
          </div>

          <div className="auto-fill-param-group">
            <label>
              <span>直走偏好 (corridorBias):</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={config.corridorBias}
                onChange={(e) =>
                  setConfig({ ...config, corridorBias: parseFloat(e.target.value) || 0.6 })
                }
              />
            </label>
            <p className="param-hint">范围: 0~1，默认: 0.6（越大越偏好直走更长）</p>
          </div>

          <div className="auto-fill-param-group">
            <label>
              <input
                type="checkbox"
                checked={config.overwriteExisting}
                onChange={(e) =>
                  setConfig({ ...config, overwriteExisting: e.target.checked })
                }
              />
              <span>覆盖现有 Rope</span>
            </label>
            <p className="param-hint">默认: false（true 时先清空 Rope）</p>
          </div>
        </div>

        <div className="auto-fill-dialog-footer">
          <button className="auto-fill-btn auto-fill-btn-primary" onClick={handleGenerate}>
            生成
          </button>
          <button className="auto-fill-btn auto-fill-btn-secondary" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
};



