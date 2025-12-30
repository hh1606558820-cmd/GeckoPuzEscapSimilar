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

import React, { useRef, useState } from 'react';
import { LevelData } from '@/types/Level';
import { validateLevel } from '@/modules/level-io/validators';
import { downloadLevelJson, readLevelJson } from '@/modules/level-io/io';
import './layout.css';

/**
 * 清理文件名：去除非法字符
 * - trim
 * - 替换 / \ : * ? " < > | 为 _
 * - 把连续下划线合并
 * - 长度>50截断
 */
function sanitizeFilename(name: string): string {
  // trim
  let sanitized = name.trim();
  
  // 替换非法字符为下划线
  sanitized = sanitized.replace(/[/\\:*?"<>|]/g, '_');
  
  // 把连续下划线合并为一个
  sanitized = sanitized.replace(/_+/g, '_');
  
  // 去除首尾下划线
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  
  // 长度>50截断
  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50);
  }
  
  return sanitized;
}

interface TopBarProps {
  levelData: LevelData;
  showRopeOverlay: boolean;
  showJsonPanel: boolean;
  selectedRopeIndex: number | null;
  isEditingRopePath: boolean;
  isMaskEditing: boolean;
  onLevelDataLoad: (levelData: LevelData) => void;
  onToggleRopeOverlay: () => void;
  onToggleJsonPanel: () => void;
  onClearLevel: () => void;
  onOpenAutoFill: () => void;
  onToggleMaskEditing: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  levelData,
  showRopeOverlay,
  showJsonPanel,
  selectedRopeIndex,
  isEditingRopePath,
  isMaskEditing,
  onLevelDataLoad,
  onToggleRopeOverlay,
  onToggleJsonPanel,
  onClearLevel,
  onOpenAutoFill,
  onToggleMaskEditing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [levelName, setLevelName] = useState<string>('level');

  // 处理生成关卡
  const handleGenerate = () => {
    const result = validateLevel(levelData);
    if (!result.isValid) {
      const errorMessage = result.errors.join('\n');
      alert(`关卡校验失败：\n\n${errorMessage}\n\n请修复后重试。`);
      return;
    }
    try {
      // 清理文件名
      const safeName = sanitizeFilename(levelName);
      const finalName = (safeName || 'level') + '.json';
      
      downloadLevelJson(levelData, finalName);
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
      const result = await readLevelJson(file);
      
      // 如果有警告信息，先显示警告
      if (result.warnings.length > 0) {
        const warningMessage = result.warnings.join('\n');
        alert(`关卡文件读取成功，但有警告：\n\n${warningMessage}`);
      } else {
        alert('关卡文件读取成功！');
      }
      
      onLevelDataLoad(result.levelData);
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
          <span className="top-bar-status">
            构型模式: {isMaskEditing ? '构型编辑' : '普通模式'}
          </span>
        </div>
      </div>
      <div className="top-bar-right">
        <div className="top-bar-input-group">
          <label htmlFor="level-name-input" className="top-bar-label">关卡名：</label>
          <input
            id="level-name-input"
            type="text"
            className="top-bar-input"
            value={levelName}
            onChange={(e) => setLevelName(e.target.value)}
            placeholder="level"
          />
        </div>
        <button className="top-bar-btn" onClick={handleGenerate}>
          生成关卡
        </button>
        <button className="top-bar-btn" onClick={onToggleMaskEditing}>
          编辑构型
        </button>
        <button className="top-bar-btn" onClick={onOpenAutoFill}>
          自动填充
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

