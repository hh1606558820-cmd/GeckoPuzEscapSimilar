/**
 * 模块：选择逻辑封装 (selection)
 * 
 * 职责：
 * - 封装格子选择的交互逻辑
 * - 处理单击、Ctrl 多选、拖拽框选等操作
 * - 提供选择状态的工具函数
 * 
 * 输入：
 * - 鼠标事件、键盘状态、当前选择状态
 * 
 * 输出：
 * - 更新后的选择索引数组
 */

/**
 * 计算格子的 index 编号
 * 规则：index = y * MapX + x（左下角为原点，x 向右，y 向上）
 * 
 * @param x 格子的 x 坐标（从 0 开始，左 → 右）
 * @param y 格子的 y 坐标（从 0 开始，下 → 上）
 * @param MapX 地图宽度
 * @returns 格子的 index 编号
 */
export function getCellIndex(x: number, y: number, MapX: number): number {
  return y * MapX + x;
}

/**
 * 从 index 反推坐标（左下角为原点）
 * 
 * @param index 格子的 index 编号
 * @param MapX 地图宽度
 * @returns {x, y} 坐标（左下角为原点，x 向右，y 向上）
 */
export function getCellPosition(index: number, MapX: number): { x: number; y: number } {
  return {
    x: index % MapX,
    y: Math.floor(index / MapX),
  };
}

/**
 * 处理单击选择
 * 
 * @param index 被点击的格子 index
 * @param currentSelection 当前已选中的索引数组
 * @param ctrlKey 是否按下了 Ctrl 键
 * @returns 更新后的选择索引数组
 */
export function handleCellClick(
  index: number,
  currentSelection: number[],
  ctrlKey: boolean
): number[] {
  if (ctrlKey) {
    // Ctrl + 单击：多选/取消（不清空已有选择）
    const indexInSelection = currentSelection.indexOf(index);
    if (indexInSelection >= 0) {
      // 如果已选中，则取消选中
      return currentSelection.filter(i => i !== index);
    } else {
      // 如果未选中，则添加到选择中
      return [...currentSelection, index];
    }
  } else {
    // 不按 Ctrl 单击：只选中当前（清空其他）
    return [index];
  }
}

/**
 * 处理拖拽框选
 * 
 * @param startIndex 拖拽开始的格子 index
 * @param endIndex 拖拽结束的格子 index
 * @param MapX 地图宽度
 * @param MapY 地图高度
 * @param currentSelection 当前已选中的索引数组
 * @param ctrlKey 是否按下了 Ctrl 键
 * @returns 更新后的选择索引数组
 */
export function handleDragSelection(
  startIndex: number,
  endIndex: number,
  MapX: number,
  MapY: number,
  currentSelection: number[],
  ctrlKey: boolean
): number[] {
  // 获取起始和结束坐标
  const startPos = getCellPosition(startIndex, MapX);
  const endPos = getCellPosition(endIndex, MapX);
  
  // 计算矩形范围（确保 start 在左上，end 在右下）
  const minX = Math.min(startPos.x, endPos.x);
  const maxX = Math.max(startPos.x, endPos.x);
  const minY = Math.min(startPos.y, endPos.y);
  const maxY = Math.max(startPos.y, endPos.y);
  
  // 收集矩形范围内的所有 index
  const selectedIndices: number[] = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      // 确保坐标在有效范围内
      if (x >= 0 && x < MapX && y >= 0 && y < MapY) {
        const index = getCellIndex(x, y, MapX);
        selectedIndices.push(index);
      }
    }
  }
  
  if (ctrlKey) {
    // Ctrl + 拖拽：追加到已有选择
    // 合并并去重
    const combined = [...currentSelection, ...selectedIndices];
    return Array.from(new Set(combined)).sort((a, b) => a - b);
  } else {
    // 不按 Ctrl 拖拽：替换选择
    return selectedIndices;
  }
}

/**
 * 验证 index 是否在有效范围内
 * 
 * @param index 格子 index
 * @param MapX 地图宽度
 * @param MapY 地图高度
 * @returns 是否有效
 */
export function isValidIndex(index: number, MapX: number, MapY: number): boolean {
  return index >= 0 && index < MapX * MapY;
}

/**
 * 过滤掉无效的索引（当 MapX/MapY 改变时使用）
 * 
 * @param indices 索引数组
 * @param MapX 地图宽度
 * @param MapY 地图高度
 * @returns 过滤后的有效索引数组
 */
export function filterValidIndices(
  indices: number[],
  MapX: number,
  MapY: number
): number[] {
  return indices.filter(index => isValidIndex(index, MapX, MapY));
}

