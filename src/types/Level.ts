/**
 * 关卡编辑器 - 类型定义模块
 * 
 * 职责：定义关卡编辑器的核心数据结构
 * 
 * 输入：无
 * 输出：导出的类型定义供其他模块使用
 */

/**
 * 瓦片类型枚举
 * 定义关卡中每个格子可以是什么类型
 */
export enum TileType {
  EMPTY = 'EMPTY',      // 空地
  WALL = 'WALL',        // 墙壁
  START = 'START',      // 起点
  END = 'END',          // 终点
  // 后续可以扩展更多类型
}

/**
 * 单个瓦片数据
 */
export interface Tile {
  type: TileType;
  x: number;
  y: number;
}

/**
 * 关卡数据结构
 * 代表一个完整的关卡配置
 */
export interface Level {
  id: string;           // 关卡ID，如 "level_001"
  name: string;         // 关卡名称
  width: number;        // 关卡宽度（格子数）
  height: number;       // 关卡高度（格子数）
  tiles: Tile[][];      // 二维数组，存储每个格子的数据
}

/**
 * 关卡导入导出结构
 * 用于序列化和反序列化关卡数据
 */
export interface LevelIO {
  version: string;      // 数据格式版本
  level: Level;         // 关卡数据
  metadata?: {          // 可选的元数据
    createdAt?: string;
    updatedAt?: string;
    author?: string;
  };
}

/**
 * Rope 数据结构
 * 用于定义关卡中的绳索/路径数据
 */
export interface RopeData {
  D: number;              // 方向（最终朝向，1=上，2=下，3=右，4=左，0=无效）
  H: number;              // 终点（Index[Index.length - 1] 或 0）
  Index: number[];        // 路径索引数组（按点击顺序）
  BendCount: number;      // 拐弯次数
  ColorIdx: number;       // 颜色索引（-1=无颜色，1~10=颜色池中的颜色）
}

/**
 * 关卡数据（最终 JSON 格式）
 * 使用 MapX、MapY 和 Rope 数组
 */
export interface LevelData {
  MapX: number;         // 地图宽度（1~50）
  MapY: number;         // 地图高度（1~50）
  Rope: RopeData[];     // 绳索数据数组
}

