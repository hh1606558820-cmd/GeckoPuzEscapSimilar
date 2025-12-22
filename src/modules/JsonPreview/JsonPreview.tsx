/**
 * 模块：JSON 预览 (JsonPreview)
 * 
 * 职责：
 * - 实时显示当前关卡数据的 JSON 格式
 * - 支持复制 JSON 数据
 * - 支持格式化显示
 * 
 * 输入：
 * - levelData: LevelData - 当前关卡数据
 * - selectedIndices: number[] - 当前选中的格子索引（用于显示）
 * 
 * 输出：
 * - 渲染 JSON 预览 UI
 */

import React from 'react';
import { LevelData } from '@/types/Level';
import { formatJSON } from '@/shared/utils';
import './JsonPreview.css';

interface JsonPreviewProps {
  levelData: LevelData;
  selectedIndices: number[];
}

export const JsonPreview: React.FC<JsonPreviewProps> = ({ levelData, selectedIndices }) => {
  const handleCopy = () => {
    const json = formatJSON(levelData);
    navigator.clipboard.writeText(json).then(() => {
      alert('已复制到剪贴板');
    });
  };

  return (
    <div className="json-preview">
      <h2>JSON 预览</h2>
      <div className="preview-container">
        <div className="preview-actions">
          <button className="copy-btn" onClick={handleCopy}>
            复制 JSON
          </button>
        </div>
        <div className="preview-info">
          <p>地图尺寸: {levelData.MapX} × {levelData.MapY}</p>
          <p>已选中: {selectedIndices.length} 个格子</p>
          <p>Rope 数量: {levelData.Rope.length}</p>
        </div>
        <pre className="json-content">
          {formatJSON(levelData)}
        </pre>
      </div>
    </div>
  );
};

