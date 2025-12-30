/**
 * 模块：关卡文件管理按钮 (LevelIOButtons)
 * 
 * 职责：
 * - 提供"生成关卡"和"读取关卡"按钮
 * - 处理文件选择和下载
 * - 显示校验错误提示
 * 
 * 输入：
 * - levelData: LevelData - 当前关卡数据
 * - onLevelDataLoad: (levelData: LevelData) => void - 加载关卡数据回调
 * 
 * 输出：
 * - 渲染按钮 UI
 * - 通过回调函数通知父组件加载数据
 */

import React, { useRef } from 'react';
import { LevelData } from '@/types/Level';
import { validateLevel } from './validators';
import { downloadLevelJson, readLevelJson } from './io';
import './LevelIOButtons.css';

interface LevelIOButtonsProps {
  levelData: LevelData;
  onLevelDataLoad: (levelData: LevelData) => void;
}

export const LevelIOButtons: React.FC<LevelIOButtonsProps> = ({
  levelData,
  onLevelDataLoad,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理生成关卡
  const handleGenerate = () => {
    // 执行校验
    const result = validateLevel(levelData);

    if (!result.isValid) {
      // 校验失败，显示错误信息
      const errorMessage = result.errors.join('\n');
      alert(`关卡校验失败：\n\n${errorMessage}\n\n请修复后重试。`);
      return;
    }

    // 校验通过，生成并下载 JSON
    try {
      downloadLevelJson(levelData);
      alert('关卡文件已成功生成并下载！');
    } catch (error) {
      alert('生成文件失败，请重试。');
      console.error('生成文件失败:', error);
    }
  };

  // 处理读取关卡
  const handleRead = () => {
    // 触发文件选择器
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // 检查文件扩展名
    if (!file.name.toLowerCase().endsWith('.json')) {
      alert('请选择 .json 文件');
      // 清空文件选择，允许重新选择
      e.target.value = '';
      return;
    }

    try {
      // 读取并解析文件
      const result = await readLevelJson(file);
      
      // 如果有警告信息，先显示警告
      if (result.warnings.length > 0) {
        const warningMessage = result.warnings.join('\n');
        alert(`关卡文件读取成功，但有警告：\n\n${warningMessage}`);
      } else {
        alert('关卡文件读取成功！');
      }
      
      // 加载成功，通知父组件
      onLevelDataLoad(result.levelData);
    } catch (error) {
      // 读取失败，显示错误信息
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`读取关卡文件失败：\n\n${errorMessage}\n\n请检查文件格式是否正确。`);
      console.error('读取文件失败:', error);
    } finally {
      // 清空文件选择，允许重新选择同一文件
      e.target.value = '';
    }
  };

  return (
    <div className="level-io-buttons">
      <button className="io-btn io-btn-generate" onClick={handleGenerate}>
        生成关卡
      </button>
      <button className="io-btn io-btn-read" onClick={handleRead}>
        读取关卡
      </button>
      {/* 隐藏的文件选择器 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

