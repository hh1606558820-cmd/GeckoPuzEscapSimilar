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
import { EditorMode } from '@/app/App';
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
  mode: EditorMode;
  showMask: boolean;
  showRopes: boolean;
  showArrows: boolean;
  showDText: boolean;
  onShowMaskChange: (value: boolean) => void;
  onShowRopesChange: (value: boolean) => void;
  onShowArrowsChange: (value: boolean) => void;
  onShowDTextChange: (value: boolean) => void;
  onLevelDataLoad: (levelData: LevelData) => void;
  onToggleRopeOverlay: () => void;
  onToggleJsonPanel: () => void;
  onClearLevel: () => void;
  onOpenAutoFill: () => void;
  onToggleMaskEditing: () => void;
  onModeChange: (mode: EditorMode) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  levelData,
  showRopeOverlay,
  showJsonPanel,
  selectedRopeIndex,
  mode,
  showMask,
  showRopes,
  showArrows,
  showDText,
  onShowMaskChange,
  onShowRopesChange,
  onShowArrowsChange,
  onShowDTextChange,
  onLevelDataLoad,
  onToggleRopeOverlay,
  onToggleJsonPanel,
  onClearLevel,
  onOpenAutoFill,
  onToggleMaskEditing,
}) => {
  // 计算派生状态
  const isMaskEditing = mode === 'MASK_EDIT';
  const isDisplayLocked = isMaskEditing; // MASK_EDIT 模式下锁定显示
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
            模式: {mode === 'VIEW' ? '查看' : mode === 'ROPE_EDIT' ? 'Rope编辑' : '构型编辑'}
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
        <button className="top-bar-btn" onClick={onOpenAutoFill}>
          自动填充
        </button>
        <button className="top-bar-btn" onClick={onClearLevel}>
          清空
        </button>
        <button className="top-bar-btn" onClick={onToggleMaskEditing}>
          编辑构型
        </button>
        <button className="top-bar-btn" onClick={handleRead}>
          读取关卡
        </button>
        {/* 显示控制开关 */}
        <div className="top-bar-display-controls" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', marginRight: '4px' }}>显示：</label>
          <button
            className="top-bar-btn"
            style={{ fontSize: '11px', padding: '4px 8px', opacity: isDisplayLocked ? 0.5 : 1, cursor: isDisplayLocked ? 'not-allowed' : 'pointer' }}
            onClick={() => !isDisplayLocked && onShowMaskChange(!showMask)}
            disabled={isDisplayLocked}
            title={isDisplayLocked ? '构型编辑模式下已锁定显示' : '切换构型显示'}
          >
            {showMask ? '✓构型' : '构型'}
          </button>
          <button
            className="top-bar-btn"
            style={{ fontSize: '11px', padding: '4px 8px', opacity: isDisplayLocked ? 0.5 : 1, cursor: isDisplayLocked ? 'not-allowed' : 'pointer' }}
            onClick={() => !isDisplayLocked && onShowRopesChange(!showRopes)}
            disabled={isDisplayLocked}
            title={isDisplayLocked ? '构型编辑模式下已锁定显示' : '切换Rope线显示'}
          >
            {showRopes ? '✓线' : '线'}
          </button>
          <button
            className="top-bar-btn"
            style={{ fontSize: '11px', padding: '4px 8px', opacity: isDisplayLocked ? 0.5 : 1, cursor: isDisplayLocked ? 'not-allowed' : 'pointer' }}
            onClick={() => !isDisplayLocked && onShowArrowsChange(!showArrows)}
            disabled={isDisplayLocked}
            title={isDisplayLocked ? '构型编辑模式下已锁定显示' : '切换箭头显示'}
          >
            {showArrows ? '✓箭头' : '箭头'}
          </button>
          <button
            className="top-bar-btn"
            style={{ fontSize: '11px', padding: '4px 8px', opacity: isDisplayLocked ? 0.5 : 1, cursor: isDisplayLocked ? 'not-allowed' : 'pointer' }}
            onClick={() => !isDisplayLocked && onShowDTextChange(!showDText)}
            disabled={isDisplayLocked}
            title={isDisplayLocked ? '构型编辑模式下已锁定显示' : '切换D文本显示'}
          >
            {showDText ? '✓D' : 'D'}
          </button>
        </div>
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

