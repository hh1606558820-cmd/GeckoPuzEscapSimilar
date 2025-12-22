/**
 * 模块：操作栏 (ActionsBar)
 * 
 * 职责：
 * - 提供关卡编辑的常用操作按钮（保存、加载、清空、撤销/重做等）
 * - 显示操作提示和状态信息
 * 
 * 输入：
 * - levelData: LevelData - 当前关卡数据
 * - onSave: () => void - 保存回调
 * - onLoad: () => void - 加载回调
 * - onClear: () => void - 清空回调
 * - onExport: () => void - 导出回调
 * - onImport: () => void - 导入回调
 * 
 * 输出：
 * - 渲染操作栏 UI
 * - 通过回调函数执行操作
 */

import React from 'react';
import { LevelData } from '@/types/Level';
import './ActionsBar.css';

interface ActionsBarProps {
  levelData: LevelData;
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: () => void;
  showRopeOverlay?: boolean;
  onToggleRopeOverlay?: () => void;
}

export const ActionsBar: React.FC<ActionsBarProps> = ({
  levelData,
  onSave,
  onLoad,
  onClear,
  onExport,
  onImport,
  showRopeOverlay = true,
  onToggleRopeOverlay,
}) => {
  return (
    <div className="actions-bar">
      <div className="actions-container">
        <button className="action-btn" onClick={onSave} disabled>
          保存
        </button>
        <button className="action-btn" onClick={onLoad} disabled>
          加载
        </button>
        <button className="action-btn" onClick={onClear}>
          清空
        </button>
        <button className="action-btn" onClick={onExport}>
          导出
        </button>
        <button className="action-btn" onClick={onImport} disabled>
          导入
        </button>
        {onToggleRopeOverlay && (
          <button
            className={`action-btn ${showRopeOverlay ? 'active' : ''}`}
            onClick={onToggleRopeOverlay}
            title={showRopeOverlay ? '隐藏线段/箭头' : '显示线段/箭头'}
          >
            {showRopeOverlay ? '隐藏线段' : '显示线段'}
          </button>
        )}
      </div>
      <div className="status-info">
        <span>尺寸: {levelData.MapX} × {levelData.MapY}</span>
        <span>Rope: {levelData.Rope.length}</span>
      </div>
    </div>
  );
};

