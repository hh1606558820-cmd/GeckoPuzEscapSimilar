/**
 * 模块：Rope 可视化叠加层 (RopeOverlay)
 * 
 * 职责：
 * - 在网格上方叠加显示 Rope 的线段和箭头
 * - 使用 SVG 绘制线段连接相邻格子，颜色根据 ColorIdx 显示
 * - 在每条 Rope 的末端绘制箭头，颜色与线段一致
 * - 选中 Rope 时显示黑色描边高亮
 * 
 * 输入：
 * - levelData: LevelData - 关卡数据（包含所有 Rope）
 * - cellSize: number - 格子大小（像素）
 * - showRopeOverlay: boolean - 是否显示 overlay
 * - selectedRopeIndex: number | null - 当前选中的 Rope 索引（用于高亮）
 * 
 * 输出：
 * - 渲染 SVG overlay（绝对定位覆盖网格）
 */

import React, { useMemo } from 'react';
import { LevelData } from '@/types/Level';
import { indexToCenter } from './geometry';
import { getColorHexByIdx } from '@/modules/rope-color-pool/colorPool';
import './RopeOverlay.css';

// 基础线条粗细和箭头大小（视觉不变的值）
const BASE_STROKE = 4;
const BASE_ARROW_LENGTH = 18; // 箭头长度
const BASE_ARROW_WIDTH = 8;    // 箭头宽度

/**
 * 将方向 D 映射到屏幕坐标向量（SVG y 向下）
 * D=1 上 => (0, -1)
 * D=2 下 => (0, +1)
 * D=3 右 => (+1, 0)（屏幕向右）
 * D=4 左 => (-1, 0)（屏幕向左）
 */
function dirToScreenVec(D: number): { dx: number; dy: number } {
  switch (D) {
    case 1: // 上（屏幕向上，SVG y 向下，所以 dy = -1）
      return { dx: 0, dy: -1 };
    case 2: // 下（屏幕向下，SVG y 向下，所以 dy = +1）
      return { dx: 0, dy: 1 };
    case 3: // 右（屏幕向右，SVG x 向右，所以 dx = +1）
      return { dx: 1, dy: 0 };
    case 4: // 左（屏幕向左，SVG x 向右，所以 dx = -1）
      return { dx: -1, dy: 0 };
    default:
      return { dx: 0, dy: 0 };
  }
}

interface RopeOverlayProps {
  levelData: LevelData;
  cellSize: number; // baseCellSize（未缩放）
  zoom?: number; // 缩放比例，默认 1.0
  showRopeOverlay: boolean;
  selectedRopeIndex?: number | null;
}

export const RopeOverlay: React.FC<RopeOverlayProps> = ({
  levelData,
  cellSize, // baseCellSize（未缩放）
  zoom = 1.0,
  showRopeOverlay,
  selectedRopeIndex = null,
}) => {
  // 计算 SVG 的宽高（使用 baseCellSize，不乘 zoom，因为 wrapper 已整体缩放）
  const svgWidth = levelData.MapX * cellSize;
  const svgHeight = levelData.MapY * cellSize;

  // 渲染所有 Rope 的线段和箭头
  const renderRopes = useMemo(() => {
    if (!showRopeOverlay) {
      return null;
    }

    const elements: JSX.Element[] = [];

    levelData.Rope.forEach((rope, ropeIndex) => {
      // 只绘制 Index.length >= 2 的 Rope（至少需要两个点才能画线段）
      if (rope.Index.length < 2) {
        return;
      }

      // 判断是否是选中的 Rope（用于高亮显示）
      const isSelected = selectedRopeIndex !== null && ropeIndex === selectedRopeIndex;
      const currentStrokeWidth = BASE_STROKE / zoom;
      
      // 根据 ColorIdx 获取显示颜色
      // ColorIdx = -1（无色）时使用默认编辑器颜色 #999999
      const displayColor = getColorHexByIdx(rope.ColorIdx);

      // 将 Index 数组转换为像素坐标点（使用 baseCellSize，不乘 zoom，因为 wrapper 已整体缩放）
      const points: Array<{ cx: number; cy: number }> = rope.Index.map((index) =>
        indexToCenter(index, levelData.MapX, levelData.MapY, cellSize)
      );

      // 绘制线段：连接相邻的点
      for (let i = 0; i < points.length - 1; i++) {
        const from = points[i];
        const to = points[i + 1];

        // 如果选中，先绘制描边层（黑色，更粗）
        if (isSelected) {
          elements.push(
            <line
              key={`rope-${ropeIndex}-segment-${i}-outline`}
              x1={from.cx}
              y1={from.cy}
              x2={to.cx}
              y2={to.cy}
              stroke="#000"
              strokeWidth={currentStrokeWidth + 2 / zoom}
              strokeLinecap="round"
            />
          );
        }

        // 绘制主线段（使用 displayColor）
        elements.push(
          <line
            key={`rope-${ropeIndex}-segment-${i}`}
            x1={from.cx}
            y1={from.cy}
            x2={to.cx}
            y2={to.cy}
            stroke={displayColor}
            strokeWidth={currentStrokeWidth}
            strokeLinecap="round"
          />
        );
      }

      // 在头部格子 H 绘制箭头，方向按 D（头部朝向）
      // 严格使用 rope.H 和 rope.D，不从 Index 推导
      if (rope.D >= 1 && rope.D <= 4) {
        // 箭头位置：使用 rope.H
        const p = indexToCenter(rope.H, levelData.MapX, levelData.MapY, cellSize);
        
        // 箭头方向向量：使用 rope.D
        const v = dirToScreenVec(rope.D);
        
        // 箭头尺寸（视觉不变，除以 zoom）
        const L = BASE_ARROW_LENGTH / zoom; // 箭头长度
        const W = BASE_ARROW_WIDTH / zoom;  // 箭头宽度
        
        // 箭头尖端：tipX = p.cx + v.dx * L, tipY = p.cy + v.dy * L
        const tipX = p.cx + v.dx * L;
        const tipY = p.cy + v.dy * L;
        
        // 箭头底中心（沿方向退一点）：baseX = p.cx + v.dx * (L * 0.55), baseY = p.cy + v.dy * (L * 0.55)
        const baseX = p.cx + v.dx * (L * 0.55);
        const baseY = p.cy + v.dy * (L * 0.55);
        
        // 法向量：nx = -v.dy, ny = v.dx
        const nx = -v.dy;
        const ny = v.dx;
        
        // 底边两点：leftX = baseX + nx * (W/2), leftY = baseY + ny * (W/2)
        //           rightX = baseX - nx * (W/2), rightY = baseY - ny * (W/2)
        const leftX = baseX + nx * (W / 2);
        const leftY = baseY + ny * (W / 2);
        const rightX = baseX - nx * (W / 2);
        const rightY = baseY - ny * (W / 2);
        
        // 如果选中，先绘制箭头描边层（黑色，更粗）
        if (isSelected) {
          // 箭头主干描边
          elements.push(
            <line
              key={`rope-${ropeIndex}-arrow-stem-outline`}
              x1={p.cx}
              y1={p.cy}
              x2={baseX}
              y2={baseY}
              stroke="#000"
              strokeWidth={currentStrokeWidth + 2 / zoom}
              strokeLinecap="round"
            />
          );
          // 箭头三角形描边
          elements.push(
            <polygon
              key={`rope-${ropeIndex}-arrow-head-outline`}
              points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
              fill="#000"
            />
          );
        }
        
        // 绘制箭头主干：从 p 到 baseCenter（使用 displayColor）
        elements.push(
          <line
            key={`rope-${ropeIndex}-arrow-stem`}
            x1={p.cx}
            y1={p.cy}
            x2={baseX}
            y2={baseY}
            stroke={displayColor}
            strokeWidth={currentStrokeWidth}
            strokeLinecap="round"
          />
        );
        
        // 绘制箭头头：三角形 [tip, left, right]（使用 displayColor）
        elements.push(
          <polygon
            key={`rope-${ropeIndex}-arrow-head`}
            points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
            fill={displayColor}
          />
        );
      }
    });

    return elements;
  }, [levelData.Rope, levelData.MapX, levelData.MapY, cellSize, zoom, showRopeOverlay, selectedRopeIndex]);

  if (!showRopeOverlay) {
    return null;
  }

  // SVG 定位：与网格层在同一坐标系中（都在 zoomWrapper 内，使用 top-left 原点）
  return (
    <svg
      className="rope-overlay"
      width={svgWidth}
      height={svgHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none', // 不影响点击格子
      }}
    >
      {renderRopes}
    </svg>
  );
};
