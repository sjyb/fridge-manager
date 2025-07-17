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
