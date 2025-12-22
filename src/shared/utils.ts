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

