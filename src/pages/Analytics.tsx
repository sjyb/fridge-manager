import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { foodCategories } from '@/data/foods';
import { useFoods } from '@/hooks/useFoods';
import { formatExpiryDate } from '@/lib/utils';

interface ConsumptionData {
  date: string;
  consumed: number;
  wasted: number;
}

interface ShoppingSuggestion {
  category: string;
  items: string[];
  completed: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// 辅助函数定义
const getMonthRange = (year: number, month: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return { startDate, endDate };
};

export const filterLogsByDate = (logs: any[], timeRange: '3days' | 'week' | 'month' | 'custom', year?: number, month?: number) => {
  if (!logs || logs.length === 0) return [];
  
  let startDate: Date, endDate: Date;
  
  if (timeRange === 'custom' && year && month) {
    const range = getMonthRange(year, month);
    startDate = range.startDate;
    endDate = range.endDate;
  } else {
    const days = timeRange === '3days' ? 3 : timeRange === 'week' ? 7 : 30;
    endDate = new Date();
    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days + 1);
  }

  return logs.filter(log => {
    try {
      const logDate = new Date(log.date);
      const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      return logDateOnly >= startDateOnly && logDateOnly <= endDateOnly;
    } catch (e) {
      console.error('Invalid log date format:', log.date);
      return false;
    }
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const analyzeConsumption = (logs: any[], timeRange: string, year?: number, month?: number) => {
  const data: Record<string, { consumed: number; wasted: number }> = {};
  
  logs.forEach(log => {
    let dateKey: string;
    
    if (timeRange === 'month' || (year && month)) {
      // 按月统计时使用"年-月"格式
      const date = new Date(log.date);
      dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    } else {
      // 其他情况使用"月-日"格式
      dateKey = formatExpiryDate(log.date, true).split(' ')[0];
    }
    
    if (!data[dateKey]) {
      data[dateKey] = { consumed: 0, wasted: 0 };
    }
    
    if (log.action === '食用') {
      data[dateKey].consumed += log.quantity || 0;
    } else if (log.action === '删除') {
      data[dateKey].wasted += log.quantity || 0;
    }
  });
  
  return Object.entries(data)
    .map(([date, values]) => ({
      date,
      consumed: values.consumed,
      wasted: values.wasted
    }))
    .sort((a, b) => {
      if (timeRange === 'month' || (year && month)) {
        // 按月排序
        return a.date.localeCompare(b.date);
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
};

// 生成分类统计数据
const generateCategoryStats = (logs: any[]) => {
  const categoryMap: Record<string, number> = {};
  
  logs.forEach(log => {
    if (log.action !== '食用' && log.action !== '删除') return;
    
    const category = foodCategories.find(c => 
      c.subCategories.some(sc => 
        sc.types.some(t => t.label === log.food)
      )
    )?.category || '其他';
    
    categoryMap[category] = (categoryMap[category] || 0) + (log.quantity || 0);
  });
  
  return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
};

// 生成购物建议
export const generateShoppingSuggestions = (logs: any[]) => {
  const suggestions: ShoppingSuggestion[] = [];
  // 实现购物建议生成逻辑
  return suggestions;
};

// 计算浪费比例
const generateWasteRatio = (logs: any[]) => {
  let total = 0;
  let wasted = 0;
  
  logs.forEach(log => {
    if (log.action === '食用') {
      total += log.quantity || 0;
    } else if (log.action === '删除') {
      total += log.quantity || 0;
      wasted += log.quantity || 0;
    }
  });
  
  return total > 0 ? wasted / total : 0;
};

// 检查是否有足够数据
const hasEnoughData = (logs: any[], minDays: number) => {
  const uniqueDays = new Set(logs.map(log => new Date(log.date).toDateString()));
  return uniqueDays.size >= minDays;
};

// 主组件
export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'3days' | 'week' | 'month'>('week');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showYearMonthPicker, setShowYearMonthPicker] = useState(false);
  const { logs, loadLogs, isLoading } = useFoods();
  const [dataLoading, setDataLoading] = useState(true);
  
  // 生成年份选项（当前年份前后5年）
  const yearOptions = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadLogs();
      } catch (error) {
        console.error('刷新数据失败:', error);
        toast.error('加载日志数据失败');
      }
    };
    fetchData();
    
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    setDataLoading(true);
    const result = filterLogsByDate(
      logs, 
      showYearMonthPicker ? 'custom' : timeRange,
      showYearMonthPicker ? selectedYear : undefined,
      showYearMonthPicker ? selectedMonth : undefined
    );
    setDataLoading(false);
    return result;
  }, [logs, timeRange, showYearMonthPicker, selectedYear, selectedMonth]);

  const consumptionData = useMemo(() => analyzeConsumption(filteredLogs, timeRange, selectedYear, selectedMonth), [filteredLogs, timeRange, selectedYear, selectedMonth]);
  const categoryStats = useMemo(() => generateCategoryStats(filteredLogs), [filteredLogs]);
  const shoppingSuggestions = useMemo(() => generateShoppingSuggestions(filteredLogs), [filteredLogs]);
  const wasteRatio = useMemo(() => generateWasteRatio(filteredLogs), [filteredLogs]);

  const enoughData = hasEnoughData(filteredLogs, timeRange === '3days' ? 3 : timeRange === 'week' ? 7 : 30);

  return (
    <div className="relative min-h-[calc(100vh-80px)] pb-24 w-full px-4 md:px-6 lg:px-8 overflow-y-auto">
      <h1 className="text-2xl font-bold text-center py-4 text-blue-500">统计分析</h1>
      
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <div className="bg-blue-50 p-1 rounded-lg">
          <button
            onClick={() => {
              setTimeRange('3days');
              setShowYearMonthPicker(false);
            }}
            className={`px-3 py-1 rounded-md ${timeRange === '3days' && !showYearMonthPicker ? 'bg-blue-500 text-white' : 'text-blue-500'}`}
          >
            近日
          </button>
          <button
            onClick={() => {
              setTimeRange('week');
              setShowYearMonthPicker(false);
            }}
            className={`px-3 py-1 rounded-md ${timeRange === 'week' && !showYearMonthPicker ? 'bg-blue-500 text-white' : 'text-blue-500'}`}
          >
            本周
          </button>
          <button
            onClick={() => {
              setTimeRange('month');
              setShowYearMonthPicker(false);
            }}
            className={`px-3 py-1 rounded-md ${timeRange === 'month' && !showYearMonthPicker ? 'bg-blue-500 text-white' : 'text-blue-500'}`}
          >
            本月
          </button>
        </div>
        
        <button
          onClick={() => {
            setShowYearMonthPicker(!showYearMonthPicker);
            if (!showYearMonthPicker) {
              setTimeRange('month');
            }
          }}
          className={`px-3 py-1 rounded-md ${showYearMonthPicker ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-500'}`}
        >
          选择年月
        </button>
        
        {showYearMonthPicker && (
          <div className="flex space-x-2 bg-blue-50 p-1 rounded-lg">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2 py-1 rounded-md bg-white"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-2 py-1 rounded-md bg-white"
            >
              {monthOptions.map(month => (
                <option key={month} value={month}>{month}月</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {consumptionData.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <h2 className="text-lg font-medium mb-2">食物消耗趋势</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="consumed" stroke="#5D9CEC" strokeWidth={2} name="已消耗" />
                <Line type="monotone" dataKey="wasted" stroke="#FF6B6B" strokeWidth={2} name="已浪费" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {categoryStats.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <h2 className="text-lg font-medium mb-2">分类消耗统计</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#5D9CEC" name="消耗数量" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}


