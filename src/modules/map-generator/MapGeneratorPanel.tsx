/**
 * 模块：地图生成器面板 (MapGeneratorPanel)
 * 
 * 职责：
 * - 显示和编辑 MapX/MapY（地图尺寸）
 * - 提供输入框或步进器控制地图大小（1~50）
 * - 当 MapX/MapY 改变时通知父组件更新关卡数据
 * 
 * 输入：
 * - MapX: number - 当前地图宽度
 * - MapY: number - 当前地图高度
 * - onMapSizeChange: (MapX: number, MapY: number) => void - 尺寸变更回调
 * 
 * 输出：
 * - 渲染配置面板 UI
 * - 通过回调函数通知父组件尺寸变更
 */

import React, { useState, useEffect } from 'react';
import './MapGeneratorPanel.css';

interface MapGeneratorPanelProps {
  MapX: number;
  MapY: number;
  onMapSizeChange: (MapX: number, MapY: number) => void;
}

export const MapGeneratorPanel: React.FC<MapGeneratorPanelProps> = ({
  MapX,
  MapY,
  onMapSizeChange,
}) => {
  // 本地输入值（用于输入框）
  const [localMapX, setLocalMapX] = useState(MapX.toString());
  const [localMapY, setLocalMapY] = useState(MapY.toString());

  // 当外部 MapX/MapY 改变时，同步本地输入值
  useEffect(() => {
    setLocalMapX(MapX.toString());
    setLocalMapY(MapY.toString());
  }, [MapX, MapY]);

  // 验证并更新 MapX
  const handleMapXChange = (value: string) => {
    setLocalMapX(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 50) {
      onMapSizeChange(numValue, MapY);
    }
  };

  // 验证并更新 MapY
  const handleMapYChange = (value: string) => {
    setLocalMapY(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 50) {
      onMapSizeChange(MapX, numValue);
    }
  };

  // 步进器：增加
  const handleIncrement = (type: 'X' | 'Y') => {
    if (type === 'X' && MapX < 50) {
      onMapSizeChange(MapX + 1, MapY);
    } else if (type === 'Y' && MapY < 50) {
      onMapSizeChange(MapX, MapY + 1);
    }
  };

  // 步进器：减少
  const handleDecrement = (type: 'X' | 'Y') => {
    if (type === 'X' && MapX > 1) {
      onMapSizeChange(MapX - 1, MapY);
    } else if (type === 'Y' && MapY > 1) {
      onMapSizeChange(MapX, MapY - 1);
    }
  };

  // 输入框失焦时，如果值无效则恢复
  const handleBlur = (type: 'X' | 'Y') => {
    if (type === 'X') {
      const numValue = parseInt(localMapX, 10);
      if (isNaN(numValue) || numValue < 1 || numValue > 50) {
        setLocalMapX(MapX.toString());
      }
    } else {
      const numValue = parseInt(localMapY, 10);
      if (isNaN(numValue) || numValue < 1 || numValue > 50) {
        setLocalMapY(MapY.toString());
      }
    }
  };

  return (
    <div className="map-generator-panel">
      <h2>地图生成器</h2>
      <div className="panel-section">
        <h3>地图尺寸</h3>
        <div className="size-control">
          <label>
            <span>宽度 (MapX):</span>
            <div className="stepper">
              <button
                className="stepper-btn"
                onClick={() => handleDecrement('X')}
                disabled={MapX <= 1}
              >
                −
              </button>
              <input
                type="text"
                className="stepper-input"
                value={localMapX}
                onChange={(e) => handleMapXChange(e.target.value)}
                onBlur={() => handleBlur('X')}
                min={1}
                max={50}
              />
              <button
                className="stepper-btn"
                onClick={() => handleIncrement('X')}
                disabled={MapX >= 50}
              >
                +
              </button>
            </div>
          </label>
        </div>
        <div className="size-control">
          <label>
            <span>高度 (MapY):</span>
            <div className="stepper">
              <button
                className="stepper-btn"
                onClick={() => handleDecrement('Y')}
                disabled={MapY <= 1}
              >
                −
              </button>
              <input
                type="text"
                className="stepper-input"
                value={localMapY}
                onChange={(e) => handleMapYChange(e.target.value)}
                onBlur={() => handleBlur('Y')}
                min={1}
                max={50}
              />
              <button
                className="stepper-btn"
                onClick={() => handleIncrement('Y')}
                disabled={MapY >= 50}
              >
                +
              </button>
            </div>
          </label>
        </div>
        <div className="info-box">
          <p>范围：1 ~ 50</p>
          <p>总格子数：{MapX * MapY}</p>
          <p>Index 范围：0 ~ {MapX * MapY - 1}</p>
        </div>
      </div>
      <div className="panel-section">
        <h3>编号规则</h3>
        <div className="info-box">
          <p>index = y × MapX + x（左下角为原点，x 向右，y 向上）</p>
          <p>最底一行显示 0~MapX-1，向上递增</p>
          <p>例如：MapX=5, MapY=3</p>
          <p>(0,0)=0, (1,0)=1, ..., (4,0)=4</p>
          <p>(0,1)=5, (1,1)=6, ..., (4,1)=9</p>
        </div>
      </div>
    </div>
  );
};

