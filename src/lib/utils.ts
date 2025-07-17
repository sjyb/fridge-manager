import { clsx, type ClassValue } from "clsx"
import { foodCategories } from "@/data/foods";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 获取网络时间
export async function getNetworkTime(): Promise<Date> {
  try {
    const response = await fetch('https://ntp.sjtu.edu.cn/api/time');
    if (!response.ok) throw new Error('Network time unavailable');
    const data = await response.json();
    return new Date(data.utc_datetime);
  } catch (error) {
    console.error('Failed to get network time:', error);
    return new Date(); // 回退到本地时间
  }
}

// 计算剩余天数
export function daysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 格式化日期显示
export function formatExpiryDate(expiryDate: string, showDaysLeft: boolean): string {
  const daysLeft = daysUntilExpiry(expiryDate);
  
  if (showDaysLeft) {
    if (daysLeft < 0) {
      return `已过期${Math.abs(daysLeft)}天`;
    }
    return `剩余${daysLeft}天`;
  }
  
  return new Date(expiryDate).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// 根据食物类型获取默认单位
export function getDefaultUnit(type: string) {
  if (!type) return '个';
  
  // 从foodCategories中查找该类型的默认单位
  const defaultUnit = foodCategories
    .flatMap(c => c.subCategories?.flatMap(sc => sc.types) || [])
    .find(t => t.value === type)?.defaultUnit;
  
  // 特殊处理特定类型
  if (['milk', 'yogurt'].includes(type)) {
    return '瓶';
  }
  if (['egg'].includes(type)) {
    return '颗';
  }
  if (['beef-raw', 'pork-raw', 'chicken-raw', 'fish-raw'].includes(type)) {
    return '斤';
  }
  
  return defaultUnit || '个';
}

// 根据食物类型和存储位置获取默认保质期天数
export function getDefaultExpiryDays(type: string, position: 'fridge' | 'freezer' | 'thawing' = 'fridge') {
  if (!type) return 7;
  
  const foodType = foodCategories
    .flatMap(c => c.subCategories?.flatMap(sc => sc.types) || [])
    .find(t => t.value === type);
  
  if (!foodType?.defaultExpiryDays) return 7;
  
  // 冷冻条件下的保质期
  if (position === 'freezer' && foodType.defaultExpiryDays.freezer) {
    return foodType.defaultExpiryDays.freezer;
  }
  
  // 解冻条件下的保质期（使用冷冻保质期的2/3）
  if (position === 'thawing') {
    if (foodType.defaultExpiryDays.freezer) {
      return Math.floor(foodType.defaultExpiryDays.freezer * 2 / 3);
    }
    return foodType.defaultExpiryDays.fridge || 7;
  }
  
  // 默认返回冷藏保质期
  return foodType.defaultExpiryDays.fridge || 7;
}


// 计算默认保质期日期
export function calculateDefaultExpiryDate(type: string, position: 'fridge' | 'freezer' | 'thawing' = 'fridge') {
  if (!type) return '';
  
  const days = getDefaultExpiryDays(type, position);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}