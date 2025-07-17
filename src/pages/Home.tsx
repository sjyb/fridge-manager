import { useFoods } from '@/hooks/useFoods';
import FridgeModel from '@/components/FridgeModel';
import { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import { getDefaultUnit } from '@/lib/utils';

export default function Home() {
  const { foods, zoneConfig } = useFoods();
  const [viewMode, setViewMode] = useState<'icons' | 'list'>('icons');
  const [currentZone, setCurrentZone] = useState<'fridge' | 'thawing' | 'freezer'>('fridge');

  const handleFoodClick = (food: any) => {
    console.log('Food clicked:', food);
  };

  const handlePositionChange = (id: string, newPosition: string) => {
    console.log(`Move food ${id} to ${newPosition}`);
  };

  // 根据当前功能区配置决定可用的分区
  const availableZones = [];
  if (['fridge', 'fridge+thawing', 'fridge+freezer', 'all'].includes(zoneConfig)) {
    availableZones.push('fridge');
  }
  if (['thawing', 'fridge+thawing', 'thawing+freezer', 'all'].includes(zoneConfig)) {
    availableZones.push('thawing');
  }
  if (['freezer', 'fridge+freezer', 'thawing+freezer', 'all'].includes(zoneConfig)) {
    availableZones.push('freezer');
  }

  return (
    <div className="relative min-h-screen pb-20 w-full px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center px-4 pt-4">
        <h1 className="text-2xl font-bold text-blue-500">智能冰箱</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'icons' ? 'list' : 'icons')}
            className="px-3 py-1 bg-gray-200 rounded-full text-sm"
          >
            {viewMode === 'icons' ? '列表视图' : '图标视图'}
          </button>
        </div>
      </div>

      {/* 分区切换按钮 */}
      <div className="flex justify-center my-4">
        <div className="bg-blue-50 p-1 rounded-lg flex">
          {availableZones.includes('fridge') && (
            <button
              onClick={() => setCurrentZone('fridge')}
              className={`px-3 py-1 rounded-md ${currentZone === 'fridge' ? 'bg-blue-500 text-white' : 'text-blue-500'}`}
            >
              冷藏区
            </button>
          )}
          {availableZones.includes('thawing') && (
            <button
              onClick={() => setCurrentZone('thawing')}
              className={`px-3 py-1 rounded-md ${currentZone === 'thawing' ? 'bg-blue-500 text-white' : 'text-blue-500'}`}
            >
              解冻区
            </button>
          )}
          {availableZones.includes('freezer') && (
            <button
              onClick={() => setCurrentZone('freezer')}
              className={`px-3 py-1 rounded-md ${currentZone === 'freezer' ? 'bg-blue-500 text-white' : 'text-blue-500'}`}
            >
              冷冻区
            </button>
          )}
        </div>
      </div>
      
      <FridgeModel
        foods={foods}
        onFoodClick={handleFoodClick}
        onPositionChange={handlePositionChange}
        viewMode={viewMode}
        currentZone={currentZone}
      />
      
      <BottomNav />
    </div>
  );
}
