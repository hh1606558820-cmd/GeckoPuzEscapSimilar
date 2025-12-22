/**
 * 可拖拽调整宽度的侧边栏组件 (ResizableSidebar)
 * 
 * 职责：
 * - 提供可拖拽调整宽度的侧边栏
 * - 宽度范围：240~520px，默认 320px
 * 
 * 输入：
 * - children: React.ReactNode - 侧边栏内容
 * - width: number - 当前宽度
 * - onWidthChange: (width: number) => void - 宽度变更回调
 * 
 * 输出：
 * - 渲染可拖拽的侧边栏 UI
 */

import React, { useRef, useEffect, useState } from 'react';
import './layout.css';

interface ResizableSidebarProps {
  children: React.ReactNode;
  width: number;
  onWidthChange: (width: number) => void;
}

export const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  children,
  width,
  onWidthChange,
}) => {
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      const clampedWidth = Math.max(240, Math.min(520, newWidth));
      onWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onWidthChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div className="resizable-sidebar" style={{ width: `${width}px` }}>
      <div className="sidebar-content">{children}</div>
      <div
        ref={resizeRef}
        className="sidebar-resizer"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

