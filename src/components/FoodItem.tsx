import { useState, useRef } from 'react';
import { FoodItem } from '@/types/food';
import { daysUntilExpiry, getDefaultUnit } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FoodItemProps {
  food: FoodItem;
  onClick: () => void;
  onDrop: (newPosition: string) => void;
  isBatch?: boolean;
  batchItems?: FoodItem[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function FoodItemComponent({ 
  food, 
  onClick, 
  onDrop,
  isBatch = false,
  batchItems = [],
  isExpanded = false,
  onToggleExpand
}: FoodItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const daysLeft = daysUntilExpiry(food.expiryDate);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const newPosition = e.currentTarget.getAttribute('data-position');
    if (newPosition) {
      onDrop(newPosition);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 根据食物类型获取对应的Font Awesome图标
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

  const getExpiryColor = () => {
    if (daysLeft <= 0) return 'text-red-500';
    if (daysLeft <= 3) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <div 
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`relative p-1 rounded-lg bg-white bg-opacity-80 cursor-pointer transition-all ${
        isDragging ? 'opacity-50 scale-90' : 'opacity-100 scale-100'
      } ${isBatch ? 'border-t-2 border-dashed border-yellow-400' : ''}`}
      data-position={food.position}
    >
      {isBatch && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExpand?.();
                        }}
                        className="relative -top-2 -right-2 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded-full shadow-sm flex items-center z-10 animate-pulse hover:bg-yellow-600 transition-colors"
                      >
                        <i className="fa-solid fa-layer-group text-[10px] mr-1"></i>
                        <span>{batchItems?.length || 0}</span>
                      </button>
      )}
      <div className="flex justify-center items-center h-8 relative">
        <i className={`${getFoodIcon(food.type)} text-2xl`}></i>
      </div>
      <div className="text-center text-xs font-medium truncate">{food.name}</div>
       <div className="text-center text-[10px] text-gray-500 truncate">
         {food.quantity}{food.unit || getDefaultUnit(food.type)}
       </div>
      <div className={`text-center text-[10px] ${getExpiryColor()}`}>
        {daysLeft <= 0 ? `已过期${Math.abs(daysLeft)}天` : `剩余${daysLeft}天`}
      </div>
      
      {isBatch && isExpanded && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 space-y-1"
          >
            {batchItems
              .sort((a, b) => daysUntilExpiry(a.expiryDate) - daysUntilExpiry(b.expiryDate))
              .map(item => (
                <div key={item.id} className="bg-gray-50 p-1 rounded text-xs">
                  <div>{item.quantity}{item.unit} · 剩余{daysUntilExpiry(item.expiryDate)}天</div>
                </div>
              ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}