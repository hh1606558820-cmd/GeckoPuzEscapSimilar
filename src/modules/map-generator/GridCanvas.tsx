/**
 * 模块：网格画布 - 地图生成器版本 (GridCanvas)
 * 
 * 职责：
 * - 渲染 MapX × MapY 的网格
 * - 在每个格子里显示 index 编号（小字）
 * - 处理格子选择交互（单击、Ctrl 多选、拖拽框选）
 * - 高亮显示选中的格子
 * - 显示所有 Rope 的路径可视化
 * - 在 Rope 编辑模式下响应点击
 * 
 * 输入：
 * - MapX: number - 地图宽度
 * - MapY: number - 地图高度
 * - selectedIndices: number[] - 当前选中的格子索引数组（地图生成器用）
 * - onSelectionChange: (indices: number[]) => void - 选择变更回调（地图生成器用）
 * - allRopes: RopeData[] - 所有 Rope 数据（用于路径可视化）
 * - currentEditingPath: number[] - 当前正在编辑的 Rope 路径（临时路径）
 * - isRopeEditing: boolean - 是否处于 Rope 编辑模式
 * - onCellClick: (index: number) => void - 格子点击回调（Rope 编辑模式用）
 * 
 * 输出：
 * - 渲染网格画布 UI
 * - 通过回调函数通知父组件选择变更或点击事件
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RopeData, LevelData } from '@/types/Level';
import { getCellIndex, getCellPosition, handleCellClick, handleDragSelection } from './selection';
import { hitTestRope } from '@/modules/rope-manager/ropeHitTest';
import { RopeOverlay } from '@/modules/rope-visualizer/RopeOverlay';
import './GridCanvas.css';

interface GridCanvasProps {
  MapX: number;
  MapY: number;
  selectedIndices: number[];
  onSelectionChange: (indices: number[]) => void;
  allRopes?: RopeData[];
  currentEditingPath?: number[];
  isRopeEditing?: boolean;
  onCellClick?: (index: number) => void;
  selectedRopeIndex?: number | null;
  onRopeHit?: (ropeIndex: number) => void;
  levelData?: LevelData;
  showRopeOverlay?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export const GridCanvas: React.FC<GridCanvasProps> = ({
  MapX,
  MapY,
  selectedIndices,
  onSelectionChange,
  allRopes = [],
  currentEditingPath = [],
  isRopeEditing = false,
  onCellClick,
  selectedRopeIndex = null,
  onRopeHit,
  levelData,
  showRopeOverlay = true,
  zoom = 1.0,
  onZoomChange,
}) => {
  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragEndIndex, setDragEndIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseCellSize, setBaseCellSize] = useState(40); // 基础格子大小（未缩放）

  // 计算自适应 baseCellSize（不受 zoom 影响）
  useEffect(() => {
    const updateCellSize = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const padding = 20; // 内边距
      const availableWidth = container.clientWidth - padding * 2;
      const availableHeight = container.clientHeight - padding * 2;

      // 计算基于宽高的 cellSize（考虑 zoom，所以除以 zoom）
      const cellSizeByWidth = Math.floor(availableWidth / MapX / zoom);
      const cellSizeByHeight = Math.floor(availableHeight / MapY / zoom);
      const calculatedSize = Math.min(cellSizeByWidth, cellSizeByHeight);

      // 限制在 12~48 范围内
      const clampedSize = Math.max(12, Math.min(48, calculatedSize));
      setBaseCellSize(clampedSize);
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, [MapX, MapY, zoom]);

  // 实际显示的 cellSize（baseCellSize * zoom）
  const displayCellSize = baseCellSize * zoom;

  // 判断格子是否被选中（地图生成器模式）
  const isCellSelected = useCallback(
    (index: number) => {
      return !isRopeEditing && selectedIndices.includes(index);
    },
    [selectedIndices, isRopeEditing]
  );

  // 判断格子是否在某个 Rope 路径中
  const getRopeCellClass = useCallback(
    (index: number): string => {
      // 检查是否在当前编辑的路径中（最高优先级，最明显）
      if (isRopeEditing && currentEditingPath.includes(index)) {
        const position = currentEditingPath.indexOf(index);
        if (position === 0) {
          return 'rope-editing-start'; // 起点
        } else if (position === currentEditingPath.length - 1) {
          return 'rope-editing-end'; // 终点
        } else {
          return 'rope-editing-path'; // 路径中间
        }
      }

      // 检查是否在选中的 Rope 路径中（管理面板选中，高亮显示）
      if (selectedRopeIndex !== null && selectedRopeIndex >= 0 && selectedRopeIndex < allRopes.length) {
        const selectedRope = allRopes[selectedRopeIndex];
        if (selectedRope.Index.includes(index)) {
          const position = selectedRope.Index.indexOf(index);
          if (position === 0) {
            return 'rope-selected-start'; // 起点
          } else if (position === selectedRope.Index.length - 1) {
            return 'rope-selected-end'; // 终点
          } else {
            return 'rope-selected-path'; // 路径中间
          }
        }
      }

      // 检查是否在其他 Rope 路径中
      for (let i = 0; i < allRopes.length; i++) {
        // 跳过正在编辑的 Rope 和已选中的 Rope（避免重复高亮）
        if (isRopeEditing && i === selectedRopeIndex) continue;
        if (selectedRopeIndex !== null && i === selectedRopeIndex) continue;

        const rope = allRopes[i];
        if (rope.Index.includes(index)) {
          const position = rope.Index.indexOf(index);
          if (position === 0) {
            return 'rope-path-start'; // 起点
          } else if (position === rope.Index.length - 1) {
            return 'rope-path-end'; // 终点
          } else {
            return 'rope-path'; // 路径中间
          }
        }
      }

      return '';
    },
    [allRopes, currentEditingPath, isRopeEditing, selectedRopeIndex]
  );

  // 处理格子点击
  const handleCellClickEvent = (
    e: React.MouseEvent,
    x: number,
    y: number
  ) => {
    e.preventDefault();
    const index = getCellIndex(x, y, MapX);

    // 如果处于 Rope 编辑模式，使用 onCellClick 回调（优先用于路径编辑）
    if (isRopeEditing && onCellClick) {
      onCellClick(index);
      return;
    }

    // 在非编辑模式下，先检查是否命中 Rope（模块3：Rope 管理）
    if (!isRopeEditing && onRopeHit) {
      // 使用 hitTestRope 函数检测命中（支持多 Rope 命中处理）
      const hitRopeIndex = hitTestRope(index, allRopes);
      if (hitRopeIndex !== null) {
        // 命中 Rope，通知父组件
        onRopeHit(hitRopeIndex);
        return; // 命中后不再执行地图生成器的选择逻辑
      }
    }

    // 如果没有命中 Rope，使用地图生成器的选择逻辑
    const newSelection = handleCellClick(
      index,
      selectedIndices,
      e.ctrlKey || e.metaKey // 支持 Mac 的 Cmd 键
    );
    onSelectionChange(newSelection);
  };

  // 处理鼠标按下（开始拖拽）
  const handleMouseDown = (
    e: React.MouseEvent,
    x: number,
    y: number
  ) => {
    e.preventDefault();
    const index = getCellIndex(x, y, MapX);

    // 如果处于 Rope 编辑模式，不处理拖拽
    if (isRopeEditing) {
      return;
    }

    setIsDragging(true);
    setDragStartIndex(index);
    setDragEndIndex(index);

    // 如果按了 Ctrl，先处理点击选择
    if (e.ctrlKey || e.metaKey) {
      const newSelection = handleCellClick(index, selectedIndices, true);
      onSelectionChange(newSelection);
    } else {
      // 否则直接选中当前格子
      onSelectionChange([index]);
    }
  };

  // 处理鼠标移动（拖拽中）
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || dragStartIndex === null || !containerRef.current) {
        return;
      }

      // 计算鼠标位置对应的格子
      // 由于网格使用了 transform scale(zoom) 和 transform-origin: center
      // 需要计算相对于 zoomWrapper 的坐标
      if (!containerRef.current) return;
      
      // 找到 zoomWrapper 元素（canvas-container 的直接子元素）
      const zoomWrapper = containerRef.current.querySelector('.zoom-wrapper') as HTMLElement;
      if (!zoomWrapper) return;
      
      const wrapperRect = zoomWrapper.getBoundingClientRect();
      
      // 计算 zoomWrapper 在容器中的中心位置（考虑缩放）
      // 由于 transform-origin: center，缩放后中心位置不变
      const wrapperCenterX = wrapperRect.left + wrapperRect.width / 2;
      const wrapperCenterY = wrapperRect.top + wrapperRect.height / 2;
      
      // 鼠标位置相对于 zoomWrapper 中心，除以 zoom 得到未缩放坐标，再加上网格中心偏移
      const relativeX = (e.clientX - wrapperCenterX) / zoom + gridWidth / 2;
      const relativeY = (e.clientY - wrapperCenterY) / zoom + gridHeight / 2;

      // 计算格子坐标（使用 baseCellSize）
      // DOM 的 y=0 在顶部，逻辑 y=0 在底部，需要翻转
      const x = Math.floor(relativeX / baseCellSize);
      const displayY = Math.floor(relativeY / baseCellSize); // DOM 坐标系中的 y
      const y = MapY - 1 - displayY; // 转换为逻辑坐标系（左下角原点）

      // 确保坐标在有效范围内
      if (x >= 0 && x < MapX && y >= 0 && y < MapY) {
        const index = getCellIndex(x, y, MapX);
        setDragEndIndex(index);

        // 实时更新选择（拖拽框选）
        const newSelection = handleDragSelection(
          dragStartIndex,
          index,
          MapX,
          MapY,
          selectedIndices,
          e.ctrlKey || e.metaKey
        );
        onSelectionChange(newSelection);
      }
    },
    [isDragging, dragStartIndex, MapX, MapY, selectedIndices, onSelectionChange, displayCellSize]
  );

  // 处理鼠标抬起（结束拖拽）
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartIndex(null);
    setDragEndIndex(null);
  }, []);

  // 绑定全局鼠标事件（用于拖拽）
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 渲染网格（从下到上，y 从 MapY-1 到 0）
  const renderGrid = () => {
    const cells: JSX.Element[] = [];
    const showIndex = displayCellSize >= 16; // 当显示 cellSize 太小时隐藏编号

    // 从下到上渲染（y 从 MapY-1 到 0）
    for (let displayRow = 0; displayRow < MapY; displayRow++) {
      // displayRow 是 DOM 中的行号（0 在顶部），需要转换为逻辑 y（0 在底部）
      const y = MapY - 1 - displayRow;
      for (let x = 0; x < MapX; x++) {
        const index = getCellIndex(x, y, MapX);
        const isSelected = isCellSelected(index);
        const ropeClass = getRopeCellClass(index);
        
        const isInDragRange =
          !isRopeEditing &&
          dragStartIndex !== null &&
          dragEndIndex !== null &&
          (() => {
            const startPos = getCellPosition(dragStartIndex, MapX);
            const endPos = getCellPosition(dragEndIndex, MapX);
            const minX = Math.min(startPos.x, endPos.x);
            const maxX = Math.max(startPos.x, endPos.x);
            const minY = Math.min(startPos.y, endPos.y);
            const maxY = Math.max(startPos.y, endPos.y);
            return x >= minX && x <= maxX && y >= minY && y <= maxY;
          })();

        cells.push(
          <div
            key={`${x}-${y}`}
            className={`grid-cell ${isSelected ? 'selected' : ''} ${
              isInDragRange && isDragging ? 'drag-range' : ''
            } ${ropeClass}`}
            style={{
              width: `${baseCellSize}px`,
              height: `${baseCellSize}px`,
            }}
            onMouseDown={(e) => handleMouseDown(e, x, y)}
            onClick={(e) => handleCellClickEvent(e, x, y)}
            title={`坐标: (${x}, ${y}), Index: ${index}`}
          >
            {showIndex && (
              <span className="cell-index" style={{ fontSize: `${Math.max(10, displayCellSize * 0.3)}px` }}>
                {index}
              </span>
            )}
          </div>
        );
      }
    }
    return cells;
  };

  // 缩放控件处理函数
  const handleZoomIn = () => {
    if (onZoomChange) {
      const newZoom = Math.min(2.0, zoom + 0.1);
      onZoomChange(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (onZoomChange) {
      const newZoom = Math.max(0.5, zoom - 0.1);
      onZoomChange(newZoom);
    }
  };

  const handleZoomReset = () => {
    if (onZoomChange) {
      onZoomChange(1.0);
    }
  };

  // 计算网格尺寸（使用 baseCellSize）
  const gridWidth = MapX * baseCellSize;
  const gridHeight = MapY * baseCellSize;

  return (
    <div className="map-grid-canvas">
      <div className="canvas-container" ref={containerRef}>
        {/* 缩放 wrapper：网格层和 overlay 都在同一个容器中，统一缩放 */}
        {/* 外层 flex 居中，内部使用 top-left 原点 */}
        <div
          className="zoom-wrapper"
          style={{
            position: 'relative',
            width: `${gridWidth}px`,
            height: `${gridHeight}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'center',
          }}
        >
          {/* 网格层 */}
          <div
            className="grid-layer"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${MapX}, ${baseCellSize}px)`,
              gridTemplateRows: `repeat(${MapY}, ${baseCellSize}px)`,
              position: 'relative',
              width: `${gridWidth}px`,
              height: `${gridHeight}px`,
            }}
          >
            {renderGrid()}
          </div>
          {/* Rope 可视化叠加层（与网格层在同一坐标系中） */}
          {levelData && (
            <RopeOverlay
              levelData={levelData}
              cellSize={baseCellSize}
              zoom={zoom}
              showRopeOverlay={showRopeOverlay}
              selectedRopeIndex={selectedRopeIndex}
            />
          )}
        </div>
      </div>
      {/* 缩放控件 */}
      {onZoomChange && (
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={handleZoomOut} disabled={zoom <= 0.5}>
            −
          </button>
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
          <button className="zoom-btn" onClick={handleZoomIn} disabled={zoom >= 2.0}>
            +
          </button>
          <button className="zoom-reset-btn" onClick={handleZoomReset}>
            重置
          </button>
        </div>
      )}
      <div className="canvas-hint">
        {isRopeEditing ? (
          <p>✓ Rope 编辑模式：在网格中按顺序点击格子编辑路径</p>
        ) : (
          <p>提示：单击选择 | Ctrl+单击多选 | 拖拽框选</p>
        )}
      </div>
    </div>
  );
};

