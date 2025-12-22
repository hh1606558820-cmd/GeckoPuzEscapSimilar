/**
 * 顶部栏组件 (TopBar)
 * 
 * 职责：
 * - 显示标题、地图尺寸、Rope 数量
 * - 提供操作按钮（生成关卡、清空、读取关卡、显示/隐藏线段箭头、JSON 面板开关）
 * 
 * 输入：
 * - levelData: LevelData - 关卡数据
 * - showRopeOverlay: boolean - 是否显示线段箭头
 * - showJsonPanel: boolean - 是否显示 JSON 面板
 * - onLevelDataLoad: (levelData: LevelData) => void - 加载关卡数据回调
 * - onToggleRopeOverlay: () => void - 切换线段箭头显示
 * - onToggleJsonPanel: () => void - 切换 JSON 面板显示
 * - onClearLevel: () => void - 清空关卡配置回调
 * 
 * 输出：
 * - 渲染顶部栏 UI
 */

import React, { useRef } from 'react';
import { LevelData } from '@/types/Level';
import { validateLevel } from '@/modules/level-io/validators';
import { downloadLevelJson, readLevelJson } from '@/modules/level-io/io';
import './layout.css';

interface TopBarProps {
  levelData: LevelData;
  showRopeOverlay: boolean;
  showJsonPanel: boolean;
  selectedRopeIndex: number | null;
  isEditingRopePath: boolean;
  onLevelDataLoad: (levelData: LevelData) => void;
  onToggleRopeOverlay: () => void;
  onToggleJsonPanel: () => void;
  onClearLevel: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  levelData,
  showRopeOverlay,
  showJsonPanel,
  selectedRopeIndex,
  isEditingRopePath,
  onLevelDataLoad,
  onToggleRopeOverlay,
  onToggleJsonPanel,
  onClearLevel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理生成关卡
  const handleGenerate = () => {
    const result = validateLevel(levelData);
    if (!result.isValid) {
      const errorMessage = result.errors.join('\n');
      alert(`关卡校验失败：\n\n${errorMessage}\n\n请修复后重试。`);
      return;
    }
    try {
      downloadLevelJson(levelData);
      alert('关卡文件已成功生成并下载！');
    } catch (error) {
      alert('生成文件失败，请重试。');
      console.error('生成文件失败:', error);
    }
  };

  // 处理读取关卡
  const handleRead = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      alert('请选择 .json 文件');
      e.target.value = '';
      return;
    }

    try {
      const loadedLevelData = await readLevelJson(file);
      onLevelDataLoad(loadedLevelData);
      alert('关卡文件读取成功！');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`读取关卡文件失败：\n\n${errorMessage}\n\n请检查文件格式是否正确。`);
      console.error('读取文件失败:', error);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <h1 className="top-bar-title">关卡编辑器</h1>
        <div className="top-bar-info">
          <span>地图: {levelData.MapX}×{levelData.MapY}</span>
          <span>Rope: {levelData.Rope.length}</span>
          <span className="top-bar-status">
            当前选中: {selectedRopeIndex !== null ? `Rope #${selectedRopeIndex + 1}` : '未选中Rope'}
          </span>
          <span className="top-bar-status">
            编辑模式: {isEditingRopePath ? '编辑中' : '非编辑'}
          </span>
        </div>
      </div>
      <div className="top-bar-right">
        <button className="top-bar-btn" onClick={handleGenerate}>
          生成关卡
        </button>
        <button className="top-bar-btn" onClick={onClearLevel}>
          清空
        </button>
        <button className="top-bar-btn" onClick={handleRead}>
          读取关卡
        </button>
        <button className="top-bar-btn" onClick={onToggleRopeOverlay}>
          {showRopeOverlay ? '隐藏线段' : '显示线段'}
        </button>
        <button className="top-bar-btn" onClick={onToggleJsonPanel}>
          {showJsonPanel ? '关闭JSON' : '打开JSON'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </header>
  );
};

