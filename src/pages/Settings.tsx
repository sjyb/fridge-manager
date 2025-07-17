import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { getNetworkTime } from '@/lib/utils';
import { useFoods } from '@/hooks/useFoods';
import { filterLogsByDate, generateShoppingSuggestions } from '@/pages/Analytics';
import { foodCategories, seasonalRecommendations } from '@/data/foods';

// Mock data
const mockShoppingSuggestions = [
  {
    category: '乳制品',
    items: ['牛奶', '酸奶'],
    completed: false
  },
  {
    category: '水果',
    items: ['苹果', '香蕉'],
    completed: false
  }
];

const seasonalFoods = {
  spring: [
    { category: '春季蔬菜', items: ['菠菜', '芦笋'], tip: '富含维生素A和C' },
    { category: '春季水果', items: ['草莓', '樱桃'], tip: '富含抗氧化剂' }
  ],
  summer: [
    { category: '夏季蔬菜', items: ['黄瓜', '西红柿'], tip: '水分含量高' },
    { category: '夏季水果', items: ['西瓜', '桃子'], tip: '清凉解暑' }
  ],
  autumn: [
    { category: '秋季蔬菜', items: ['南瓜', '红薯'], tip: '富含膳食纤维' },
    { category: '秋季水果', items: ['苹果', '梨'], tip: '润肺止咳' }
  ],
  winter: [
    { category: '冬季蔬菜', items: ['白菜', '萝卜'], tip: '耐储存' },
    { category: '冬季水果', items: ['橙子', '柚子'], tip: '富含维生素C' }
  ]
};

// 冰箱区域配置选项
const zoneOptions = [
  { value: 'fridge', label: '仅冷藏' },
  { value: 'freezer', label: '仅冷冻' },
  { value: 'fridge+thawing', label: '冷藏+解冻' },
  { value: 'fridge+freezer', label: '冷藏+冷冻' },
  { value: 'thawing+freezer', label: '解冻+冷冻' },
  { value: 'all', label: '冷藏+解冻+冷冻' }
];

// 从操作日志生成分类统计
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

export default function Settings() {
  const [showZoneSettings, setShowZoneSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [zoneConfig, setZoneConfig] = useState('all');
  const [timeRange, setTimeRange] = useState<'3days' | 'week' | 'month'>('week');
  const [suggestions, setSuggestions] = useState(mockShoppingSuggestions);
  const [logs, setLogs] = useState<Array<{action: string, food: string, quantity: number, unit: string, date: string}>>([]);
  const [currentSeason, setCurrentSeason] = useState('summer');

  // 初始化设置
  useEffect(() => {
    const savedConfig = localStorage.getItem('fridgeZoneConfig');
    if (!savedConfig) {
      // 如果是首次初始化，显示功能区设置
      setShowZoneSettings(true);
    } else {
      setZoneConfig(savedConfig);
    }
    
    // 获取操作日志
    const savedLogs = localStorage.getItem('foodLogs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }

    // 判断当前季节
    const month = new Date().getMonth();
    setCurrentSeason(
      month >= 2 && month <= 4 ? 'spring' :
      month >= 5 && month <= 7 ? 'summer' :
      month >= 8 && month <= 10 ? 'autumn' : 'winter'
    );


  }, []);



  // 保存区域配置
  const saveZoneConfig = async (value: string) => {
    if (zoneConfig !== value) {
      if (confirm(`确定要将冰箱功能区从${zoneOptions.find(o => o.value === zoneConfig)?.label}更改为${zoneOptions.find(o => o.value === value)?.label}吗？这将重置所有食物数据！`)) {
        try {
          // 清空数据库
          const response = await fetch('/api/db.php', {
            method: 'DELETE'
          });
          
          if (!response.ok) throw new Error('清空数据库失败');
          
          setZoneConfig(value);
          localStorage.setItem('fridgeZoneConfig', value);
          // 重置所有相关数据
          localStorage.removeItem('foods_cache');
          localStorage.removeItem('foodLogs');
          setLogs([]);
          toast.success('冰箱功能区已更改，所有数据已重置');
          // 触发全局状态更新
          setTimeout(() => window.dispatchEvent(new Event('zoneConfigChanged')), 300);
        } catch (error) {
          toast.error('重置数据失败，请重试');
          console.error('重置数据失败:', error);
        }
      }
    } else {
      setZoneConfig(value);
      localStorage.setItem('fridgeZoneConfig', value);
      toast.success('冰箱区域设置已保存');
      // 触发全局状态更新
      setTimeout(() => window.dispatchEvent(new Event('zoneConfigChanged')), 300);
    }
  };

  // 重置冰箱数据
  const resetFridge = async () => {
    if (confirm('确定要重置冰箱数据吗？所有食物记录将被清空！')) {
      try {
        // 清空数据库
        const response = await fetch('/api/db.php', {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('清空数据库失败');
        
        // 清除所有本地数据
        localStorage.removeItem('foods_cache');
        localStorage.removeItem('foodLogs');
        localStorage.removeItem('fridgeZoneConfig');
        localStorage.removeItem('expiryDisplayMode');
        
        // 重置状态
        setLogs([]);
        setZoneConfig('all');
        setSuggestions(mockShoppingSuggestions);
        setShowZoneSettings(true); // 显示功能区设置
        
        // 重新初始化数据库
        await fetch('/api/db.php', { method: 'POST', body: JSON.stringify([]) });
        
        toast.success('冰箱数据已重置，数据库已重新初始化');
        // 触发全局状态更新
        setTimeout(() => window.dispatchEvent(new Event('zoneConfigChanged')), 300);
      } catch (error) {
        toast.error('重置数据失败，请重试');
        console.error('重置数据失败:', error);
      }
    }
  };

  // 根据时间范围筛选真实数据
  const filteredData = useMemo(() => {
    const days = timeRange === '3days' ? 3 : timeRange === 'week' ? 7 : 30;
    return filterLogsByDate(logs, days);
  }, [logs, timeRange]);

  return (
    <div className="relative min-h-[calc(100vh-80px)] pb-24 w-full px-4 md:px-6 lg:px-8 overflow-y-auto">
      <h1 className="text-2xl font-bold text-center py-4 text-blue-500">系统设置</h1>
      
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 ${activeTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        >
          冰箱设置
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 ${activeTab === 'logs' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        >
          操作日志
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 ${activeTab === 'stats' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        >
          统计分析
        </button>
        <button
          onClick={() => setActiveTab('diet')}
          className={`px-4 py-2 ${activeTab === 'diet' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
        >
          膳食推荐
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
          {showZoneSettings ? (
            <>
              <h2 className="text-lg font-medium mb-4">冰箱功能区设置</h2>
              
              <div className="space-y-3 mb-6">
                {zoneOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setZoneConfig(option.value)}
                    className={`w-full p-3 rounded-lg text-left flex items-center ${
                      zoneConfig === option.value 
                        ? 'bg-blue-50 border border-blue-300' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center mr-3 ${
                      zoneConfig === option.value 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {zoneConfig === option.value && (
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="flex-1">{option.label}</span>
                    {zoneConfig === option.value && (
                      <i className="fa-solid fa-check text-blue-500"></i>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    saveZoneConfig(zoneConfig);
                    setShowZoneSettings(false);
                  }}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  确认设置
                </button>
                <button
                  onClick={resetFridge}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  重置数据
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center bg-blue-50 text-blue-600 px-4 py-2 rounded-full">
                <i className="fa-solid fa-check-circle mr-2"></i>
                <span>当前冰箱功能区已设置完成</span>
              </div>
              
              {/* 本地时间显示 */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center justify-between">
                  <span>时间来源: 设备本地时间</span>
                </div>
                <div className="mt-1 text-gray-500">
                  当前时间: {new Date().toLocaleString('zh-CN')}
                </div>
              </div>
              
              <button
                onClick={() => setShowZoneSettings(true)}
                className="mt-4 w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                修改功能区设置
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="text-lg font-medium mb-3">操作记录</h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              onClick={() => {
                try {
                  const logs = JSON.parse(localStorage.getItem('foodLogs') || '[]');
                  setLogs(logs.sort((a: any, b: any) => 
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  ));
                  toast.success('已加载全部记录');
                } catch (error) {
                  console.error(error);
                  toast.error('获取全部记录失败');
                }
              }}
              className="flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              <i className="fa-solid fa-list mr-1"></i>
              全部记录
            </button>
            
            <div className="relative group">
              <button className="flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors">
                <i className="fa-solid fa-calendar mr-1"></i>
                时间范围
                <i className="fa-solid fa-chevron-down ml-1 text-xs"></i>
              </button>
              
              <div className="absolute z-10 hidden group-hover:block bg-white shadow-lg rounded-lg p-1 w-40 mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const threeDaysAgo = new Date();
                    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                    const filteredLogs = logs.filter((log: any) => new Date(log.date) >= threeDaysAgo);
                    setLogs(filteredLogs);
                    toast('已显示最近三天记录');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded"
                >
                  <i className="fa-solid fa-calendar-day mr-2"></i>
                  最近三天
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    const filteredLogs = logs.filter((log: any) => new Date(log.date) >= oneWeekAgo);
                    setLogs(filteredLogs);
                    toast('已显示最近一周记录');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded"
                >
                  <i className="fa-solid fa-calendar-week mr-2"></i>
                  最近一周
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    const filteredLogs = logs.filter((log: any) => new Date(log.date) >= oneMonthAgo);
                    setLogs(filteredLogs);
                    toast('已显示最近一月记录');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded"
                >
                  <i className="fa-solid fa-calendar mr-2"></i>
                  最近一月
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const sixMonthsAgo = new Date();
                    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                    const filteredLogs = logs.filter((log: any) => new Date(log.date) >= sixMonthsAgo);
                    setLogs(filteredLogs);
                    toast('已显示最近半年记录');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded"
                >
                  <i className="fa-solid fa-calendar-alt mr-2"></i>
                  最近半年
                </button>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLogs([]);
                toast('已清空所有记录');
              }}
              className="flex items-center px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors"
            >
              <i className="fa-solid fa-trash-alt mr-1"></i>
              清空所有
            </button>
          </div>
          
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-clipboard-list text-4xl text-gray-300 mb-2"></i>
              <p className="text-gray-500">暂无操作记录</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className={`p-2 rounded-lg shadow-sm ${
                  log.action === '添加' ? 'bg-blue-50 border border-blue-200' : 
                  log.action === '食用' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          log.action === '添加' ? 'bg-blue-100 text-blue-800' : 
                          log.action === '食用' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.action === '添加' && <i className="fa-solid fa-plus mr-1"></i>}
                          {log.action === '食用' && <i className="fa-solid fa-utensils mr-1"></i>}
                          {log.action === '删除' && <i className="fa-solid fa-trash mr-1"></i>}
                          {log.action}
                        </span>
                        {log.consumedRatio && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">
                            {log.consumedRatio}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex justify-between items-center">
                        <p className="text-xs">
                          <span className="font-medium">{log.food}</span> {log.quantity}{log.unit}
                          {log.remainingAmount !== undefined && (
                            <span className="ml-1 text-gray-500">剩余: {log.remainingAmount}{log.unit}</span>
                          )}
                        </p>
                        <div className="flex items-center space-x-1">
                          {log.position && (
                            <span className="px-1 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                              {log.position === 'fridge' ? '冷藏' : 
                               log.position === 'freezer' ? '冷冻' : '解冻'}
                            </span>
                          )}
                          <span className="text-gray-500 text-[10px]">
                            {new Date(log.date).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <>
          <div className="flex justify-center mb-4">
            <div className="bg-blue-50 p-1 rounded-lg">
              <button
                onClick={() => setTimeRange('3days')}
                className={`px-3 py-1 rounded-md ${timeRange === '3days' ? 'bg-blue-500 text-white' : 'text-blue-500'}`}
              >
                近日
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 rounded-md ${timeRange === 'week' ? 'bg-blue-500 text-white' : 'text-blue-500'}`}
              >
                本周
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 rounded-md ${timeRange === 'month' ? 'bg-blue-500 text-white' : 'text-blue-500'}`}
              >
                本月
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <h2 className="text-lg font-medium mb-2">食物消耗趋势</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData}>
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

<div className="bg-white p-4 rounded-xl shadow-sm mb-4">
  <h2 className="text-lg font-medium mb-2">分类消耗统计</h2>
  <div className="h-48">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={generateCategoryStats(logs)}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#5D9CEC" name="消耗数量" />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>

           <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
             <h2 className="text-lg font-medium mb-2">采购建议</h2>
             {logs.length > 0 ? (
               <div className="space-y-3">
                 {generateShoppingSuggestions(logs).map((suggestion, index) => (
                   <div key={suggestion.category} className="p-3 bg-gray-50 rounded-lg">
                     <h3 className="font-medium text-blue-500">{suggestion.category}</h3>
                     <ul className="list-disc list-inside mt-1">
                       {suggestion.items.map(item => (
                         <li key={item} className="text-sm">{item}</li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-4 text-gray-500">
                 <i className="fa-solid fa-info-circle mr-2"></i>
                 暂无足够数据生成采购建议
               </div>
             )}
           </div>
        </>
      )}

       {activeTab === 'diet' && (
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="text-lg font-medium mb-3 flex items-center">
            <i className={`fa-solid ${
              currentSeason === 'spring' ? 'fa-seedling text-green-500' :
              currentSeason === 'summer' ? 'fa-sun text-blue-500' :
              currentSeason === 'autumn' ? 'fa-leaf text-orange-500' : 'fa-snowflake text-gray-400'
            } mr-2`}></i>
            季节推荐 ({currentSeason === 'spring' ? '春季' : 
            currentSeason === 'summer' ? '夏季' : 
            currentSeason === 'autumn' ? '秋季' : '冬季'})
          </h2>
          
          <div className="space-y-4">
            {seasonalRecommendations
              .find(r => r.season === currentSeason)?.meals.map((meal, index) => (
                <div key={index} className={`p-4 rounded-lg ${
                  currentSeason === 'spring' ? 'bg-green-50 border border-green-100' :
                  currentSeason === 'summer' ? 'bg-blue-50 border border-blue-100' :
                  currentSeason === 'autumn' ? 'bg-orange-50 border border-orange-100' : 'bg-gray-50 border border-gray-100'
                }`}>
                  <h3 className="font-medium flex items-center">
                    <i className={`fa-solid ${
                      meal.type === 'breakfast' ? 'fa-sun text-yellow-500' :
                      meal.type === 'lunch' ? 'fa-utensils text-red-500' : 'fa-moon text-blue-500'
                    } mr-2`}></i>
                    {meal.name}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {meal.items.map((item, idx) => (
                      <div key={idx} className="pl-4">
                        <p className="font-medium">{item.name}</p>
                        {item.ingredients.length > 0 && (
                          <p className="text-sm text-gray-600">
                            食材: {item.ingredients.join('、')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-600">膳食指南建议</h3>
            <ul className="list-disc list-inside mt-1 pl-2 text-sm">
              <li>每天摄入300-500克蔬菜</li>
              <li>每天摄入200-350克水果</li>
              <li>适量摄入优质蛋白质</li>
              <li>控制油盐摄入量</li>
            </ul>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}