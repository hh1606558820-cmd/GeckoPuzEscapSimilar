/**
 * 右侧 JSON 面板组件 (RightJsonPanel)
 * 
 * 职责：
 * - 显示 JSON 预览
 * - 提供复制 JSON 功能
 * - 固定定位在右侧
 * 
 * 输入：
 * - levelData: LevelData - 关卡数据
 * - selectedIndices: number[] - 当前选中的格子索引
 * - topBarHeight: number - 顶部栏高度（用于定位）
 * 
 * 输出：
 * - 渲染右侧 JSON 面板 UI
 */

import React from 'react';
import { LevelData } from '@/types/Level';
import { formatJSON } from '@/shared/utils';
import './layout.css';

interface RightJsonPanelProps {
  levelData: LevelData;
  selectedIndices: number[];
  topBarHeight: number;
}

export const RightJsonPanel: React.FC<RightJsonPanelProps> = ({
  levelData,
  selectedIndices,
  topBarHeight,
}) => {
  const handleCopy = async () => {
    const json = formatJSON(levelData);
    try {
      await navigator.clipboard.writeText(json);
      alert('已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败，请重试');
    }
  };

  return (
    <div
      className="right-json-panel"
      style={{
        top: `${topBarHeight}px`,
        height: `calc(100vh - ${topBarHeight}px)`,
      }}
    >
      <div className="json-panel-header">
        <h2>JSON 预览</h2>
        <button className="json-copy-btn" onClick={handleCopy}>
          复制JSON
        </button>
      </div>
      <div className="json-panel-content">
        <div className="json-panel-info">
          <p>地图尺寸: {levelData.MapX} × {levelData.MapY}</p>
          <p>已选中: {selectedIndices.length} 个格子</p>
          <p>Rope 数量: {levelData.Rope.length}</p>
        </div>
        <pre className="json-content">{formatJSON(levelData)}</pre>
      </div>
    </div>
  );
};




