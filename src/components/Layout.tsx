import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Info, Settings, History, ArrowLeft } from 'lucide-react';
import { AppSettings } from '../types';
import Radar from './Radar';

const LOGO_URL = "https://official.balrampathak.com.np/web/image/1416-4e563daf/mero-drop-logo.webp";

interface LayoutProps {
  children: React.ReactNode;
  settings: AppSettings;
  toggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, settings, toggleTheme, onOpenSettings, onOpenHistory }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const isStaticPage = ['/about', '/how-it-works', '/terms'].includes(location.pathname);

  return (
    <div className={`h-screen w-full relative flex flex-col ${settings.theme === 'dark' ? 'dark bg-black' : 'bg-white'} text-white ${isHome ? 'overflow-hidden' : 'overflow-y-auto'} font-sans transition-all duration-500`}>
      {/* Floating Header System */}
      <header className="fixed top-8 inset-x-8 flex items-center justify-between z-50 pointer-events-none">
        {/* Left Pill: Brand Identity */}
        <div 
          onClick={() => navigate('/')}
          className="pointer-events-auto cursor-pointer select-none hardware-accelerated"
          style={{ willChange: 'transform' }}
        >
          <div
            className="frosted-glass rounded-full px-5 py-2.5 flex items-center gap-3 border shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          >
            <img 
              src={LOGO_URL} 
              alt="MeroDrop" 
              className="w-8 h-8 rounded-full shadow-sm object-cover" 
            />
            <span className={`text-2xl font-bold tracking-tighter ${settings.theme === 'dark' ? 'text-white' : 'text-black'}`}>
              MeroDrop
            </span>
          </div>
        </div>

        {/* Right Circle: Theme Controller (Home Only) */}
        {isHome && (
          <div className="pointer-events-auto">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="frosted-glass w-11 h-11 flex items-center justify-center rounded-full shadow-2xl border transition-all hover:scale-110 active:scale-95"
              style={{ willChange: 'transform' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={settings.theme}
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.3, ease: "circOut" }}
                >
                  {settings.theme === 'dark' ? 
                    <Sun className="w-5 h-5 text-white" /> : 
                    <Moon className="w-5 h-5 text-black" />
                  }
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        )}
      </header>

      <main className="flex-1 relative w-full h-full flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Pure Black Footer Island (Static Pages Only) */}
      {isStaticPage && (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]" style={{ willChange: 'transform' }}>
          <div className="bg-black px-3 py-2.5 rounded-full flex items-center gap-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10">
            {[
              { to: '/about', label: 'About' },
              { to: '/how-it-works', label: 'How it Works' },
              { to: '/terms', label: 'Terms' },
            ].map(({ to, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className="relative px-5 py-2 rounded-full text-[14px] font-bold tracking-tight transition-colors duration-300 z-10"
                  style={{ color: isActive ? '#000' : 'rgba(255,255,255,0.55)' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-full bg-white z-[-1]"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
