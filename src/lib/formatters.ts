export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatMemoryMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`;
  return `${mb} MB`;
}

export function memoryUsedPercent(totalMB: number, freeMB: number): number {
  if (totalMB === 0) return 0;
  return Math.round(((totalMB - freeMB) / totalMB) * 100);
}

export function bytesToTB(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 TB';
  return `${(bytes / Math.pow(1024, 4)).toFixed(decimals)} TB`;
}

// Parsea strings como "3.57 TB", "193.00 MB", "4.00 GB" → número en GB
export function parseSizeGB(sizeStr: string): number {
  const match = sizeStr.trim().match(/^([\d.,]+)\s*(B|KB|MB|GB|TB)/i);
  if (!match) return 0;
  const value = parseFloat(match[1].replace(',', '.'));
  const unit = match[2].toUpperCase();
  switch (unit) {
    case 'TB': return value * 1024;
    case 'GB': return value;
    case 'MB': return value / 1024;
    case 'KB': return value / (1024 * 1024);
    default:   return value / (1024 * 1024 * 1024);
  }
}
