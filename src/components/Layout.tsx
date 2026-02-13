
import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Bell, Info, Users, Link as LinkIcon, Smartphone, Languages } from 'lucide-react';
import { AppSettings } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  settings: AppSettings;
  toggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, settings, toggleTheme, onOpenSettings, onOpenHistory }) => {
  return (
    <div className={`min-h-screen w-full relative flex flex-col bg-black text-white overflow-hidden font-sans`}>
      {/* Header - Fixed Top Right, matching image 1 icon set */}
      <header className="fixed top-0 right-0 z-50 px-6 py-4 flex items-center justify-end w-full pointer-events-none">
        <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto text-[#e8eaed]">
          <NavButton onClick={() => {}} icon={<Users className="w-[18px] h-[18px]" />} label="Pair Devices" />
          <NavButton onClick={() => {}} icon={<LinkIcon className="w-[18px] h-[18px]" />} label="Join Public Room" />
          <NavButton onClick={() => {}} icon={<Smartphone className="w-[18px] h-[18px]" />} label="Install App" />
          <NavButton onClick={onOpenHistory} icon={<Bell className="w-[18px] h-[18px]" />} label="Notifications" />
          <NavButton onClick={toggleTheme} icon={settings.theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />} label="Theme" />
          <NavButton onClick={() => {}} icon={<Languages className="w-[18px] h-[18px]" />} label="Language" />
          <NavButton onClick={() => {}} icon={<Info className="w-[18px] h-[18px]" />} label="About" />
        </div>
      </header>

      <main className="flex-1 relative w-full h-full flex flex-col">
        {children}
      </main>
    </div>
  );
};

const NavButton = ({ onClick, icon, label }: { onClick: () => void, icon: React.ReactNode, label: string }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="p-2 rounded-full hover:bg-white/10 transition-colors"
    title={label}
  >
    {icon}
  </motion.button>
);

export default Layout;