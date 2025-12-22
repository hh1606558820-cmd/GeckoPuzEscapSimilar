/**
 * 模块：Rope 编辑器面板 (RopeEditorPanel)
 * 
 * 职责：
 * - 显示 Rope 列表（Rope #1 / Rope #2 / ...）
 * - 选择当前编辑的 Rope
 * - 提供"开始/结束 Rope 路径配置"切换按钮
 * - 配置 Rope 属性（ColorIdx）
 * 
 * 输入：
 * - ropes: RopeData[] - 所有 Rope 数据
 * - currentRopeIndex: number - 当前选中的 Rope 索引（-1 表示未选择）
 * - isEditing: boolean - 是否处于编辑模式
 * - onRopeSelect: (index: number) => void - Rope 选择回调
 * - onEditModeToggle: () => void - 编辑模式切换回调
 * - onRopeUpdate: (index: number, rope: RopeData) => void - Rope 更新回调
 * - onRopeAdd: () => void - 添加新 Rope 回调
 * - onRopeDelete: (index: number) => void - 删除 Rope 回调
 * 
 * 输出：
 * - 渲染 Rope 编辑器面板 UI
 * - 通过回调函数通知父组件操作
 */

import React from 'react';
import { RopeData } from '@/types/Level';
import { RopeColorPicker } from '@/modules/rope-color-pool';
import './RopeEditorPanel.css';

interface RopeEditorPanelProps {
  ropes: RopeData[];
  currentRopeIndex: number;
  isEditing: boolean;
  onRopeSelect: (index: number) => void;
  onEditModeToggle: () => void;
  onRopeUpdate: (index: number, rope: RopeData) => void;
  onRopeAdd: () => void;
  onRopeDelete: (index: number) => void;
}

export const RopeEditorPanel: React.FC<RopeEditorPanelProps> = ({
  ropes,
  currentRopeIndex,
  isEditing,
  onRopeSelect,
  onEditModeToggle,
  onRopeUpdate,
  onRopeAdd,
  onRopeDelete,
}) => {
  const currentRope = currentRopeIndex >= 0 ? ropes[currentRopeIndex] : null;

  // 处理 ColorIdx 变更
  const handleColorIdxChange = (colorIdx: number) => {
    if (currentRopeIndex >= 0 && currentRope) {
      onRopeUpdate(currentRopeIndex, {
        ...currentRope,
        ColorIdx: colorIdx,
      });
    }
  };

  return (
    <div className="rope-editor-panel">
      <h2>Rope 路径编辑</h2>

      {/* Rope 列表 */}
      <div className="panel-section">
        <div className="section-header">
          <h3>Rope 列表</h3>
          <button className="btn-add" onClick={onRopeAdd}>
            + 添加
          </button>
        </div>
        <div className="rope-list">
          {ropes.length === 0 ? (
            <p className="empty-text">暂无 Rope，点击"添加"创建</p>
          ) : (
            ropes.map((rope, index) => (
              <div
                key={index}
                className={`rope-item ${
                  index === currentRopeIndex ? 'active' : ''
                }`}
                onClick={() => onRopeSelect(index)}
              >
                <span className="rope-label">Rope #{index + 1}</span>
                <span className="rope-info">
                  {rope.Index.length} 个点
                </span>
                {index === currentRopeIndex && (
                  <button
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRopeDelete(index);
                    }}
                  >
                    删除
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 编辑模式控制 */}
      {currentRopeIndex >= 0 && (
        <div className="panel-section">
          <h3>路径编辑</h3>
          <button
            className={`btn-edit-mode ${isEditing ? 'editing' : ''}`}
            onClick={onEditModeToggle}
          >
            {isEditing ? '结束 Rope 路径配置' : '开始 Rope 路径配置'}
          </button>
          {isEditing && (
            <div className="edit-hint">
              <p>✓ 编辑模式已开启</p>
              <p>在网格中按顺序点击格子来编辑路径</p>
              <p>• 新格子必须与最后一个格子相邻</p>
              <p>• 点击最后一个格子可撤销</p>
              <p>• 不允许重复格子</p>
            </div>
          )}
        </div>
      )}

      {/* Rope 属性配置 */}
      {currentRopeIndex >= 0 && currentRope && (
        <div className="panel-section">
          <h3>Rope 属性</h3>
          
          <div className="property-control">
            <label>
              <span>ColorIdx:</span>
              <RopeColorPicker
                value={currentRope.ColorIdx}
                onChange={handleColorIdxChange}
              />
            </label>
          </div>

          <div className="rope-stats">
            <p>路径长度: {currentRope.Index.length}</p>
            <p>方向 (D): {currentRope.D}</p>
            <p>终点 (H): {currentRope.H}</p>
            <p>拐弯次数: {currentRope.BendCount}</p>
          </div>
        </div>
      )}

      {currentRopeIndex < 0 && (
        <div className="panel-section">
          <p className="hint-text">请先选择一个 Rope 开始编辑</p>
        </div>
      )}
    </div>
  );
};

