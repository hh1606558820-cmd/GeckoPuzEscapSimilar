/**
 * 模块：构型编辑层 (MaskEditorLayer)
 * 
 * 职责：
 * - 专门负责构型编辑交互（单击、拖动涂格）
 * - 使用透明覆盖层接收 Pointer Events
 * - 处理坐标换算（兼容 zoom transform）
 * 
 * 输入：
 * - MapX: number - 地图宽度
 * - MapY: number - 地图高度
 * - maskIndices: number[] - 当前构型格子索引数组
 * - onMaskChange: (indices: number[]) => void - 构型变更回调
 * - baseCellSize: number - 基础格子大小
 * - zoom: number - 缩放比例
 * - containerRef: React.RefObject<HTMLDivElement> - 容器 ref（用于坐标换算）
 * 
 * 输出：
 * - 渲染透明覆盖层，处理构型编辑交互
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import './maskEditor.css';

// 调试开关：设置为 true 显示可视化调试 UI
const DEBUG_MASK = false;

interface MaskEditorLayerProps {
  MapX: number;
  MapY: number;
  maskIndices: number[];
  onMaskChange: (indices: number[]) => void;
  gridWidth: number;
  gridHeight: number;
}

export const MaskEditorLayer: React.FC<MaskEditorLayerProps> = ({
  MapX,
  MapY,
  maskIndices,
  onMaskChange,
  gridWidth,
  gridHeight,
}) => {
  // Pointer Events 状态
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [paintMode, setPaintMode] = useState<'add' | 'remove' | null>(null);
  const [paintedIndices, setPaintedIndices] = useState<Set<number>>(new Set());
  const hitLayerRef = useRef<HTMLDivElement>(null);

  // 调试状态：显示事件数据
  const [debugInfo, setDebugInfo] = useState<{
    lastEvent: string;
    clientX: number;
    clientY: number;
    localX: number;
    localY: number;
    x: number;
    y: number;
    index: number;
  } | null>(null);

  // 使用 ref 存储最新的 maskIndices，避免闭包问题
  const maskIndicesRef = useRef(maskIndices);
  useEffect(() => {
    maskIndicesRef.current = maskIndices;
  }, [maskIndices]);

  // 坐标换算函数：将 Pointer Event 的 clientX/clientY 转换为格子坐标 (x, y)
  // 使用 getBoundingClientRect() 直接计算 local 坐标（rect 已包含缩放后的位置）
  const getCellCoordsFromPointerEvent = useCallback(
    (e: React.PointerEvent | PointerEvent): { x: number; y: number; index: number } | null => {
      if (!hitLayerRef.current || MapX === 0 || MapY === 0) {
        return null;
      }

      // 直接使用 layer 的 getBoundingClientRect（已包含缩放）
      const rect = hitLayerRef.current.getBoundingClientRect();
      
      // 计算相对于 layer 的 local 坐标
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      // 转换为格子坐标（按比例）
      const x = Math.floor((localX / rect.width) * MapX);
      const displayY = Math.floor((localY / rect.height) * MapY); // DOM y=0 在顶部
      const y = MapY - 1 - displayY; // 转换为逻辑坐标系（左下角为0）

      // 确保坐标在有效范围内
      if (x >= 0 && x < MapX && y >= 0 && y < MapY) {
        const index = x + y * MapX;
        return { x, y, index };
      }

      return null;
    },
    [MapX, MapY]
  );

  // 切换单个格子的构型状态
  const toggleMaskCell = useCallback(
    (index: number, forceAdd?: boolean, forceRemove?: boolean) => {
      const currentMask = maskIndicesRef.current;
      const currentIndex = currentMask.indexOf(index);
      const isSelected = currentIndex >= 0;

      let newMask: number[];
      if (forceAdd) {
        // 强制添加
        if (!isSelected) {
          newMask = [...currentMask, index];
        } else {
          newMask = currentMask; // 已存在，不重复添加
        }
      } else if (forceRemove) {
        // 强制移除
        if (isSelected) {
          newMask = currentMask.filter((i) => i !== index);
        } else {
          newMask = currentMask; // 不存在，无需移除
        }
      } else {
        // 切换（toggle）
        if (isSelected) {
          newMask = currentMask.filter((i) => i !== index);
        } else {
          newMask = [...currentMask, index];
        }
      }

      onMaskChange(newMask);
    },
    [onMaskChange]
  );

  // 处理 Pointer Down（开始 paint）
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (MapX === 0 || MapY === 0) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const coords = getCellCoordsFromPointerEvent(e);
      if (!coords) return;

      const index = coords.index;
      const currentMask = maskIndicesRef.current;
      const isSelected = currentMask.includes(index);

      // 更新调试信息
      if (DEBUG_MASK && hitLayerRef.current) {
        const rect = hitLayerRef.current.getBoundingClientRect();
        setDebugInfo({
          lastEvent: 'down',
          clientX: e.clientX,
          clientY: e.clientY,
          localX: e.clientX - rect.left,
          localY: e.clientY - rect.top,
          x: coords.x,
          y: coords.y,
          index,
        });
      }

      // 设置 paint 模式：起点决定模式
      // 若起点已存在：本次拖动模式=ERASE（一路擦除）
      // 若起点不存在：本次拖动模式=PAINT（一路涂上）
      const mode = isSelected ? 'remove' : 'add';
      setPaintMode(mode);
      setIsPointerDown(true);
      setPaintedIndices(new Set([index])); // 记录已处理的格子

      console.log('[MaskEditor] pointerDown', { index, x: coords.x, y: coords.y, isSelected, mode });

      // 立即 toggle 当前格子（单击）- 强制执行，不依赖复杂逻辑
      toggleMaskCell(index);

      // 捕获指针，确保后续 move/up 事件能收到
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    [MapX, MapY, getCellCoordsFromPointerEvent, toggleMaskCell]
  );

  // 处理 Pointer Move（持续 paint）
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // 更新调试信息（即使不在 painting 状态也更新，用于调试）
      if (DEBUG_MASK && hitLayerRef.current) {
        const coords = getCellCoordsFromPointerEvent(e);
        if (coords) {
          const rect = hitLayerRef.current.getBoundingClientRect();
          setDebugInfo({
            lastEvent: isPointerDown ? 'move(painting)' : 'move(idle)',
            clientX: e.clientX,
            clientY: e.clientY,
            localX: e.clientX - rect.left,
            localY: e.clientY - rect.top,
            x: coords.x,
            y: coords.y,
            index: coords.index,
          });
        }
      }

      // 关键：只在 painting=true 时处理 move，未按鼠标时移动不应触发绘制
      if (!isPointerDown || paintMode === null || MapX === 0 || MapY === 0) {
        return; // 未按鼠标时移动，不改变数据
      }

      const coords = getCellCoordsFromPointerEvent(e);
      if (!coords) return;

      const index = coords.index;

      // 如果这个格子已经在本次 paint 操作中处理过，跳过（去重，避免重复 setState）
      if (paintedIndices.has(index)) {
        return;
      }

      const currentMask = maskIndicesRef.current;

      // 根据 paint 模式添加或移除（只 add/remove，不 toggle，避免闪烁）
      if (paintMode === 'add') {
        // PAINT 模式：只添加未选中的格子
        if (!currentMask.includes(index)) {
          toggleMaskCell(index, true, false);
          setPaintedIndices((prev) => new Set([...prev, index]));
        }
      } else {
        // ERASE 模式：只移除已选中的格子
        if (currentMask.includes(index)) {
          toggleMaskCell(index, false, true);
          setPaintedIndices((prev) => new Set([...prev, index]));
        }
      }
    },
    [isPointerDown, paintMode, MapX, MapY, paintedIndices, getCellCoordsFromPointerEvent, toggleMaskCell]
  );

  // 处理 Pointer Up（结束 paint）
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      // 更新调试信息
      if (DEBUG_MASK && hitLayerRef.current) {
        const rect = hitLayerRef.current.getBoundingClientRect();
        setDebugInfo((prev) =>
          prev
            ? {
                ...prev,
                lastEvent: 'up',
                clientX: e.clientX,
                clientY: e.clientY,
                localX: e.clientX - rect.left,
                localY: e.clientY - rect.top,
              }
            : null
        );
      }

      if (!isPointerDown) {
        return;
      }

      console.log('[MaskEditor] pointerUp');

      // 释放指针捕获
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      // 结束 painting
      setIsPointerDown(false);
      setPaintMode(null);
      setPaintedIndices(new Set());
    },
    [isPointerDown]
  );

  // 处理 Pointer Cancel（取消 paint）
  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      console.log('[MaskEditor] pointerCancel');

      // 释放指针捕获
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      // 结束 painting
      setIsPointerDown(false);
      setPaintMode(null);
      setPaintedIndices(new Set());
    },
    []
  );

  if (MapX === 0 || MapY === 0) {
    return null;
  }

  return (
    <>
      <div
        ref={hitLayerRef}
        className="mask-editor-layer"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
          zIndex: 99999, // 确保在最上层
          pointerEvents: 'auto', // 确保可以接收事件
          background: DEBUG_MASK ? 'rgba(0, 255, 0, 0.08)' : 'transparent', // 调试模式：半透明绿色背景
          border: DEBUG_MASK ? '2px solid green' : 'none', // 调试模式：绿色边框
          touchAction: 'none', // 防止浏览器把拖动当滚动/缩放
          userSelect: 'none', // 防止选中文本
          cursor: 'crosshair',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
      {/* 调试 UI：显示事件数据和 maskCount */}
      {DEBUG_MASK && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 999999,
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#0f0',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            pointerEvents: 'none', // 不拦截事件
            whiteSpace: 'pre',
            lineHeight: '1.4',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>MASK LAYER ON</div>
          {debugInfo && (
            <>
              <div>lastEvent: {debugInfo.lastEvent}</div>
              <div>client: ({debugInfo.clientX}, {debugInfo.clientY})</div>
              <div>local: ({Math.round(debugInfo.localX)}, {Math.round(debugInfo.localY)})</div>
              <div>grid: ({debugInfo.x}, {debugInfo.y})</div>
              <div>index: {debugInfo.index}</div>
            </>
          )}
          <div style={{ marginTop: '4px', borderTop: '1px solid #0f0', paddingTop: '4px' }}>
            maskCount: {maskIndices.length}
          </div>
        </div>
      )}
    </>
  );
};

