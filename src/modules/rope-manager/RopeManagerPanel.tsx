/**
 * 模块：Rope 管理面板 (RopeManagerPanel)
 * 
 * 职责：
 * - 展示当前选中 Rope 的管理操作（颜色/随机/删除）
 * - 显示 Rope 的只读信息（Index 长度、H、BendCount、D）
 * - 提供可编辑字段（ColorIdx）
 * - 提供删除 Rope 功能
 * 
 * 输入：
 * - selectedRopeIndex: number | null - 当前选中的 Rope 索引
 * - ropes: RopeData[] - 所有 Rope 数据
 * - isEditingRopePath: boolean - 是否正在编辑 Rope 路径
 * - editingRopeIndex: number | null - 正在编辑的 Rope 索引
 * - onRopeUpdate: (ropeIndex: number, updates: Partial<RopeData>) => void - Rope 更新回调
 * - onRopeDelete: (ropeIndex: number) => void - Rope 删除回调
 * 
 * 输出：
 * - 渲染 Rope 管理面板 UI
 * - 通过回调函数通知父组件操作
 */

import React from 'react';
import { RopeData } from '@/types/Level';
import { RopeColorPicker } from '@/modules/rope-color-pool';
import './RopeManagerPanel.css';

interface RopeManagerPanelProps {
  selectedRopeIndex: number | null;
  ropes: RopeData[];
  isEditingRopePath: boolean;
  editingRopeIndex: number | null;
  onRopeUpdate: (ropeIndex: number, updates: Partial<RopeData>) => void;
  onRopeDelete: (ropeIndex: number) => void;
}

export const RopeManagerPanel: React.FC<RopeManagerPanelProps> = ({
  selectedRopeIndex,
  ropes,
  isEditingRopePath,
  editingRopeIndex,
  onRopeUpdate,
  onRopeDelete,
}) => {
  // 如果没有选中 Rope，显示提示
  if (selectedRopeIndex === null || selectedRopeIndex < 0 || selectedRopeIndex >= ropes.length) {
    return (
      <div className="rope-manager-panel">
        <h2>Rope 管理</h2>
        <div className="panel-section">
          <p className="hint-text">点击网格中的 Rope 路径来管理</p>
        </div>
      </div>
    );
  }

  const selectedRope = ropes[selectedRopeIndex];
  const isCurrentlyEditing = isEditingRopePath && editingRopeIndex === selectedRopeIndex;

  // 处理 ColorIdx 变更
  const handleColorIdxChange = (colorIdx: number) => {
    onRopeUpdate(selectedRopeIndex, {
      ColorIdx: colorIdx,
    });
  };

  // 处理删除 Rope
  const handleDelete = () => {
    if (isCurrentlyEditing) {
      alert('请先结束路径编辑，才能删除 Rope');
      return;
    }

    if (confirm(`确定要删除 Rope #${selectedRopeIndex + 1} 吗？`)) {
      onRopeDelete(selectedRopeIndex);
    }
  };

  return (
    <div className="rope-manager-panel">
      <h2>Rope 管理</h2>

      {/* Rope 基本信息 */}
      <div className="panel-section">
        <h3>Rope #{selectedRopeIndex + 1}</h3>
        {isCurrentlyEditing && (
          <div className="editing-warning">
            <p>⚠️ 当前正在编辑此 Rope 的路径</p>
          </div>
        )}
      </div>

      {/* 只读信息 */}
      <div className="panel-section">
        <h3>路径信息</h3>
        <div className="info-list">
          <div className="info-item">
            <span className="info-label">路径长度:</span>
            <span className="info-value">{selectedRope.Index.length}</span>
          </div>
          <div className="info-item">
            <span className="info-label">终点 (H):</span>
            <span className="info-value">{selectedRope.H}</span>
          </div>
          <div className="info-item">
            <span className="info-label">方向 (D):</span>
            <span className="info-value">{selectedRope.D}</span>
          </div>
          <div className="info-item">
            <span className="info-label">拐弯次数:</span>
            <span className="info-value">{selectedRope.BendCount}</span>
          </div>
        </div>
      </div>

      {/* 可编辑属性 */}
      <div className="panel-section">
        <h3>Rope 属性</h3>
        
          <div className="property-control">
            <label>
              <span>ColorIdx:</span>
              <RopeColorPicker
                value={selectedRope.ColorIdx}
                onChange={handleColorIdxChange}
              />
            </label>
          </div>
      </div>

      {/* 删除操作 */}
      <div className="panel-section">
        <h3>危险操作</h3>
        <button
          className="btn-delete"
          onClick={handleDelete}
          disabled={isCurrentlyEditing}
          title={isCurrentlyEditing ? '请先结束路径编辑' : '删除此 Rope'}
        >
          删除 Rope
        </button>
        {isCurrentlyEditing && (
          <p className="delete-hint">请先结束路径编辑，才能删除 Rope</p>
        )}
      </div>
    </div>
  );
};

