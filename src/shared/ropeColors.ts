/**
 * Rope 颜色映射表
 * 用于 RopeOverlay 渲染线条和箭头颜色
 */

export interface RopeColorInfo {
  stroke: string;  // 线条和箭头颜色（hex）
  name: string;    // 颜色名称（用于 tooltip）
}

/**
 * 根据 ColorIdx 获取颜色信息
 * 
 * @param colorIdx ColorIdx 值
 * @returns 颜色信息（stroke 和 name）
 */
export function getRopeColor(colorIdx: number): RopeColorInfo {
  switch (colorIdx) {
    case -1:
      return { stroke: '#9AA0A6', name: '灰色' };  // 无颜色时默认灰色
    case 1:
      return { stroke: '#FF5048', name: '红色' };
    case 2:
      return { stroke: '#FFE73E', name: '黄色' };
    case 3:
      return { stroke: '#4AC6FF', name: '天蓝色' };
    case 4:
      return { stroke: '#80F153', name: '绿色' };
    case 5:
      return { stroke: '#FF9942', name: '橙色' };
    case 6:
      return { stroke: '#B65AFF', name: '紫色' };
    case 7:
      return { stroke: '#FF5AFF', name: '粉色' };
    case 8:
      return { stroke: '#605EFF', name: '深蓝色' };
    case 9:
      return { stroke: '#656368', name: '黑色' };
    case 10:
      return { stroke: '#FFFFFF', name: '白色' };
    case 11:
      return { stroke: '#BE8164', name: '褐色' };
    default:
      // 未知 ColorIdx，默认灰色
      return { stroke: '#9AA0A6', name: '灰色' };
  }
}


