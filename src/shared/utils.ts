/**
 * 共享工具模块 - 通用工具函数
 * 
 * 职责：提供通用的工具函数，供各个模块使用
 * 
 * 输入：根据具体函数而定
 * 输出：根据具体函数而定
 */

/**
 * 格式化 JSON 字符串，用于预览
 */
export function formatJSON(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 清洗文件名：去掉非法字符，确保可作为文件名使用
 * 
 * @param fileName 原始文件名
 * @returns 清洗后的文件名，如果结果为空则返回 "level"
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return 'level';
  
  // 去掉首尾空格
  let cleaned = fileName.trim();
  
  // 替换非法字符为下划线：/ \ : * ? " < > |
  cleaned = cleaned.replace(/[\\/:*?"<>|]+/g, '_');
  
  // 合并连续的下划线（可选，让文件名更整洁）
  cleaned = cleaned.replace(/_+/g, '_');
  
  // 去掉首尾的下划线
  cleaned = cleaned.replace(/^_+|_+$/g, '');
  
  // 如果结果为空，返回默认值
  return cleaned || 'level';
}