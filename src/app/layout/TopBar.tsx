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
import { ValidationModal } from './ValidationModal';
import './layout.css';

interface TopBarProps {
  levelData: LevelData;
  showRopeOverlay: boolean;
  showJsonPanel: boolean;
  selectedRopeIndex: number | null;
  isEditingRopePath: boolean;
  isMaskEditing: boolean;
  levelName: string;
  onLevelNameChange: (name: string) => void;
  onLevelDataLoad: (levelData: LevelData) => void;
  onToggleRopeOverlay: () => void;
  onToggleJsonPanel: () => void;
  onClearLevel: () => void;
  onToggleMaskEditing: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  levelData,
  showRopeOverlay,
  showJsonPanel,
  selectedRopeIndex,
  isEditingRopePath,
  isMaskEditing,
  levelName,
  onLevelNameChange,
  onLevelDataLoad,
  onToggleRopeOverlay,
  onToggleJsonPanel,
  onClearLevel,
  onToggleMaskEditing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /**
   * 清理文件名：移除非法字符
   * @param name 原始文件名
   * @returns 清理后的文件名，若为空则返回 'level'
   */
  const sanitizeFileName = (name: string): string => {
    // trim 空白字符
    let sanitized = name.trim();
    
    // 若为空字符串，使用默认值
    if (sanitized === '') {
      return 'level';
    }
    
    // 移除非法字符：\/:*?"<>|
    sanitized = sanitized.replace(/[\/:*?"<>|]/g, '');
    
    // 再次检查是否为空（移除非法字符后可能为空）
    if (sanitized === '') {
      return 'level';
    }
    
    return sanitized;
  };

  /**
   * 执行生成关卡文件（跳过校验）
   */
  const generateLevelFile = () => {
    try {
      // 清理文件名并生成最终文件名
      const sanitizedName = sanitizeFileName(levelName);
      const filename = `${sanitizedName}.json`;
      downloadLevelJson(levelData, filename);
      alert('关卡文件已成功生成并下载！');
    } catch (error) {
      alert('生成文件失败，请重试。');
      console.error('生成文件失败:', error);
    }
  };

  // 处理生成关卡
  const handleGenerate = () => {
    const result = validateLevel(levelData);
    if (!result.isValid) {
      // 校验失败，显示确认弹窗
      setValidationErrors(result.errors);
      setShowValidationModal(true);
      return;
    }
    // 校验通过，直接生成
    generateLevelFile();
  };

  // 处理忽略校验并生成
  const handleIgnoreValidation = () => {
    setShowValidationModal(false);
    generateLevelFile();
  };

  // 处理取消
  const handleCancelValidation = () => {
    setShowValidationModal(false);
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
            构型模式: {isMaskEditing ? '构型编辑中' : '普通模式'}
          </span>
        </div>
      </div>
      <div className="top-bar-right">
        <div className="top-bar-level-name-input">
          <label htmlFor="level-name-input" className="top-bar-level-name-label">
            关卡名:
          </label>
          <input
            id="level-name-input"
            type="text"
            className="top-bar-level-name-input-field"
            value={levelName}
            onChange={(e) => onLevelNameChange(e.target.value)}
            placeholder="请输入关卡文件名"
          />
        </div>
        <button className="top-bar-btn" onClick={handleGenerate}>
          生成关卡
        </button>
        <button className="top-bar-btn" onClick={onClearLevel}>
          清空
        </button>
        <button 
          className={`top-bar-btn ${isMaskEditing ? 'active' : ''}`}
          onClick={onToggleMaskEditing}
        >
          编辑构型
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
      {showValidationModal && (
        <ValidationModal
          errors={validationErrors}
          onConfirm={handleIgnoreValidation}
          onCancel={handleCancelValidation}
        />
      )}
    </header>
  );
};

