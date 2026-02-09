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
import { sanitizeFileName } from '@/shared/utils';
import { StoredAutoFillConfig, DEFAULT_AUTO_FILL_CONFIG, DEFAULT_PRESET_ID, saveAutoFillConfig } from '@/modules/auto-fill/autoFillConfig';
import { AutoFillConfigDialog } from '@/modules/auto-fill/AutoFillConfigDialog';
import { computeDifficulty, type DifficultyDiagnostics } from '@/modules/difficulty/difficultyScore';
import './layout.css';

interface TopBarProps {
  levelData: LevelData;
  showRopeOverlay: boolean;
  showJsonPanel: boolean;
  selectedRopeIndex: number | null;
  isEditingRopePath: boolean;
  levelName: string;
  onLevelNameChange: (name: string) => void;
  isLevelNameDirty: boolean;
  onLevelNameDirtyChange: (dirty: boolean) => void;
  isMaskEditing: boolean;
  onToggleMaskEditing: () => void;
  onLevelDataLoad: (levelData: LevelData) => void;
  onToggleRopeOverlay: () => void;
  onToggleJsonPanel: () => void;
  onClearLevel: () => void;
  onAutoFill: () => void;
  maskIndices: number[];
  autoFillConfig: StoredAutoFillConfig;
  onAutoFillConfigChange: (config: StoredAutoFillConfig) => void;
  autoFillFallbackHint?: string | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  levelData,
  showRopeOverlay,
  showJsonPanel,
  selectedRopeIndex,
  isEditingRopePath,
  levelName,
  onLevelNameChange,
  isLevelNameDirty,
  onLevelNameDirtyChange,
  isMaskEditing,
  onToggleMaskEditing,
  onLevelDataLoad,
  onToggleRopeOverlay,
  onToggleJsonPanel,
  onClearLevel,
  onAutoFill,
  maskIndices,
  autoFillConfig,
  onAutoFillConfigChange,
  autoFillFallbackHint,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyDiagnostics | null>(null);
  const [showDifficultyDetails, setShowDifficultyDetails] = useState(false);

  const handleComputeDifficulty = () => {
    setDifficulty(computeDifficulty(levelData));
  };

  // 处理生成关卡
  const handleGenerate = () => {
    const result = validateLevel(levelData);
    
    // 如果有错误，阻止生成
    if (!result.isValid) {
      const errorMessage = result.errors.join('\n');
      alert(`关卡校验失败：\n\n${errorMessage}\n\n请修复后重试。`);
      return;
    }
    
    // 如果有警告，允许生成但提示
    if (result.warnings.length > 0) {
      const warningMessage = result.warnings.join('\n');
      alert(`⚠ 警告：${warningMessage}\n\n已继续生成关卡文件。`);
    }
    
    try {
      // 清理文件名：替换非法字符
      const sanitizedName = levelName.trim() || 'level';
      const cleanFileName = sanitizedName.replace(/[\\/:*?"<>|]+/g, '_');
      const filename = `${cleanFileName}.json`;
      
      downloadLevelJson(levelData, filename);
      if (result.warnings.length === 0) {
        alert('关卡文件已成功生成并下载！');
      }
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
      
      // 读取后进行校验
      const result = validateLevel(loadedLevelData);
      
      // 如果有错误，阻止加载
      if (!result.isValid) {
        const errorMessage = result.errors.join('\n');
        alert(`关卡校验失败：\n\n${errorMessage}\n\n请修复后重试。`);
        e.target.value = '';
        return;
      }
      
      // 如果有警告，允许加载但提示
      if (result.warnings.length > 0) {
        const warningMessage = result.warnings.join('\n');
        alert(`⚠ 警告：${warningMessage}\n\n已继续加载关卡文件。`);
      }
      
      // 方案A：仅当输入框为空或未手动修改时才回填文件名
      if (!isLevelNameDirty || !levelName.trim()) {
        // 去掉扩展名
        const baseName = file.name.replace(/\.json$/i, '');
        // 清洗文件名
        const sanitized = sanitizeFileName(baseName);
        onLevelNameChange(sanitized);
        // 重置 dirty 状态（因为这是自动回填，不是用户手动输入）
        onLevelNameDirtyChange(false);
      }
      
      onLevelDataLoad(loadedLevelData);
      
      if (result.warnings.length === 0) {
        alert('关卡文件读取成功！');
      }
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
            编辑模式: {isEditingRopePath ? 'Rope编辑中' : isMaskEditing ? '构型编辑中' : '非编辑'}
          </span>
        </div>
      </div>
      <div className="top-bar-right">
        <div className="top-bar-filename-input" style={{ display: 'inline-flex', alignItems: 'center', marginRight: '8px' }}>
          <label style={{ marginRight: '4px', fontSize: '14px' }}>文件名:</label>
          <input
            type="text"
            value={levelName}
            onChange={(e) => {
              onLevelNameChange(e.target.value);
              // 用户手动修改时设置 dirty = true
            }}
            style={{
              padding: '4px 8px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '120px'
            }}
            placeholder="level"
          />
        </div>
        <button className="top-bar-btn" onClick={handleGenerate}>
          生成关卡
        </button>
        <button className="top-bar-btn" onClick={handleRead}>
          读取关卡
        </button>
        <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
          <button 
            className="top-bar-btn" 
            onClick={onAutoFill}
            disabled={levelData.MapX === 0 || levelData.MapY === 0}
            title={levelData.MapX === 0 || levelData.MapY === 0 
              ? '请先配置地图尺寸' 
              : isMaskEditing 
              ? '请先退出构型编辑模式后再自动填充' 
              : maskIndices.length === 0
              ? `自动填充 Rope 路径（范围：全图 ${levelData.MapX}×${levelData.MapY}）`
              : `自动填充 Rope 路径（范围：构型格 ${maskIndices.length}）`}
          >
            自动填充
            {maskIndices.length === 0 && levelData.MapX > 0 && levelData.MapY > 0 && (
              <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}>
                (全图)
              </span>
            )}
            {maskIndices.length > 0 && (
              <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}>
                ({maskIndices.length})
              </span>
            )}
          </button>
          <button
            className="top-bar-btn"
            onClick={() => setShowConfigDialog(true)}
            title="自动填充设置"
            style={{ padding: '8px 12px', minWidth: 'auto' }}
          >
            ⚙
          </button>
        </div>
        <button className="top-bar-btn" onClick={handleComputeDifficulty} title="根据当前关卡计算难度（点击才计算）">
          计算难度
        </button>
        <span style={{ fontSize: '14px', marginLeft: '4px' }}>
          DifficultyScore: {difficulty !== null ? Math.round(difficulty.DifficultyScore) : '-'}
        </span>
        {difficulty !== null && (
          <button
            type="button"
            className="top-bar-btn"
            onClick={() => setShowDifficultyDetails((v) => !v)}
            title="展开/收起诊断详情"
            style={{ padding: '4px 8px', minWidth: 'auto', fontSize: '12px' }}
          >
            {showDifficultyDetails ? '▼ 详情' : '▶ 详情'}
          </button>
        )}
        <button className="top-bar-btn" onClick={onClearLevel}>
          清空
        </button>
        <button className="top-bar-btn" onClick={onToggleMaskEditing}>
          {isMaskEditing ? '退出构型编辑' : '编辑构型'}
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
      {difficulty !== null && showDifficultyDetails && (
        <div
          style={{
            padding: '8px 12px',
            fontSize: '12px',
            backgroundColor: 'rgba(0,0,0,0.04)',
            borderTop: '1px solid #eee',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '4px 12px',
          }}
        >
          <span>FirstBreakSteps: {difficulty.FirstBreakSteps}</span>
          <span>KeyLockDepth: {difficulty.KeyLockDepth}</span>
          <span>InitialMovableCount: {difficulty.InitialMovableCount}</span>
          <span>EmptyRatio: {difficulty.EmptyRatio.toFixed(3)}</span>
          <span>FreeAheadRatio: {difficulty.FreeAheadRatio.toFixed(3)}</span>
          <span>OOBRatio: {difficulty.OOBRatio.toFixed(3)}</span>
          <span>N: {difficulty.N}</span>
          <span>AvgLen: {difficulty.AvgLen.toFixed(2)}</span>
          <span>MaxLen: {difficulty.MaxLen}</span>
          <span>AvgBends: {difficulty.AvgBends.toFixed(2)}</span>
          <span>KeySet: [{difficulty.KeySet.join(', ')}]</span>
        </div>
      )}
      {autoFillFallbackHint && (
        <div
          className="auto-fill-fallback-hint"
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            color: '#f57c00',
            backgroundColor: 'rgba(245, 124, 0, 0.08)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {autoFillFallbackHint}
        </div>
      )}
      {showConfigDialog && (
        <AutoFillConfigDialog
          config={autoFillConfig}
          maskCount={maskIndices.length}
          onSave={(newConfig) => {
            onAutoFillConfigChange(newConfig);
            setShowConfigDialog(false);
          }}
          onCancel={() => setShowConfigDialog(false)}
          onReset={() => {
            onAutoFillConfigChange({ ...DEFAULT_AUTO_FILL_CONFIG, presetId: DEFAULT_PRESET_ID });
            saveAutoFillConfig({ ...DEFAULT_AUTO_FILL_CONFIG, presetId: DEFAULT_PRESET_ID });
          }}
        />
      )}
    </header>
  );
};

