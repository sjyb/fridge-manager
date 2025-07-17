import { useState } from 'react';
import { getDefaultUnit } from '@/lib/utils';
import { daysUntilExpiry } from '@/lib/utils';
import { FoodItem } from '@/types/food';
import FoodItemComponent from './FoodItem';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const getFoodIcon = (type: string) => {
  switch(type) {
    case 'milk': return 'fa-solid fa-mug-hot text-blue-400';
    case 'yogurt': return 'fa-solid fa-jar text-pink-400';
    case 'cheese': return 'fa-solid fa-cheese text-yellow-400';
    case 'beef-raw': return 'fa-solid fa-drumstick-bite text-red-400';
    case 'pork-raw': return 'fa-solid fa-bacon text-red-300';
    case 'chicken-raw': return 'fa-solid fa-drumstick text-orange-400';
    case 'egg': return 'fa-solid fa-egg text-yellow-200';
    case 'apple': return 'fa-solid fa-apple-whole text-red-500';
    case 'banana': return 'fa-solid fa-banana text-yellow-300';
    case 'leafy-greens': return 'fa-solid fa-leaf text-green-500';
    case 'root-vegetable': return 'fa-solid fa-carrot text-orange-500';
    case 'fish-raw': return 'fa-solid fa-fish text-blue-300';
    default: return 'fa-solid fa-utensils text-gray-400';
  }
};

interface FridgeModelProps {
  foods: FoodItem[];
  onFoodClick: (food: FoodItem) => void;
  onPositionChange: (id: string, newPosition: string) => void;
  viewMode: 'icons' | 'list';
  currentZone: 'fridge' | 'thawing' | 'freezer';
}

export default function FridgeModel({ 
  foods, 
  onFoodClick, 
  onPositionChange, 
  viewMode,
  currentZone 
}: FridgeModelProps) {
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});

  const handleRotate = (direction: 'left' | 'right') => {
    setRotation(prev => {
      const newRotation = prev + (direction === 'left' ? -15 : 15);
      return Math.max(-15, Math.min(15, newRotation));
    });
  };

  const getZoneTitle = (zone: string) => {
    switch(zone) {
      case 'fridge': return '冷藏区 (7°C)';
      case 'thawing': return '解冻区 (-10°C)';
      case 'freezer': return '冷冻区 (-25°C)';
      default: return '';
    }
  };

  const getZoneColor = (zone: string) => {
    switch(zone) {
      case 'fridge': return 'bg-[#5D9CEC]';
      case 'thawing': return 'bg-[#4B7BEC]';
      case 'freezer': return 'bg-[#3D6EC8]';
      default: return '';
    }
  };

  return (
    <div className="relative h-[50vh] md:h-[60vh] w-full perspective-1200 overflow-hidden">
       <div 
         className="relative w-full h-full transition-transform duration-300"
         style={{ transform: `rotateY(${rotation}deg)`, transformStyle: 'preserve-3d' }}
       >
        <AnimatePresence mode="wait">
            <motion.div
              key={currentZone}
               initial={{ opacity: 0, x: 50 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -50 }}
               transition={{ duration: 0.2, ease: 'easeOut' }}
               className={`absolute w-full h-full ${getZoneColor(currentZone)} rounded-xl p-4 overflow-y-auto ${
                 dragOverZone === currentZone ? 'ring-2 ring-white ring-opacity-70' : ''
               }`}
               onDragEnter={() => setDragOverZone(currentZone)}
              onDragLeave={() => setDragOverZone(null)}
              onDrop={() => setDragOverZone(null)}
            >
            <div className="flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-white font-medium">{getZoneTitle(currentZone)}</h3>
            </div>
            
             {viewMode === 'icons' ? (
               <div className="grid grid-cols-4 gap-2 mt-2 pb-4">
                  {foods
                    .filter(food => food.position === currentZone)
                    .map(food => {
                      const isBatch = food.isBatch || false;
                      const batchItems = isBatch ? food.batchItems || [] : [];
                      
                      return (
                         <div 
                           key={food.id}
                           className={`relative ${isBatch ? 'border-t-2 border-dashed border-yellow-400' : ''}`}
                         >

                           <FoodItemComponent 
                             food={food} 
                             onClick={() => onFoodClick(food)}
                             isBatch={isBatch}
                             batchItems={batchItems}
                             isExpanded={expandedStates[food.id] || false}
                             onToggleExpand={() => setExpandedStates(prev => ({
                               ...prev,
                               [food.id]: !prev[food.id]
                             }))}
                             onDrop={(newPos) => {
                               if (food.name === '牛奶' && food.position === 'fridge' && newPos === 'freezer') {
                                 toast.error('牛奶不能从冷冻区移动到冷藏区');
                                 return;
                               }
                               if (food.name === '冰淇淋' && food.position === 'freezer' && newPos === 'fridge') {
                                 toast.error('冰淇淋不能从冷冻区移动到冷藏区');
                                 return;
                               }
                               if (['meat', 'chicken', 'beef'].includes(food.type) && food.position === 'freezer' && newPos === 'fridge') {
                                 toast.error('肉类应保存在冷冻区或解冻区');
                                 return;
                               }
                               onPositionChange(food.id, newPos);
                             }}
                           />
                          </div>
                        );
                      })}
                </div>
              ) : (
               <div className="space-y-2 mt-2 pb-4">
                 {foods
                   .filter(f => f.position === currentZone)
                   .map(food => {
                     // 检查是否有相同名称但不同保质期的食物
                     const hasSameNameDiffExpiry = foods.some(f => 
                       f.name === food.name && f.expiryDate !== food.expiryDate
                     );
                     const daysLeft = daysUntilExpiry(food.expiryDate);
                     
                     return (
                       <div 
                         key={food.id}
                         className={`flex items-center p-2 bg-white rounded-lg shadow-sm relative ${
                           hasSameNameDiffExpiry ? 'border-t-2 border-dashed border-yellow-400' : ''
                         }`}
                         onClick={() => onFoodClick(food)}
                       >
                         {hasSameNameDiffExpiry && (
                           <span className="absolute -top-2 -left-2 bg-yellow-400 text-white text-xs px-1 rounded-full">多批次</span>
                         )}
                         <i className={`${getFoodIcon(food.type)} text-3xl mr-3`}></i>
                         <div className="flex-1">
                           <div className="font-medium">{food.name}</div>
                           <div className="text-xs text-gray-500">
                             {food.quantity}{food.unit || getDefaultUnit(food.type)} · {food.position === 'freezer' ? '冷冻' : food.position === 'thawing' ? '解冻' : '冷藏'}
                           </div>
                           <div className={`text-xs mt-1 ${
                             daysLeft <= 0 ? 'text-red-500' : 
                             daysLeft <= 3 ? 'text-orange-500' : 'text-green-500'
                           }`}>
                             {daysLeft <= 0 ? `已过期${Math.abs(daysLeft)}天` : `剩余${daysLeft}天`}
                           </div>
                         </div>
                         <i className="fa-solid fa-ellipsis-vertical text-gray-400"></i>
                       </div>
                     );
                   })}
               </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between mt-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          onClick={() => handleRotate('left')}
        >
          左转
        </button>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          onClick={() => handleRotate('right')}
        >
          右转
        </button>
      </div>
    </div>
  );
}