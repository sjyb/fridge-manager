import { useState, useEffect } from 'react';
import { FoodItem } from '@/types/food';
import { getDefaultUnit } from '@/lib/utils';
import { mockFoods } from '@/data/foods';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { daysUntilExpiry, formatExpiryDate } from '@/lib/utils';
import { useFoods } from '@/hooks/useFoods';



export default function ExpiryManagement() {
  const { foods, deleteFood, decreaseQuantity, setFoods, logAction } = useFoods();
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});
  const [showDaysLeft, setShowDaysLeft] = useState(() => {
    const saved = localStorage.getItem('expiryDisplayMode');
    return saved ? saved === 'days' : true;
  });


  // 处理滑动删除
  const handleSwipeDelete = async (id: string) => {
    const food = foods.find(f => f.id === id);
    if (food && food.quantity > 1) {
      await decreaseQuantity(id);
      toast.success(`已减少1个${food.name}`, { position: 'bottom-center' });
    } else {
      await deleteFood(id);
      toast.success('食物已删除', { position: 'bottom-center' });
    }
    // 强制重新渲染列表
    const updatedFoods = foods.filter(f => f.id !== id);
    setFoods(updatedFoods);
  };




                      const handleMarkAsConsumed = async (id: string, amount: number) => {
                        const food = foods.find(f => f.id === id);
                        if (!food) return;
                        
                        const unit = food.unit || '个';
                        // 确保initialQuantity存在，不存在则使用当前quantity
                        const initialQty = food.initialQuantity || food.quantity;
                        
                        // 计算实际消耗量和剩余量
                        const consumedAmount = amount === 1 ? food.quantity : Math.round(initialQty * amount * 100) / 100;
                        const remainingAmount = Math.max(0, Math.round((food.quantity - consumedAmount) * 100) / 100);
                        
                        // 记录操作日志
                        await logAction('食用', food, 
                          amount === 1 ? '全部' : 
                          amount === 0.75 ? '3/4' :
                          amount === 0.5 ? '1/2' : '1/4',
                          consumedAmount,
                          remainingAmount
                        );

                        if (remainingAmount <= 0) {
                          // 全部食用完，删除食物
                          await deleteFood(id);
                          toast.success(`已食用全部 ${food.quantity}${unit} ${food.name}`, {
                            position: 'top-right',
                            description: `初始量: ${initialQty}${unit}`,
                            duration: 2000
                          });
                          // 更新本地状态
                          setFoods(foods.filter(f => f.id !== id));
                        } else {
                          // 部分食用，更新数量
                          await decreaseQuantity(id, consumedAmount);
                          toast.success(`已食用 ${consumedAmount.toFixed(2)}${unit} ${food.name}`, {
                            position: 'top-right',
                            description: `剩余: ${remainingAmount.toFixed(2)}${unit} (初始量: ${initialQty}${unit})`,
                            duration: 2000
                          });
                          // 更新本地状态
                          setFoods(foods.map(f => 
                            f.id === id ? {...f, quantity: remainingAmount} : f
                          ));
                        }
                      };





  // 获取状态颜色和文本
  const getFoodStatus = (expiryDate: string) => {
    const daysLeft = daysUntilExpiry(expiryDate);
    
    if (daysLeft < 0) {
      return { 
        color: 'bg-red-100 border-red-500',
        text: '已过期',
        days: `已过期${Math.abs(daysLeft)}天`
      };
    } else if (daysLeft <= 3) {
      return { 
        color: 'bg-orange-100 border-orange-500',
        text: '即将过期',
        days: `剩余${daysLeft}天`
      };
    } else {
      return { 
        color: 'bg-green-100 border-green-500',
        text: '新鲜',
        days: `剩余${daysLeft}天`
      };
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: 'normal' | 'warning' | 'danger') => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 border-green-500';
      case 'warning':
        return 'bg-orange-100 border-orange-500';
      case 'danger':
        return 'bg-red-100 border-red-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };



  // 保存显示模式偏好
  useEffect(() => {
    localStorage.setItem('expiryDisplayMode', showDaysLeft ? 'days' : 'date');
  }, [showDaysLeft]);

  return (
     <div className="relative min-h-screen pb-20 w-full px-4 md:px-6 lg:px-8">
     <div className="flex justify-between items-center px-4 pt-4">
        <h1 className="text-2xl font-bold text-blue-500">保质期管理</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDaysLeft(true)}
            className={`px-3 py-1 rounded-full text-sm ${showDaysLeft ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            倒数日
          </button>
          <button
            onClick={() => setShowDaysLeft(false)}
            className={`px-3 py-1 rounded-full text-sm ${!showDaysLeft ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            具体日期
          </button>
        </div>
      </div>
      
       {/* 食物列表 */}
        <div className="px-4 space-y-3">
         <AnimatePresence mode="popLayout"> {/* 使用popLayout模式优化删除动画 */}
            {foods.reduce((acc, food) => {
              // 检查是否已经处理过相同名称的食物
              if (acc.some(item => item.name === food.name)) {
                return acc;
              }
              
              // 检查是否有相同名称但不同保质期的食物
              const batchItems = foods.filter(f => 
                f.name === food.name && f.expiryDate !== food.expiryDate
              );
              
              if (batchItems.length > 0) {
                // 合并所有批次的食物
                const mainItem = {
                  ...food,
                  isBatch: true,
                  batchItems: [...batchItems, food].sort((a, b) => 
                    daysUntilExpiry(a.expiryDate) - daysUntilExpiry(b.expiryDate)
                  )
                };
                return [...acc, mainItem];
              }
              
              return [...acc, food];
            }, [] as (FoodItem & { isBatch?: boolean, batchItems?: FoodItem[] })[])
            .map((food) => {
              const foodStatus = getFoodStatus(food.expiryDate);
              const isExpanded = expandedStates[food.id] || false;
              const daysLeft = daysUntilExpiry(food.expiryDate);
              
              return (
               <motion.div
                 key={food.id}
                 layout
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, x: -50, transition: { duration: 0.1 } }} // 加快退出动画
                 transition={{ type: 'tween', duration: 0.1 }} // 加快动画速度
                 className={`p-3 rounded-lg border-l-4 ${getStatusColor(food.status)} shadow-sm relative ${
                   food.isBatch ? 'border-t-2 border-dashed border-yellow-400' : ''
                 }`}
                >
                 <div className="flex justify-between items-start">
                    <div>
                      {food.isBatch && (
                         <button 
                           onClick={() => setExpandedStates(prev => ({
                             ...prev,
                             [food.id]: !prev[food.id]
                           }))}
                           className="absolute right-1 top-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full shadow-sm flex items-center"
                         >
                          <i className="fa-solid fa-layer-group text-[10px] mr-1"></i>
                          <span>多批次</span>
                        </button>
                      )}
                     <h3 className="font-medium text-base">{food.name}</h3>
                      <p className="text-sm text-gray-600">
                              {food.quantity}{food.unit || getDefaultUnit(food.type)} · {formatExpiryDate(food.expiryDate, showDaysLeft)} · 
                              {food.position === 'freezer' ? '冷冻区' : food.position === 'thawing' ? '解冻区' : '冷藏区'}
                          </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      foodStatus.color.includes('red') ? 'bg-red-500' : 
                      foodStatus.color.includes('orange') ? 'bg-orange-500' : 'bg-green-500'
                    } text-white mt-1 inline-block`}>
                      {foodStatus.text}
                    </span>
                  </div>
                  <div className="w-16"></div>
                </div>
                
                {food.isBatch && isExpanded && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 space-y-2"
                    >
                      {food.batchItems?.map(item => (
                        <div 
                          key={item.id} 
                          className="bg-gray-50 p-2 rounded text-sm flex justify-between items-center"
                        >
                          <div>
                            <span className="font-medium">{item.quantity}{item.unit}</span>
                            <span className="text-gray-500 ml-2">
                              {formatExpiryDate(item.expiryDate, showDaysLeft)}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            getFoodStatus(item.expiryDate).color.includes('red') ? 'bg-red-500' : 
                            getFoodStatus(item.expiryDate).color.includes('orange') ? 'bg-orange-500' : 'bg-green-500'
                          } text-white`}>
                            {getFoodStatus(item.expiryDate).text}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}

                {foodStatus.text !== '新鲜' && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                    {foodStatus.text === '已过期'
                      ? `该食物已过期${Math.abs(daysLeft)}天，建议丢弃`
                      : `该食物将在${daysLeft}天后过期，建议尽快食用`}
                  </div>
                )}

                   <div className="flex justify-between mt-2 space-x-1">
                    {foodStatus.text === '已过期' ? (
                      <div className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm text-center">
                        已过期，不可食用
                      </div>
                    ) : (
                      <div className="relative flex-1">
                         <button
                           onClick={() => handleMarkAsConsumed(food.id, 1)}
                           className="w-full py-2 bg-green-500 text-white rounded-lg text-sm active:scale-95 transition-transform"
                         >
                           已食用
                         </button>
                         <div className="absolute inset-0 flex opacity-0 hover:opacity-100 transition-opacity">
                           <button
                             onClick={async (e) => {e.stopPropagation(); await handleMarkAsConsumed(food.id, 0.25)}}
                             className="flex-1 py-2 bg-green-400 text-white text-xs"
                           >
                             1/4
                           </button>
                           <button
                             onClick={async (e) => {e.stopPropagation(); await handleMarkAsConsumed(food.id, 0.5)}}
                             className="flex-1 py-2 bg-green-500 text-white text-xs"
                           >
                             1/2
                           </button>
                           <button
                             onClick={async (e) => {e.stopPropagation(); await handleMarkAsConsumed(food.id, 0.75)}}
                             className="flex-1 py-2 bg-green-600 text-white text-xs"
                           >
                             3/4
                           </button>
                           <button
                             onClick={async (e) => {e.stopPropagation(); await handleMarkAsConsumed(food.id, food.quantity)}}
                             className="flex-1 py-2 bg-green-700 text-white text-xs"
                           >
                             全部
                           </button>
                         </div>
                       </div>
                    )}
                      <div className="flex-1 relative">
                          <button
                            className="w-full py-2 bg-red-500 text-white rounded-lg text-sm active:scale-95 transition-transform"
                          >
                            删除
                          </button>
                          <div className="absolute inset-0 flex opacity-0 hover:opacity-100 transition-opacity">
                             <button
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 if (food.quantity <= 1) {
                              await logAction('删除', food, '全部', food.quantity, 0);
                                       await deleteFood(food.id);
                                       toast.success(`${food.name}已从列表中移除`, {
                                         position: 'top-right',
                                         duration: 2000,
                                         description: `初始量: ${food.initialQuantity || food.quantity}${food.unit}`
                                       });
                                 } else {
                                     const newQuantity = food.quantity - 1;
                                     await logAction('删除', food, '减1', 1, newQuantity);
                                     await decreaseQuantity(food.id, 1);
                                 toast.success(`已减少1${food.unit}${food.name}`, {
                                   position: 'top-right',
                                   description: `剩余: ${newQuantity.toFixed(2)}${food.unit} (初始量: ${food.initialQuantity || food.quantity}${food.unit})`,
                                        duration: 2000
                                      });
                                 }
                               }}
                               className="flex-1 py-2 bg-red-400 text-white text-xs"
                             >
                              减1
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await logAction('删除', food, '全部', food.quantity, 0);
                                 await deleteFood(food.id);
                                 toast.success(`${food.name}已全部移除`, {
                                   position: 'top-right',
                                   duration: 2000,
                                   description: `初始量: ${food.initialQuantity || food.quantity}${food.unit}`
                                 });
                              }}
                              className="flex-1 py-2 bg-red-600 text-white text-xs"
                            >
                              全部
                            </button>
                          </div>
                        </div>





                  </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>



      <BottomNav />
    </div>
  );
}