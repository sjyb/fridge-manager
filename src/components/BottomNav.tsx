import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 flex justify-around items-center safe-pb">
      <NavLink 
        to="/" 
        className={({ isActive }) => 
          `flex flex-col items-center ${isActive ? 'text-blue-500' : 'text-gray-500'}`
        }
      >
        <i className="fa-solid fa-refrigerator text-xl"></i>
        <span className="text-xs mt-1">冰箱</span>
      </NavLink>
      <NavLink 
        to="/food-management" 
        className={({ isActive }) => 
          `flex flex-col items-center ${isActive ? 'text-blue-500' : 'text-gray-500'}`
        }
      >
        <i className="fa-solid fa-apple-whole text-xl"></i>
        <span className="text-xs mt-1">食物</span>
      </NavLink>
      <NavLink 
        to="/expiry-management" 
        className={({ isActive }) => 
          `flex flex-col items-center ${isActive ? 'text-blue-500' : 'text-gray-500'}`
        }
      >
        <i className="fa-solid fa-clock text-xl"></i>
        <span className="text-xs mt-1">保质期</span>
      </NavLink>
      <NavLink 
        to="/settings" 
        className={({ isActive }) => 
          `flex flex-col items-center ${isActive ? 'text-blue-500' : 'text-gray-500'}`
        }
      >
        <i className="fa-solid fa-gear text-xl"></i>
        <span className="text-xs mt-1">设置</span>
      </NavLink>
    </div>
  );
}