/**
 * 应用入口模块 (App)
 * 
 * 职责：
 * - 管理整个应用的状态（当前关卡数据、选中的瓦片类型等）
 * - 组合各个模块组件，构建应用布局
 * - 处理模块间的数据传递和事件回调
 * 
 * 输入：无（根组件）
 * 输出：渲染完整的应用 UI
 */

import React, { useState, useEffect } from 'react';
import { LevelData, RopeData } from '@/types/Level';
import { MapGeneratorPanel } from '@/modules/map-generator/MapGeneratorPanel';
import { GridCanvas } from '@/modules/map-generator/GridCanvas';
import { RopeEditorPanel } from '@/modules/rope-editor/RopeEditorPanel';
import { RopeManagerPanel } from '@/modules/rope-manager/RopeManagerPanel';
import { filterValidIndices } from '@/modules/map-generator/selection';
import {
  appendPathPoint,
  undoPathPoint,
  calculateRopeFields,
} from '@/modules/rope-editor/ropeLogic';
import {
  deleteRope,
  updateRopeProperties,
} from '@/modules/rope-manager/ropeMutations';
import { getDefaultColorIdx } from '@/modules/rope-color-pool';
import { TopBar } from './layout/TopBar';
import { ResizableSidebar } from './layout/ResizableSidebar';
import { RightJsonPanel } from './layout/RightJsonPanel';
import { AutoFillDialog, autoFillIrregular, type AutoFillConfig } from '@/modules/auto-fill';
import './App.css';
import './layout/layout.css';

// 编辑器模式枚举
export type EditorMode = 'VIEW' | 'ROPE_EDIT' | 'MASK_EDIT';

export const App: React.FC = () => {
  // 关卡数据（最终 JSON 格式）
  const [levelData, setLevelData] = useState<LevelData>({
    MapX: 10,
    MapY: 10,
    Rope: [],
  });

  // 编辑器内部状态：选中的格子索引数组（地图生成器用）
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // 构型编辑相关状态（独立于普通选择）
  const [maskIndices, setMaskIndices] = useState<number[]>([]);

  // 编辑器模式（统一的状态管理）
  const [mode, setMode] = useState<EditorMode>('VIEW');

  // Rope 编辑相关状态（模块2）
  const [currentRopeIndex, setCurrentRopeIndex] = useState<number>(-1); // -1 表示未选择
  const [currentEditingPath, setCurrentEditingPath] = useState<number[]>([]); // 临时编辑路径

  // 计算派生状态（从 mode 推导）
  const isRopeEditing = mode === 'ROPE_EDIT';
  const isMaskEditing = mode === 'MASK_EDIT';

  // Rope 管理相关状态（模块3）
  const [selectedRopeIndex, setSelectedRopeIndex] = useState<number | null>(null); // 管理面板选中的 Rope

  // 显示控制状态（任务1）
  const [showMask, setShowMask] = useState<boolean>(true);
  const [showRopes, setShowRopes] = useState<boolean>(true);
  const [showArrows, setShowArrows] = useState<boolean>(false);
  const [showDText, setShowDText] = useState<boolean>(false);

  // Rope 可视化相关状态（模块4，保留兼容性）
  const [showRopeOverlay, setShowRopeOverlay] = useState<boolean>(true); // 是否显示 Rope 线段/箭头

  // 布局相关状态
  const [sidebarWidth, setSidebarWidth] = useState<number>(320); // 侧边栏宽度
  const [showJsonPanel, setShowJsonPanel] = useState<boolean>(false); // JSON 面板是否显示

  // 网格缩放状态
  const [zoom, setZoom] = useState<number>(1.0); // 缩放比例，默认 1.0，范围 0.5~2.0

  // 自动填充相关状态
  const [showAutoFillDialog, setShowAutoFillDialog] = useState<boolean>(false);


  // 当 MapX/MapY 改变时，自动重置 selectedIndices（避免越界）
  useEffect(() => {
    const validIndices = filterValidIndices(
      selectedIndices,
      levelData.MapX,
      levelData.MapY
    );
    if (validIndices.length !== selectedIndices.length) {
      setSelectedIndices(validIndices);
    }
  }, [levelData.MapX, levelData.MapY]);

  // 任务1：MASK_EDIT 模式下锁定显示状态
  useEffect(() => {
    if (isMaskEditing) {
      setShowMask(true);
      setShowRopes(false);
      setShowArrows(false);
      setShowDText(false);
    }
  }, [isMaskEditing]);

  // 任务2：缩放等级自动降噪（仅在非 MASK_EDIT 模式下生效）
  useEffect(() => {
    if (isMaskEditing) return; // 构型编辑模式已锁定，不自动调整

    if (zoom < 0.7) {
      setShowRopes(false);
      setShowArrows(false);
      setShowDText(false);
    } else if (zoom < 1.0) {
      setShowRopes(true);
      setShowArrows(false);
      setShowDText(false);
    } else if (zoom < 1.3) {
      setShowRopes(true);
      setShowArrows(true);
      setShowDText(false);
    } else {
      setShowRopes(true);
      setShowArrows(true);
      setShowDText(true);
    }
  }, [zoom, isMaskEditing]);

  // 处理地图尺寸变更
  const handleMapSizeChange = (MapX: number, MapY: number) => {
    setLevelData((prev) => ({
      ...prev,
      MapX,
      MapY,
    }));
    // 重置选择（避免越界）
    setSelectedIndices([]);
  };

  // 清空关卡配置，回到初始状态
  const handleClearLevel = () => {
    const confirmed = window.confirm('确定清空当前关卡配置吗？该操作不可撤销');
    if (!confirmed) {
      return;
    }

    // 重置 levelData 为默认初始值
    setLevelData({
      MapX: 10,
      MapY: 10,
      Rope: [],
    });

    // 清空 UI 状态
    setSelectedIndices([]);
    setMaskIndices([]);
    setCurrentRopeIndex(-1);
    setCurrentEditingPath([]);
    setSelectedRopeIndex(null);
    setMode('VIEW');
  };

  // 处理选择变更（地图生成器用）
  const handleSelectionChange = (indices: number[]) => {
    setSelectedIndices(indices);
  };

  // ========== Rope 编辑相关处理函数 ==========

  // 处理 Rope 选择
  const handleRopeSelect = (index: number) => {
    setCurrentRopeIndex(index);
    setMode('VIEW');
    setCurrentEditingPath([]);
  };

  // 处理编辑模式切换
  const handleEditModeToggle = () => {
    // 如果 MapX === 0 或 MapY === 0，不允许进入 Rope 编辑模式
    if (levelData.MapX === 0 || levelData.MapY === 0) {
      alert('地图尺寸为 0 时不能进入 Rope 编辑模式');
      return;
    }

    if (currentRopeIndex < 0) {
      alert('请先选择一个 Rope');
      return;
    }

    if (isRopeEditing) {
      // 结束编辑：保存路径到 Rope
      const currentRope = levelData.Rope[currentRopeIndex];
      const updatedRope = calculateRopeFields(
        currentEditingPath,
        levelData.MapX,
        currentRope
      );

      const newRopes = [...levelData.Rope];
      newRopes[currentRopeIndex] = updatedRope;

      setLevelData({
        ...levelData,
        Rope: newRopes,
      });

      setMode('VIEW');
      setCurrentEditingPath([]);
    } else {
      // 开始编辑：初始化编辑路径为当前 Rope 的路径
      // 如果正在构型编辑模式，先退出构型编辑模式
      if (isMaskEditing) {
        setMode('VIEW');
      }
      const currentRope = levelData.Rope[currentRopeIndex];
      setCurrentEditingPath([...currentRope.Index]);
      setMode('ROPE_EDIT');
    }
  };

  // 处理 Rope 更新（属性变更）
  const handleRopeUpdate = (index: number, rope: RopeData) => {
    const newRopes = [...levelData.Rope];
    newRopes[index] = rope;
    setLevelData({
      ...levelData,
      Rope: newRopes,
    });
  };

  // 处理添加新 Rope
  const handleRopeAdd = () => {
    // 如果 MapX === 0 或 MapY === 0，不允许添加 Rope
    if (levelData.MapX === 0 || levelData.MapY === 0) {
      alert('地图尺寸为 0 时不能添加 Rope');
      return;
    }

    const newRope: RopeData = {
      D: 0,
      H: 0,
      Index: [],
      BendCount: 0,
      ColorIdx: getDefaultColorIdx(), // 默认使用颜色池的默认值（-1 = 无颜色）
    };
    const newRopeIndex = levelData.Rope.length;
    setLevelData({
      ...levelData,
      Rope: [...levelData.Rope, newRope],
    });
    // 自动选中新添加的 Rope
    setCurrentRopeIndex(newRopeIndex);
  };

  // 处理删除 Rope
  const handleRopeDelete = (index: number) => {
    if (confirm(`确定要删除 Rope #${index + 1} 吗？`)) {
      const newRopes = levelData.Rope.filter((_, i) => i !== index);
      setLevelData({
        ...levelData,
        Rope: newRopes,
      });

      // 如果删除的是当前选中的 Rope，重置选择
      if (currentRopeIndex === index) {
        setCurrentRopeIndex(-1);
        setMode('VIEW');
        setCurrentEditingPath([]);
      } else if (currentRopeIndex > index) {
        // 如果删除的 Rope 在当前选中之前，需要调整索引
        setCurrentRopeIndex(currentRopeIndex - 1);
      }
    }
  };

  // 处理网格点击（Rope 编辑模式）
  const handleCellClick = (index: number) => {
    // 如果 MapX === 0 或 MapY === 0，不执行逻辑
    if (levelData.MapX === 0 || levelData.MapY === 0) {
      return;
    }

    if (!isRopeEditing || currentRopeIndex < 0) {
      return;
    }

    // 构型限制：构型外格子不可参与 Rope 编辑（仅在退出构型编辑模式且 maskIndices 不为空时）
    if (!isMaskEditing && maskIndices.length > 0 && !maskIndices.includes(index)) {
      return;
    }

    // 检查是否是撤销操作（点击最后一个格子）
    if (
      currentEditingPath.length > 0 &&
      currentEditingPath[currentEditingPath.length - 1] === index
    ) {
      // 撤销一步
      setCurrentEditingPath(undoPathPoint(currentEditingPath));
      return;
    }

    // 尝试追加路径点
    const result = appendPathPoint(
      currentEditingPath,
      index,
      levelData.MapX
    );

    if (result.success) {
      setCurrentEditingPath(result.path);
    } else {
      // 显示错误提示
      alert(result.message || '操作失败');
    }
  };

  // ========== Rope 管理相关处理函数（模块3） ==========

  // 处理 Rope 命中（点击网格中的 Rope 路径）
  const handleRopeHit = (ropeIndex: number) => {
    // 设置选中的 Rope，打开管理面板
    setSelectedRopeIndex(ropeIndex);
  };

  // 处理 Rope 属性更新（模块3：管理面板）
  const handleRopePropertyUpdate = (ropeIndex: number, updates: Partial<RopeData>) => {
    const newRopes = updateRopeProperties(levelData.Rope, ropeIndex, updates);
    setLevelData({
      ...levelData,
      Rope: newRopes,
    });
  };

  // 处理 Rope 删除（模块3：管理面板）
  const handleRopeManagerDelete = (ropeIndex: number) => {
    // 检查是否正在编辑此 Rope
    if (isRopeEditing && currentRopeIndex === ropeIndex) {
      alert('请先结束路径编辑，才能删除 Rope');
      return;
    }

    // 删除 Rope
    const newRopes = deleteRope(levelData.Rope, ropeIndex);
    setLevelData({
      ...levelData,
      Rope: newRopes,
    });

    // 处理选中状态
    if (selectedRopeIndex === ropeIndex) {
      // 如果删除的是当前选中的 Rope
      if (newRopes.length === 0) {
        // 没有 Rope 了，清空选中
        setSelectedRopeIndex(null);
      } else if (ropeIndex < newRopes.length) {
        // 选中同位置的 Rope（如果有）
        setSelectedRopeIndex(ropeIndex);
      } else {
        // 选中最后一个 Rope
        setSelectedRopeIndex(newRopes.length - 1);
      }
    } else if (selectedRopeIndex !== null && selectedRopeIndex > ropeIndex) {
      // 如果删除的 Rope 在当前选中之前，需要调整索引
      setSelectedRopeIndex(selectedRopeIndex - 1);
    }

    // 处理编辑状态
    if (currentRopeIndex === ropeIndex) {
      // 如果删除的是正在编辑的 Rope，重置编辑状态
      setCurrentRopeIndex(-1);
      setMode('VIEW');
      setCurrentEditingPath([]);
    } else if (currentRopeIndex > ropeIndex) {
      // 如果删除的 Rope 在当前编辑之前，需要调整索引
      setCurrentRopeIndex(currentRopeIndex - 1);
    }
  };

  // ========== Rope 可视化相关处理函数（模块4） ==========

  // 切换 Rope overlay 显示/隐藏
  const handleToggleRopeOverlay = () => {
    setShowRopeOverlay((prev) => !prev);
  };

  // 切换 JSON 面板显示/隐藏
  const handleToggleJsonPanel = () => {
    setShowJsonPanel((prev) => !prev);
  };

  // ========== 关卡文件管理相关处理函数（模块6） ==========

  // 处理加载关卡数据（读取关卡文件后调用）
  const handleLevelDataLoad = (loadedLevelData: LevelData) => {
    // 更新关卡数据
    setLevelData(loadedLevelData);

    // 清空所有选择状态（避免脏状态）
    setSelectedIndices([]);
    setMaskIndices([]);
    setSelectedRopeIndex(null);
    setCurrentRopeIndex(-1);
    setCurrentEditingPath([]);
    setMode('VIEW');
  };

  // ========== 构型编辑相关处理函数 ==========

  // 切换构型编辑模式
  const handleToggleMaskEditing = () => {
    // 如果 MapX === 0 或 MapY === 0，不允许进入构型编辑模式
    if (levelData.MapX === 0 || levelData.MapY === 0) {
      alert('地图尺寸为 0 时不能进入构型编辑模式');
      return;
    }
    if (isMaskEditing) {
      // 退出构型编辑模式
      setMode('VIEW');
    } else {
      // 进入构型编辑模式：如果正在编辑 Rope，先退出 Rope 编辑模式
      if (isRopeEditing) {
        // 结束编辑：保存路径到 Rope
        const currentRope = levelData.Rope[currentRopeIndex];
        const updatedRope = calculateRopeFields(
          currentEditingPath,
          levelData.MapX,
          currentRope
        );

        const newRopes = [...levelData.Rope];
        newRopes[currentRopeIndex] = updatedRope;

        setLevelData({
          ...levelData,
          Rope: newRopes,
        });

        setCurrentEditingPath([]);
      }
      setMode('MASK_EDIT');
    }
  };

  // ========== 自动填充相关处理函数 ==========

  // 打开自动填充弹窗
  const handleOpenAutoFill = () => {
    // 检查是否有构型（maskIndices）
    if (maskIndices.length === 0) {
      alert('请先编辑构型（选择可用格子），然后再使用自动填充功能。');
      return;
    }
    setShowAutoFillDialog(true);
  };

  // 处理自动填充生成
  const handleAutoFillGenerate = (config: AutoFillConfig) => {
    // 将 maskIndices 转换为 Set（shapeMask）
    const shapeMask = new Set(maskIndices);
    
    // 调用自动填充算法
    const result = autoFillIrregular(
      shapeMask,
      config.overwriteExisting ? [] : levelData.Rope,
      levelData.MapX,
      levelData.MapY,
      config
    );

    // 处理错误
    if (result.errors.length > 0) {
      alert(`自动填充失败：\n\n${result.errors.join('\n')}`);
      return;
    }

    // 更新 levelData
    setLevelData({
      ...levelData,
      Rope: result.ropes,
    });

    // 显示警告（如果有）
    if (result.warnings.length > 0) {
      alert(`自动填充完成：\n\n${result.warnings.join('\n')}`);
    } else {
      alert(`自动填充完成！生成了 ${result.ropes.length} 条 Rope。`);
    }
  };

  return (
    <div className="app">
      <TopBar
        levelData={levelData}
        showRopeOverlay={showRopeOverlay}
        showJsonPanel={showJsonPanel}
        selectedRopeIndex={selectedRopeIndex}
        mode={mode}
        showMask={showMask}
        showRopes={showRopes}
        showArrows={showArrows}
        showDText={showDText}
        onShowMaskChange={setShowMask}
        onShowRopesChange={setShowRopes}
        onShowArrowsChange={setShowArrows}
        onShowDTextChange={setShowDText}
        onLevelDataLoad={handleLevelDataLoad}
        onToggleRopeOverlay={handleToggleRopeOverlay}
        onToggleJsonPanel={handleToggleJsonPanel}
        onClearLevel={handleClearLevel}
        onOpenAutoFill={handleOpenAutoFill}
        onToggleMaskEditing={handleToggleMaskEditing}
        onModeChange={setMode}
      />
      
      <div className="app-layout">
        {/* 左侧：可拖拽侧边栏 */}
        <div className="app-sidebar-container">
          <ResizableSidebar width={sidebarWidth} onWidthChange={setSidebarWidth}>
            <MapGeneratorPanel
              MapX={levelData.MapX}
              MapY={levelData.MapY}
              onMapSizeChange={handleMapSizeChange}
            />
            <RopeEditorPanel
              ropes={levelData.Rope}
              currentRopeIndex={currentRopeIndex}
              isEditing={isRopeEditing}
              onRopeSelect={handleRopeSelect}
              onEditModeToggle={handleEditModeToggle}
              onRopeUpdate={handleRopeUpdate}
              onRopeAdd={handleRopeAdd}
              onRopeDelete={handleRopeDelete}
            />
            <RopeManagerPanel
              selectedRopeIndex={selectedRopeIndex}
              ropes={levelData.Rope}
              isEditingRopePath={isRopeEditing}
              editingRopeIndex={currentRopeIndex >= 0 ? currentRopeIndex : null}
              onRopeUpdate={handleRopePropertyUpdate}
              onRopeDelete={handleRopeManagerDelete}
            />
          </ResizableSidebar>
        </div>

        {/* 中间：网格画布 */}
        <div className="app-main-container">
          <GridCanvas
            MapX={levelData.MapX}
            MapY={levelData.MapY}
            selectedIndices={selectedIndices}
            onSelectionChange={handleSelectionChange}
            allRopes={levelData.Rope}
            currentEditingPath={currentEditingPath}
            mode={mode}
            maskIndices={maskIndices}
            onMaskChange={setMaskIndices}
            onCellClick={handleCellClick}
            selectedRopeIndex={selectedRopeIndex}
            onRopeHit={handleRopeHit}
            levelData={levelData}
            showRopeOverlay={showRopeOverlay}
            showMask={showMask}
            showRopes={showRopes}
            showArrows={showArrows}
            showDText={showDText}
            zoom={zoom}
            onZoomChange={setZoom}
          />
        </div>
      </div>

      {/* 右侧：JSON 面板（固定定位） */}
      {showJsonPanel && (
        <RightJsonPanel
          levelData={levelData}
          selectedIndices={selectedIndices}
          topBarHeight={60}
        />
      )}

      {/* 自动填充弹窗 */}
      <AutoFillDialog
        isOpen={showAutoFillDialog}
        onClose={() => setShowAutoFillDialog(false)}
        onGenerate={handleAutoFillGenerate}
      />
    </div>
  );
};

