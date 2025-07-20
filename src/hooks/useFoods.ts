import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_FOODS } from '@/data/foods';
import { FoodItem } from '@/types/food';
import { toast } from 'sonner';

interface FoodLog {
  action: string;
  food: string;
  quantity: number;
  unit: string;
  date: string;
  consumedRatio?: string; // 新增：食用比例(1/4,1/2,3/4,全部)
  remainingAmount?: number; // 新增：剩余数量
  position?: string;
  initialQuantity?: number;
}

const DB_FILE_PATH = '/fridge.db';
const CACHE_KEY = 'foods_cache';
const ZONE_CONFIG_KEY = 'fridge_zone_config';
const LOGS_CACHE_KEY = 'food_logs_cache';

export function useFoods() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionHistory, setActionHistory] = useState<{action: string, data: FoodItem[]}[]>([]);
  const [zoneConfig, setZoneConfig] = useState<string>(() => {
    return localStorage.getItem('fridgeZoneConfig') || 'all';
  });


  const logAction = useCallback(async (action: string, food: FoodItem, consumedRatio?: string, consumedAmount?: number, remainingAmount?: number) => {
    const newLog: FoodLog = {
      action,
      food: food.name,
      quantity: consumedAmount !== undefined ? consumedAmount : food.quantity,
      unit: food.unit,
      date: new Date().toISOString(),
      position: food.position,
      ...(consumedRatio && { consumedRatio }),
      ...(remainingAmount !== undefined && { remainingAmount }),
      initialQuantity: food.initialQuantity || food.quantity
    };

    try {
      // 写入数据库
      const response = await fetch('/api/db.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newLog)
      });
      
      // 检查响应状态
      if (!response.ok) {
        // 尝试解析错误响应
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || '保存日志失败');
        } catch (jsonError) {
          // 如果JSON解析失败，读取原始响应文本
          const text = await response.text();
          throw new Error(`服务器错误: ${text.slice(0, 100)}`);
        }
      }
      
      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.warn('非JSON响应:', text.slice(0, 200));
      }
      
      // 同时更新本地缓存
      const logs = JSON.parse(localStorage.getItem('foodLogs') || '[]');
      logs.unshift(newLog);
      localStorage.setItem('foodLogs', JSON.stringify(logs.slice(0, 100)));
    } catch (error) {
      console.error('保存操作日志失败:', {
        error: error.message,
        action,
        food: food.name,
        time: new Date().toISOString()
      });
      toast.error(`保存操作日志失败: ${error.message.replace(/<\/?[^>]+(>|$)/g, "")}`);
      // 回退到本地存储
      const logs = JSON.parse(localStorage.getItem('foodLogs') || '[]');
      logs.unshift(newLog);
      localStorage.setItem('foodLogs', JSON.stringify(logs.slice(0, 100)));
    }
  }, []);

  // 从本地数据库加载数据
  const loadFoods = useCallback(async (retryCount = 0) => {
    try {
      // 优先从缓存读取
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setFoods(parsedData);
        setError(null);
        return parsedData;
      }

// 从API加载数据 - 添加错误处理和兼容性处理
let response;
try {
  response = await fetch('/api/foods');
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
} catch (error) {
  console.error('Fetch failed, falling back to XMLHttpRequest:', error);
  // 为不支持fetch的浏览器提供XMLHttpRequest回退
  response = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/foods');
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          ok: true,
          json: () => Promise.resolve(JSON.parse(xhr.responseText))
        });
      } else {
        reject(new Error(`HTTP error! status: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send();
  });
}

const result = await response.json();

// 检查是否返回了数据库状态信息
if (result.database) {

  console.log(`当前使用数据库: ${result.database}`);
  
  // 如果使用SQLite，显示通知
  if (result.database === 'sqlite') {
    toast.info('当前使用本地数据库模式', {
      position: 'bottom-center',
      duration: 5000
    });
  }
}

const data = result.data || result;
const finalFoods = data.length ? data : DEFAULT_FOODS;

// 批量更新状态
requestAnimationFrame(() => {
  setFoods(finalFoods);
  setError(null);
  localStorage.setItem(CACHE_KEY, JSON.stringify(finalFoods));
});

return finalFoods;
    } catch (error) {
      console.error('加载食物数据失败:', error);
      if (retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return loadFoods(retryCount + 1);
      }
      requestAnimationFrame(() => {
        setError('使用本地数据');
        setFoods(DEFAULT_FOODS);
      });
      return DEFAULT_FOODS;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存数据到本地数据库和缓存
  const saveFoods = useCallback(async (newFoods: FoodItem[]) => {
    try {
      // 保存历史记录用于撤销
      setActionHistory(prev => [...prev.slice(-4), {action: 'update', data: foods}]);
      
      // 更新本地缓存
      localStorage.setItem(CACHE_KEY, JSON.stringify(newFoods));
      
      // 保存到本地数据库
      const response = await fetch('/api/db.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(newFoods)
      });
      if (!response.ok) throw new Error('Failed to save foods');
      
      return newFoods;
    } catch (error) {
      console.error('保存食物数据失败:', error);
      toast.error('保存数据失败', {
        position: 'bottom-center',
        duration: 3000,
        style: {bottom: '80px'}
      });
      throw error;
    }
  }, [foods]);

  // 撤销操作
  const undoAction = useCallback(async () => {
    if (actionHistory.length === 0) return;
    
    const lastAction = actionHistory[actionHistory.length - 1];
    if (lastAction.action === 'update') {
      await saveFoods(lastAction.data);
      setActionHistory(prev => prev.slice(0, -1));
      toast.success('撤销成功');
    }
  }, [actionHistory, saveFoods]);

  // 减少食物数量（带防抖）
  const decreaseQuantity = useCallback(async (id: string, amount = 1) => {
    const food = foods.find(f => f.id === id);
    if (!food) return;

    // 防抖处理
    const lastAction = actionHistory[actionHistory.length - 1];
    if (lastAction && lastAction.action === 'decrease' && lastAction.id === id) {
      const now = Date.now();
      if (now - lastAction.timestamp < 500) {
        return;
      }
    }

    const updatedFoods = foods.map(food => {
      if (food.id === id) {
        const newQuantity = Math.round((food.quantity - amount) * 100) / 100;
        return {...food, quantity: Math.max(0, newQuantity)};
      }
      return food;
    }).filter(food => food.quantity > 0);
    
    await saveFoods(updatedFoods);
    setFoods(updatedFoods);
    setActionHistory(prev => [...prev.slice(-4), {action: 'decrease', id, timestamp: Date.now()}]);
  }, [foods, saveFoods, actionHistory]);

  // 初始化加载数据
  useEffect(() => {
    const loadConfig = () => {
      const savedConfig = localStorage.getItem(ZONE_CONFIG_KEY);
      if (savedConfig) {
        setZoneConfig(savedConfig);
      }
    };
    loadConfig();
    loadFoods();
  }, [loadFoods]);

  const saveZoneConfig = (config: string) => {
    setZoneConfig(config);
    localStorage.setItem(ZONE_CONFIG_KEY, config);
    // 强制重新加载食物数据
    loadFoods();
    // 触发全局配置更新事件
    window.dispatchEvent(new CustomEvent('zoneConfigChanged', {
      detail: { config }
    }));
  };

  // 从数据库加载日志数据
  const loadLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/db.php');
      if (!response.ok) throw new Error('Failed to load logs');
      
      const data = await response.json();
      // 确保数据是数组格式
      const logsData = Array.isArray(data) ? data : [];
      setLogs(logsData);
      localStorage.setItem(LOGS_CACHE_KEY, JSON.stringify(logsData));
      return logsData;
    } catch (error) {
      console.error('加载日志数据失败:', error);
      const cachedLogs = localStorage.getItem(LOGS_CACHE_KEY);
      if (cachedLogs) {
        const parsedLogs = JSON.parse(cachedLogs);
        setLogs(Array.isArray(parsedLogs) ? parsedLogs : []);
        return parsedLogs;
      }
      return [];
    }
  }, []);

  return {
    foods,
    setFoods: saveFoods,
    zoneConfig,
    setZoneConfig: saveZoneConfig,
    logs,
    loadLogs,
    addFoods: async (newFoods: FoodItem[]) => {
      let updatedFoods = [...foods];
      
      for (const newFood of newFoods) {
        // 检查是否已有相同名称和保质期的食物
        const existingIndex = updatedFoods.findIndex(f => 
          f.name === newFood.name && f.expiryDate === newFood.expiryDate
        );
        
        if (existingIndex >= 0) {
          // 合并数量
          updatedFoods[existingIndex] = {
            ...updatedFoods[existingIndex],
            quantity: updatedFoods[existingIndex].quantity + newFood.quantity,
            initialQuantity: updatedFoods[existingIndex].initialQuantity + (newFood.initialQuantity || newFood.quantity)
          };
        } else {
          // 添加新食物
          updatedFoods.push({
            ...newFood,
            unit: newFood.unit,
            initialQuantity: newFood.initialQuantity || newFood.quantity
          });
        }
      }
      
      setFoods(updatedFoods);
      await saveFoods(updatedFoods);
      toast.success('食物添加成功');
      return updatedFoods;
    },
    deleteFood: async (id: string) => {
      const updatedFoods = foods.filter(food => food.id !== id);
      setFoods(updatedFoods);
      await saveFoods(updatedFoods);
      toast.success('食物已删除');
      return updatedFoods;
    },
    decreaseQuantity,
    undoAction,
    isLoading,
    error,
    loadFoods,
    logAction
};


}