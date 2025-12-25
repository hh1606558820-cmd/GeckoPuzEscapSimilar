/**
 * 校验失败确认弹窗组件 (ValidationModal)
 * 
 * 职责：
 * - 显示关卡校验失败的错误信息
 * - 提供"忽略校验并生成"选项
 * 
 * 输入：
 * - errors: string[] - 校验错误信息数组
 * - onConfirm: () => void - 确认忽略校验并生成的回调
 * - onCancel: () => void - 取消操作的回调
 * 
 * 输出：
 * - 渲染弹窗 UI
 */

import React from 'react';
import './ValidationModal.css';

interface ValidationModalProps {
  errors: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  errors,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="validation-modal-overlay" onClick={onCancel}>
      <div className="validation-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="validation-modal-title">关卡校验失败</h2>
        <div className="validation-modal-body">
          <div className="validation-modal-errors">
            {errors.map((error, index) => (
              <div key={index} className="validation-modal-error-item">
                {error}
              </div>
            ))}
          </div>
          <div className="validation-modal-warning">
            该关卡可能存在无法通关的风险，是否仍要生成？
          </div>
        </div>
        <div className="validation-modal-actions">
          <button className="validation-modal-btn validation-modal-btn-cancel" onClick={onCancel}>
            取消
          </button>
          <button className="validation-modal-btn validation-modal-btn-confirm" onClick={onConfirm}>
            忽略校验并生成
          </button>
        </div>
      </div>
    </div>
  );
};

