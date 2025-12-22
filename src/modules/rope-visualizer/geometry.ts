/**
 * 模块：Rope 可视化几何工具 (geometry)
 * 
 * 职责：
 * - 提供 index 到坐标的转换函数
 * - 计算格子中心点坐标
 * 
 * 坐标规则：左下角为原点，x 向右，y 向上
 * index = y * MapX + x
 * 
 * 输入：
 * - index: number - 格子的 index 编号
 * - MapX: number - 地图宽度
 * - MapY: number - 地图高度（用于 y 坐标翻转）
 * - cellSize: number - 格子大小（像素）
 * 
 * 输出：
 * - 格子的坐标或像素坐标
 */

/**
 * 从 index 计算坐标（左下角原点）
 * 
 * @param index 格子的 index 编号
 * @param MapX 地图宽度
 * @returns {x, y} 坐标（左下角为原点，x 向右，y 向上）
 */
export function indexToXY(index: number, MapX: number): { x: number; y: number } {
  return {
    x: index % MapX,
    y: Math.floor(index / MapX),
  };
}

/**
 * 从坐标计算 index（左下角原点）
 * 
 * @param x x 坐标（从 0 开始，左 → 右）
 * @param y y 坐标（从 0 开始，下 → 上）
 * @param MapX 地图宽度
 * @returns index 编号
 */
export function xyToIndex(x: number, y: number, MapX: number): number {
  return y * MapX + x;
}

/**
 * 从 index 计算格子中心点像素坐标
 * 注意：DOM 的 y=0 在顶部，而逻辑 y=0 在底部，需要翻转
 * 
 * @param index 格子的 index 编号
 * @param MapX 地图宽度
 * @param MapY 地图高度（用于 y 坐标翻转）
 * @param cellSize 格子大小（像素）
 * @returns {cx, cy} 中心点坐标（像素，DOM 坐标系）
 */
export function indexToCenter(index: number, MapX: number, MapY: number, cellSize: number): { cx: number; cy: number } {
  const { x, y } = indexToXY(index, MapX);
  // DOM 的 y=0 在顶部，逻辑 y=0 在底部，需要翻转
  const displayY = MapY - 1 - y;
  return {
    cx: x * cellSize + cellSize / 2,
    cy: displayY * cellSize + cellSize / 2,
  };
}

/**
 * 计算两点之间的角度（用于箭头方向）
 * 
 * @param from 起始点坐标
 * @param to 终点坐标
 * @returns 角度（弧度）
 */
export function calculateAngle(from: { cx: number; cy: number }, to: { cx: number; cy: number }): number {
  return Math.atan2(to.cy - from.cy, to.cx - from.cx);
}

/**
 * 根据方向 D 计算箭头角度（DOM 坐标系）
 * D=1 上（逻辑 y 增大，DOM y 减小）：角度 = -π/2
 * D=2 下（逻辑 y 减小，DOM y 增大）：角度 = π/2
 * D=3 右（x 增大）：角度 = 0
 * D=4 左（x 减小）：角度 = π
 * 
 * @param direction 方向枚举值（1=上，2=下，3=右，4=左）
 * @returns 角度（弧度，DOM 坐标系）
 */
export function directionToAngle(direction: number): number {
  switch (direction) {
    case 1: // 上
      return -Math.PI / 2;
    case 2: // 下
      return Math.PI / 2;
    case 3: // 右
      return 0;
    case 4: // 左
      return Math.PI;
    default:
      return 0;
  }
}
