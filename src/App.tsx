import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import FoodManagement from "@/pages/FoodManagement";
import ExpiryManagement from "@/pages/ExpiryManagement";
import Settings from "@/pages/Settings";
import { createContext, useState } from "react";

export const AuthContext = createContext({
  isAuthenticated: false,
  setIsAuthenticated: (value: boolean) => {},
  logout: () => {},
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, logout }}
    >
      <div className="min-h-screen w-full bg-gray-50 flex flex-col">
        <main className="flex-1 w-full px-4 md:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/food-management" element={<FoodManagement />} />
            <Route path="/foods" element={<div className="text-center text-xl">食物管理 - 开发中</div>} />
            <Route path="/expiry" element={<div className="text-center text-xl">保质期管理 - 开发中</div>} />
            <Route path="/expiry-management" element={<ExpiryManagement />} />
            <Route path="/stats" element={<div className="text-center text-xl">统计分析 - 开发中</div>} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
