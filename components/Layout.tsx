
import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { AppSettings } from '../types';
import { LOGO_URL } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  settings: AppSettings;
  toggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, settings, toggleTheme }) => {
  return (
    <div className={`h-screen w-full relative flex flex-col ${settings.theme === 'dark' ? 'bg-black' : 'bg-[#f8f9fa]'} text-white overflow-hidden font-sans transition-colors duration-500`}>
      <header className="fixed top-0 inset-x-0 h-16 flex items-center justify-between px-6 z-50 bg-transparent backdrop-blur-sm pointer-events-none">
        <div className="fixed top-4 left-6 flex items-center gap-3 pointer-events-auto select-none z-50">
          <img src={LOGO_URL} alt="MeroDrop Logo" className="w-10 h-10 object-contain" />
          <span className={`text-2xl font-black tracking-tighter ${settings.theme === 'dark' ? 'text-white' : 'text-black'}`}>MeroDrop</span>
        </div>

        <div className="fixed top-4 right-6 flex items-center pointer-events-auto z-50">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className={`p-3 rounded-full transition-all ${settings.theme === 'dark' ? 'text-[#e8eaed] hover:bg-white/10' : 'text-black hover:bg-black/5'}`}
          >
            {settings.theme === 'dark' ? <Sun className="w-7 h-7" /> : <Moon className="w-7 h-7" />}
          </motion.button>
        </div>
      </header>

      <main className="flex-1 relative w-full h-full flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
