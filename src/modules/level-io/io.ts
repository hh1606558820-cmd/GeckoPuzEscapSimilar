/**
 * 模块：关卡文件 IO (io)
 * 
 * 职责：
 * - 提供关卡数据的下载和读取功能
 * - JSON 序列化和反序列化
 * - 文件操作（下载、读取）
 * 
 * 输入：
 * - levelData: LevelData - 关卡数据（下载用）
 * - file: File - 文件对象（读取用）
 * 
 * 输出：
 * - 下载文件或返回解析后的关卡数据
 */

import { LevelData } from '@/types/Level';
import { indexToXY } from '@/modules/rope-visualizer/geometry';

/**
 * 下载关卡 JSON 文件
 * 
 * @param levelData 关卡数据
 * @param filename 文件名（可选，默认使用 level_MapXxMapY.json）
 */
export function downloadLevelJson(levelData: LevelData, filename?: string): void {
  // 生成 JSON 字符串（缩进2）
  const json = JSON.stringify(levelData, null, 2);

  // 生成文件名
  const defaultFilename = `level_${levelData.MapX}x${levelData.MapY}.json`;
  const finalFilename = filename || defaultFilename;

  // 创建 Blob 并下载
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 计算两个相邻格子之间的方向（基于坐标判断）
 * 
 * @param fromIndex 起始格子 index
 * @param toIndex 目标格子 index
 * @param MapX 地图宽度
 * @returns 方向枚举值（1=上，2=下，3=右，4=左，0=无效）
 */
function directionFromTwoIndices(fromIndex: number, toIndex: number, MapX: number): number {
  const pos1 = indexToXY(fromIndex, MapX);
  const pos2 = indexToXY(toIndex, MapX);
  
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  
  // 方向映射（逻辑坐标，左下角原点，y向上）
  if (dx === 0 && dy === 1) {
    return 1; // 上
  } else if (dx === 0 && dy === -1) {
    return 2; // 下
  } else if (dx === 1 && dy === 0) {
    return 3; // 右
  } else if (dx === -1 && dy === 0) {
    return 4; // 左
  }
  
  return 0; // 无效
}

/**
 * 获取方向的反方向
 * 
 * @param dir 方向枚举值（1=上，2=下，3=右，4=左）
 * @returns 反方向枚举值
 */
function oppositeDirection(dir: number): number {
  switch (dir) {
    case 1: // 上
      return 2; // 下
    case 2: // 下
      return 1; // 上
    case 3: // 右
      return 4; // 左
    case 4: // 左
      return 3; // 右
    default:
      return 0; // 无效
  }
}

/**
 * 标准化导入的关卡数据，确保 D 字段和 ColorIdx 字段符合当前编辑器规则
 * 
 * @param levelData 导入的关卡数据
 * @returns 标准化后的关卡数据
 */
function normalizeImportedLevel(levelData: LevelData): LevelData {
  const normalizedRopes = levelData.Rope.map((rope) => {
    // 标准化 D 字段
    let normalizedD = rope.D;
    if (rope.Index.length >= 2) {
      // 计算第一段方向：Index[0] -> Index[1]
      const firstDir = directionFromTwoIndices(rope.Index[0], rope.Index[1], levelData.MapX);
      
      if (firstDir !== 0) {
        // expectedD = opposite(firstDir)
        normalizedD = oppositeDirection(firstDir);
      } else {
        // 如果方向无效，保持原 D 或设为 0
        normalizedD = rope.D >= 1 && rope.D <= 4 ? rope.D : 0;
      }
    } else {
      // 如果 Index.length < 2，保持 D 不变（或设为 0）
      normalizedD = rope.D >= 1 && rope.D <= 4 ? rope.D : 0;
    }
    
    // 标准化 ColorIdx 字段：将旧数据中的 0 或 null/undefined 转换为 -1
    let normalizedColorIdx = rope.ColorIdx;
    if (normalizedColorIdx === 0 || normalizedColorIdx == null) {
      normalizedColorIdx = -1;
    }
    // 若 ColorIdx 已为 -1 或 1~11，保持不变
    
    return {
      ...rope,
      D: normalizedD,
      ColorIdx: normalizedColorIdx,
    };
  });
  
  return {
    ...levelData,
    Rope: normalizedRopes,
  };
}

/**
 * 读取关卡 JSON 文件
 * 
 * @param file 文件对象
 * @returns Promise<LevelData> 解析后的关卡数据
 * @throws 如果文件格式不正确或解析失败
 */
export async function readLevelJson(file: File): Promise<LevelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        // 基础结构校验
        if (typeof data !== 'object' || data === null) {
          reject(new Error('JSON 格式错误：根对象必须是对象'));
          return;
        }

        // 校验 MapX
        if (typeof data.MapX !== 'number' || data.MapX <= 0 || data.MapX > 50) {
          reject(new Error(`MapX 无效：必须是 1~50 之间的数字，当前为 ${data.MapX}`));
          return;
        }

        // 校验 MapY
        if (typeof data.MapY !== 'number' || data.MapY <= 0 || data.MapY > 50) {
          reject(new Error(`MapY 无效：必须是 1~50 之间的数字，当前为 ${data.MapY}`));
          return;
        }

        // 校验 Rope 数组
        if (!Array.isArray(data.Rope)) {
          reject(new Error('JSON 格式错误：Rope 必须是数组'));
          return;
        }

        // 校验每个 Rope 的字段
        data.Rope.forEach((rope: any, index: number) => {
          if (typeof rope !== 'object' || rope === null) {
            reject(new Error(`Rope #${index + 1} 格式错误：必须是对象`));
            return;
          }

          // 检查必需字段
          const requiredFields = ['D', 'H', 'Index', 'BendCount', 'ColorIdx'];
          for (const field of requiredFields) {
            if (!(field in rope)) {
              reject(new Error(`Rope #${index + 1} 缺少必需字段：${field}`));
              return;
            }
          }
          
          // 若旧关卡中包含 IsRandomcolor，直接忽略（不报错）

          // 检查字段类型
          if (typeof rope.D !== 'number') {
            reject(new Error(`Rope #${index + 1} 字段 D 必须是数字`));
            return;
          }
          if (typeof rope.H !== 'number') {
            reject(new Error(`Rope #${index + 1} 字段 H 必须是数字`));
            return;
          }
          if (!Array.isArray(rope.Index)) {
            reject(new Error(`Rope #${index + 1} 字段 Index 必须是数组`));
            return;
          }
          if (typeof rope.BendCount !== 'number') {
            reject(new Error(`Rope #${index + 1} 字段 BendCount 必须是数字`));
            return;
          }
          if (typeof rope.ColorIdx !== 'number') {
            // 若 ColorIdx 缺失，设为 -1（无色）
            rope.ColorIdx = -1;
          }
        });

        // 构造 LevelData 对象
        const levelData: LevelData = {
          MapX: data.MapX,
          MapY: data.MapY,
          Rope: data.Rope.map((rope: any) => ({
            D: rope.D,
            H: rope.H,
            Index: rope.Index,
            BendCount: rope.BendCount,
            ColorIdx: typeof rope.ColorIdx === 'number' ? rope.ColorIdx : -1, // 若缺失则设为 -1
          })),
        };

        // 标准化导入的关卡数据，确保 D 字段符合当前编辑器规则
        const normalizedLevelData = normalizeImportedLevel(levelData);

        resolve(normalizedLevelData);
      } catch (error) {
        if (error instanceof Error) {
          reject(error);
        } else {
          reject(new Error('解析 JSON 文件失败'));
        }
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsText(file);
  });
}

