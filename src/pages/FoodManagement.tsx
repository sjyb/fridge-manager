import { useState, useMemo } from 'react';
import { getDefaultExpiryDays, calculateDefaultExpiryDate } from '@/lib/utils';
import { useFoods } from '@/hooks/useFoods';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { mockFoods, foodCategories } from '@/data/foods';
import { FoodItem } from '@/types/food';
import { getDefaultUnit } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

// 获取可用的单位列表
const getAvailableUnits = (foodType: string) => {
  if (!foodType) return [{ value: '个', label: '个' }];
  
  // 乳制品优先处理，确保默认单位为"瓶"
  if (foodType.includes('milk') || foodType.includes('yogurt')) {
    return [
      { value: '瓶', label: '瓶' },
      { value: '盒', label: '盒' },
      { value: '升', label: '升' }
    ];
  }
  
  // 肉类/海鲜类
  if (foodType.includes('meat') || foodType.includes('beef') || foodType.includes('pork') || 
      foodType.includes('chicken') || foodType.includes('fish') || foodType.includes('seafood')) {
    return [
      { value: '斤', label: '斤' },
      { value: '千克', label: '千克' },
      { value: '份', label: '份' }
    ];
  }
  
  // 蔬菜水果类
  if (foodType.includes('vegetable') || foodType.includes('fruit')) {
    return [
      { value: '个', label: '个' },
      { value: '斤', label: '斤' },
      { value: '袋', label: '袋' },
      { value: '把', label: '把' }
    ];
  }
  
  // 蛋类
  if (foodType.includes('egg')) {
    return [
      { value: '颗', label: '颗' },
      { value: '盒', label: '盒' }
    ];
  }
  
  // 其他乳制品
  if (foodType.includes('cheese')) {
    return [
      { value: '块', label: '块' },
      { value: '盒', label: '盒' }
    ];
  }
  
  // 默认选项
  return [
    { value: '个', label: '个' },
    { value: '斤', label: '斤' },
    { value: '瓶', label: '瓶' },
    { value: '盒', label: '盒' }
  ];
};


// 表单验证schema
const foodSchema = z.object({
  name: z.string().min(1, '请输入食物名称'),
  type: z.string().min(1, '请选择食物类型'),
  quantity: z.number().min(0.1, '数量至少为0.1').refine(val => val > 0, '数量必须大于0'),
  unit: z.string().min(1, '请选择单位'),
  expiryDate: z.string().min(1, '请选择保质期'),
});

export default function FoodManagement() {
  const navigate = useNavigate();
  const { logAction, zoneConfig } = useFoods();
  // 计算3天后的日期
  const getDefaultExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    quantity: 1,
    unit: '个', // 初始值设为'个'，会在type变化时更新为对应类型的默认单位
    expiryDate: '', // 初始为空，将在选择类型后自动设置
  });

  // 使用从utils导入的getDefaultUnit函数
  const [recommendedPosition, setRecommendedPosition] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const { foods, setFoods, isLoading, error, deleteFood, addFoods } = useFoods(); // 使用自定义hook管理全局食物状态

  // 智能推荐位置
  const recommendPosition = (type: string) => {
    const zoneConfig = localStorage.getItem('fridgeZoneConfig') || 'all';
    
    // 根据当前功能区配置严格限制推荐
    if (zoneConfig === 'fridge') return 'fridge';
    if (zoneConfig === 'freezer') return 'freezer';
    if (zoneConfig === 'fridge+thawing') {
      if (['meat', 'seafood'].includes(type)) return 'thawing';
      return 'fridge';
    }
    if (zoneConfig === 'fridge+freezer') {
      if (['meat', 'seafood', 'icecream'].includes(type)) return 'freezer';
      return 'fridge';
    }
    if (zoneConfig === 'thawing+freezer') {
      if (['meat', 'seafood'].includes(type)) return 'thawing';
      return 'freezer';
    }
    
    // 默认全功能配置
    if (['meat', 'seafood', 'icecream'].includes(type)) return 'freezer';
    if (['frozen_food', 'prepared_food'].includes(type)) return 'thawing';
    return 'fridge';
  };

  // 处理表单变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: name === 'quantity' ? parseInt(value) || 0 : value,
      };

      // 类型变化时更新推荐位置和单位
      if (name === 'type') {
        setRecommendedPosition(recommendPosition(value));
        // 根据食物类型设置默认单位
        newFormData.unit = value.includes('milk') || value.includes('yogurt') ? '瓶' : getDefaultUnit(value);
        
        // 根据食物类型设置名称(非自定义类型)
        if (value !== 'other') {
          const foodType = foodCategories
            .flatMap(c => c.subCategories?.flatMap(sc => sc?.types) || [])
            .find(t => t?.value === value);
          if (foodType) {
            newFormData.name = foodType.label;
            // 自动设置保质期
            const expiryDays = getDefaultExpiryDays(value, recommendPosition(value));
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + expiryDays);
            newFormData.expiryDate = expiryDate.toISOString().split('T')[0];
          }
        }
      }

      // 当推荐位置变化时更新保质期
      if (name === 'position' && formData.type) {
        const expiryDays = getDefaultExpiryDays(formData.type, value);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);
        newFormData.expiryDate = expiryDate.toISOString().split('T')[0];
      }

      return newFormData;
    });
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 验证表单数据
      foodSchema.parse(formData);
      
      // 如果是肉类，按比例分配到冷冻区和解冻区
      if (['meat', 'chicken', 'beef'].includes(formData.type)) {
        const freezerQty = Math.ceil(formData.quantity * 2 / 3);
        const thawingQty = formData.quantity - freezerQty;
        
        const newFoods: FoodItem[] = [
          {
            id: `${Date.now()}-1`,
            name: formData.name,
            type: formData.type,
            quantity: freezerQty,
            position: 'freezer',
            expiryDate: formData.expiryDate,
            image: formData.type,
            status: 'normal'
          },
          {
            id: `${Date.now()}-2`,
            name: formData.name,
            type: formData.type,
            quantity: thawingQty,
            position: 'thawing',
            expiryDate: formData.expiryDate,
            image: formData.type,
            status: 'normal'
          }
        ];
        
        await addFoods(newFoods);
        toast.success(`已添加${freezerQty}份到冷冻区，${thawingQty}份到解冻区`);
      } else {
        // 创建新食物
               const newFood: FoodItem = {
                 id: Date.now().toString(),
                 name: formData.name,
                 type: formData.type,
                 quantity: formData.quantity,
                 initialQuantity: formData.quantity,
                 unit: formData.unit, // 直接使用表单中的单位
                 position: recommendedPosition || recommendPosition(formData.type),
                 expiryDate: formData.expiryDate,
                 image: formData.type,
                 status: 'normal'
               };
      await addFoods([newFood]);
      await logAction('添加', newFood);
      }
      
      // 重置表单
      setFormData({
        name: '',
        type: '',
        quantity: 1,
        unit: '个',
        expiryDate: '',
      });
      
      // 返回冰箱页面
      navigate('/');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('添加食物失败，请重试');
      }
    }
  };



  return (
     <div className="relative min-h-screen pb-20 w-full px-4 md:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-center py-4 text-blue-500">食物管理</h1>
      
      {/* 表单区域 */}
      <div className="px-4 mb-6">
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md">
           <div className="mb-4">
             <label className="block text-gray-700 mb-2">食物名称</label>
             {formData.type === 'other' ? (
               <input
                 type="text"
                 name="name"
                 value={formData.name}
                 onChange={handleChange}
                 placeholder="请输入食物名称"
                 className="w-full p-3 border border-gray-300 rounded-lg"
               />
             ) : (
               <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50">
                 {formData.name || "请选择食物类型"}
               </div>
             )}
           </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">食物类型</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
                   {foodCategories?.map(category => (
                     <button
                       key={category?.category}
                       type="button"
                       onClick={() => {
                         setSelectedCategory(category?.category || '');
                         setShowTypeSelector(true);
                       }}
                       className={`p-2 h-20 rounded-lg flex flex-col items-center justify-center ${
                         formData.type && foodCategories?.find(c => 
                           c?.subCategories?.some(s => 
                             s?.types?.some(t => t?.value === formData.type)
                           )
                         )?.category === category?.category
                           ? 'bg-blue-100 border-2 border-blue-500' 
                           : 'bg-gray-100 hover:bg-gray-50'
                       }`}
                 >
                   <i className={`${category.subCategories?.[0]?.types?.[0]?.icon || 'fa-solid fa-question'} text-xl mb-1`}></i>
                   <span className="text-xs font-medium">{category.category}</span>
                   {category.category === '肉类' && (
                     <span className="text-[10px] mt-0.5 text-gray-500">生/熟</span>
                   )}
                 </button>
               ))}
             </div>
            {formData.type && (
             <div className="mt-2 text-sm text-gray-600">
                 已选择: {foodCategories
                   ?.flatMap(c => c?.subCategories?.flatMap(sc => sc?.types || []) || [])
                   .find(t => t?.value === formData.type)?.label || '自定义'}
               </div>
            )}
          </div>

          {/* 二级分类选择弹窗 */}
          {showTypeSelector && selectedCategory && (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
               <div className="bg-white rounded-lg p-4 w-full max-w-sm mx-4">
                 <h3 className="text-lg font-medium mb-3">{selectedCategory}</h3>
                 <div className="grid grid-cols-3 gap-2">
                    {foodCategories?.find(c => c?.category === selectedCategory)?.subCategories?.flatMap(sc => sc?.types || [])?.map(type => (
                      <button
                        key={type?.value}
                        type="button"
                       onClick={() => {
                         const updateForm = () => {
                           if (type?.value === 'other') {
                              setFormData(prev => ({ 
                                ...prev, 
                                type: 'other',
                                expiryDate: ''
                              }));
                           } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              type: type?.value || '',
                              name: type?.label || '',
                              expiryDate: calculateDefaultExpiryDate(
                                type?.value || '',
                                recommendPosition(type?.value || '')
                              )
                            }));
                             setRecommendedPosition(type?.storage || 'fridge');
                           }
                           setShowTypeSelector(false);
                         };
                         requestAnimationFrame(updateForm);
                       }}
                       className="p-2 rounded-lg flex flex-col items-center bg-gray-100 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                     >
                       <i className={`${type?.icon || 'fa-solid fa-question'} text-xl mb-1`}></i>
                       <span className="text-xs">{type?.label}</span>
                       {type?.storage === 'freezer' && (
                         <span className="text-[10px] text-red-500">需冷冻</span>
                       )}
                       {type?.storage === 'fridge' && (
                         <span className="text-[10px] text-green-500">可冷藏</span>
                       )}
                     </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowTypeSelector(false)}
                  className="mt-4 w-full py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

             <div className="mb-4">
               <label className="block text-gray-700 mb-2">数量</label>
               <div className="flex items-center">
                 <button 
                   type="button"
                   onClick={() => setFormData(prev => ({...prev, quantity: Math.max(1, prev.quantity - 1)}))}
                   className="px-4 py-2 bg-gray-200 rounded-l-lg"
                 >
                   -
                 </button>
                 <input
                   type="number"
                   name="quantity"
                   value={formData.quantity}
                   onChange={handleChange}
                   min="1"
                   step="1"
                   className="flex-1 p-2 border-t border-b border-gray-300 text-center"
                 />
                 <button 
                   type="button"
                   onClick={() => setFormData(prev => ({...prev, quantity: prev.quantity + 1}))}
                   className="px-4 py-2 bg-gray-200 rounded-r-lg"
                 >
                   +
                 </button>
                  <select
                    name="unit"
                    value={formData.unit || getDefaultUnit(formData.type)}
                    onChange={handleChange}
                    className="ml-2 p-2 border border-gray-300 rounded-lg"
                  >
                    {getAvailableUnits(formData.type).map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
               </div>
             </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">保质期</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>



           {/* 推荐区域 */}
           {formData.type && (
             <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
               <h3 className="text-blue-700 font-medium mb-1">智能推荐</h3>
               <p className="text-sm">
                 推荐存放位置: 
                 <span className="font-bold ml-1">
                   {recommendedPosition === 'freezer' 
                     ? '冷冻区 (-25°C)' 
                     : recommendedPosition === 'thawing' 
                       ? '解冻区 (-10°C)' 
                       : '冷藏区 (7°C)'}
                 </span>
               </p>
               <p className="text-sm mt-1">
                 当前保质期: 
                 <span className="font-bold ml-1">
                   {formData.expiryDate ? new Date(formData.expiryDate).toLocaleDateString('zh-CN') : '未设置'}
                 </span>
               </p>
               <div className="flex space-x-2 mt-2">
                 {['fridge', 'fridge+thawing', 'fridge+freezer', 'all'].includes(zoneConfig) && (
                   <button
                     type="button"
                     onClick={() => {
                       setRecommendedPosition('fridge');
                       const expiryDays = getDefaultExpiryDays(formData.type, 'fridge');
                       const expiryDate = new Date();
                       expiryDate.setDate(expiryDate.getDate() + expiryDays);
                       setFormData(prev => ({...prev, expiryDate: expiryDate.toISOString().split('T')[0]}));
                     }}
                     className={`text-xs px-2 py-1 rounded ${
                       recommendedPosition === 'fridge' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                     }`}
                     disabled={!['fridge', 'fridge+thawing', 'fridge+freezer', 'all'].includes(zoneConfig)}
                   >
                     冷藏区
                   </button>
                 )}
                 {['thawing', 'fridge+thawing', 'thawing+freezer', 'all'].includes(zoneConfig) && (
                   <button
                     type="button"
                     onClick={() => {
                       setRecommendedPosition('thawing');
                       const expiryDays = getDefaultExpiryDays(formData.type, 'thawing');
                       const expiryDate = new Date();
                       expiryDate.setDate(expiryDate.getDate() + expiryDays);
                       setFormData(prev => ({...prev, expiryDate: expiryDate.toISOString().split('T')[0]}));
                     }}
                     className={`text-xs px-2 py-1 rounded ${
                       recommendedPosition === 'thawing' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                     }`}
                     disabled={!['thawing', 'fridge+thawing', 'thawing+freezer', 'all'].includes(zoneConfig)}
                   >
                     解冻区
                   </button>
                 )}
                 {['freezer', 'fridge+freezer', 'thawing+freezer', 'all'].includes(zoneConfig) && (
                   <button
                     type="button"
                     onClick={() => {
                       setRecommendedPosition('freezer');
                       const expiryDays = getDefaultExpiryDays(formData.type, 'freezer');
                       const expiryDate = new Date();
                       expiryDate.setDate(expiryDate.getDate() + expiryDays);
                       setFormData(prev => ({...prev, expiryDate: expiryDate.toISOString().split('T')[0]}));
                     }}
                     className={`text-xs px-2 py-1 rounded ${
                       recommendedPosition === 'freezer' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                     }`}
                     disabled={!['freezer', 'fridge+freezer', 'thawing+freezer', 'all'].includes(zoneConfig)}
                   >
                     冷冻区
                   </button>
                 )}
               </div>
             </div>
           )}

          {/* 提交按钮 */}
          <button
            type="submit"
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            保存食物
          </button>
        </form>
      </div>

       {/* 食物列表 */}
       <div className="px-4 pb-24">
         <h2 className="text-lg font-medium mb-2">当前食物列表</h2>
         {isLoading ? (
           <div className="flex justify-center items-center h-32">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
           </div>
         ) : error ? (
           <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
             <div className="flex">
               <div className="flex-shrink-0">
                 <i className="fa-solid fa-exclamation-triangle text-yellow-400"></i>
               </div>
               <div className="ml-3">
                 <p className="text-sm text-yellow-700">{error}</p>
               </div>
             </div>
           </div>
         ) : foods.length === 0 ? (
           <div className="bg-gray-50 p-4 rounded-lg text-center">
             <i className="fa-solid fa-fridge text-gray-300 text-4xl mb-2"></i>
             <p className="text-gray-500">冰箱是空的，添加一些食物吧</p>
           </div>
         ) : (
           <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
             {foods.map(food => (
               <div key={food.id} className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center">
                     <i className={`${foodCategories?.flatMap(c => c?.subCategories?.flatMap(sc => sc?.types || []) || [])?.find(t => t?.value === food.type)?.icon || 'fa-solid fa-utensils'} mr-2`}></i>
                    <div>
                      <p className="font-medium">{food.name}</p>
                        <p className="text-xs text-gray-500">{food.quantity}{food.unit || '个'} · {food.position === 'freezer' ? '冷冻' : food.position === 'thawing' ? '解冻' : '冷藏'}</p>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>

      <BottomNav />
    </div>
  );
}
