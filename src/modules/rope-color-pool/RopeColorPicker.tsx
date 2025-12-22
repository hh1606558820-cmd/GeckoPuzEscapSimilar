/**
 * 模块：Rope 颜色选择器 (RopeColorPicker)
 * 
 * 职责：
 * - 提供颜色选择器 UI，替换原来的 number 输入
 * - 每个选项显示色块预览 + 文本（如 "1 橘色"）
 * - 选择后通过 onChange 回调通知父组件
 * 
 * 输入：
 * - value: number - 当前选中的 ColorIdx
 * - onChange: (next: number) => void - 颜色变更回调
 * - disabled?: boolean - 是否禁用
 * 
 * 输出：
 * - 渲染颜色选择器 UI
 * - 通过回调函数通知父组件颜色变更
 */

import React from 'react';
import { COLOR_POOL, getColorOption } from './colorPool';
import './RopeColorPicker.css';

interface RopeColorPickerProps {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}

export const RopeColorPicker: React.FC<RopeColorPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  // 获取当前选中的颜色选项
  const currentOption = getColorOption(value);
  const isValid = COLOR_POOL.some((c) => c.id === value);

  // 处理选择变更
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className="rope-color-picker">
      {/* 色块预览 */}
      <div
        className={`color-swatch ${currentOption.isNoColor ? 'no-color' : ''}`}
        style={{
          backgroundColor: currentOption.swatch,
        }}
        title={`${currentOption.id} - ${currentOption.name}`}
      />
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="color-select"
      >
        {COLOR_POOL.map((option) => (
          <option key={option.id} value={option.id}>
            {option.id} - {option.name}
          </option>
        ))}
        {/* 如果当前值不在颜色池中，添加一个"未知颜色"选项 */}
        {!isValid && (
          <option value={value} disabled>
            未知颜色 ({value})
          </option>
        )}
      </select>
    </div>
  );
};

