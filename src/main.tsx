// 旧版浏览器兼容性处理
import 'core-js/stable';
import 'whatwg-fetch';

// 检测旧版浏览器并提供警告
(function() {
  var userAgent = navigator.userAgent;
  var isOldSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && 
                   (/Version\/9\./.test(userAgent) || /Version\/8\./.test(userAgent));
  
  if (isOldSafari) {
    console.warn('您正在使用旧版浏览器，部分功能可能无法正常工作。建议升级浏览器。');
  }
})();

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import "./index.css";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster 
        position="top-right"
        offset="20px"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'white',
            color: '#1f2937',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            padding: '0.75rem 1rem',
            maxWidth: '16rem',
            whiteSpace: 'normal',
            fontSize: '0.875rem',
            lineHeight: '1.4rem'
          },
          className: 'toast-message',
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: 'white'
            }
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: 'white'
            }
          }
        }}
      />
    </BrowserRouter>
  </StrictMode>
);
