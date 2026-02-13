
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { Peer as PeerType, AppSettings, TransferState, HistoryItem } from './types';
import { dbService } from './services/db';
import { Pencil } from 'lucide-react';

import Layout from './components/Layout';
import Radar from './components/Radar';
import PeerAvatar from './components/PeerAvatar';
import FileProgress from './components/FileProgress';
import HistoryModal from './components/HistoryModal';

function App() {
  const [settings, setSettings] = useState<AppSettings>({ deviceName: 'Loading...', theme: 'dark' });
  const [peers, setPeers] = useState<PeerType[]>([]);
  const [activeTransfer, setActiveTransfer] = useState<TransferState | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const init = async () => {
      const s = await dbService.getSettings();
      setSettings(s);
      const h = await dbService.getHistory();
      setHistoryItems(h);
    };
    init();
  }, []);

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    setSettings(prev => ({ ...prev, theme: newTheme }));
    dbService.saveSettings({ ...settings, theme: newTheme });
  };

  const handleEditName = () => {
    const newName = prompt("Choose your nickname:", settings.deviceName);
    if (newName) {
      setSettings(prev => ({ ...prev, deviceName: newName }));
      dbService.saveSettings({ ...settings, deviceName: newName });
    }
  };

  return (
    <Layout 
      settings={settings}
      toggleTheme={toggleTheme} 
      onOpenSettings={() => setShowHistory(true)} 
      onOpenHistory={() => setShowHistory(true)}
    >
      <Toaster position="bottom-center" />

      {/* 1. Radar Layer */}
      <Radar />

      {/* 2. Content Assembly */}
      <div className="relative w-full h-full flex flex-col z-10">
        
        {/* A. Central Status Text - Matches Screenshot 1 */}
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center px-6 pointer-events-none">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[26px] md:text-[32px] font-medium text-primary mb-3"
          >
            Open PairDrop on other devices to send files
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[#9aa0a6] text-base md:text-lg"
          >
            Pair devices or enter a public room to be discoverable on other networks
          </motion.p>
        </div>

        {/* B. Peers Display Layer */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-0 h-0 pointer-events-auto">
            {peers.map((peer, i) => (
              <PeerAvatar 
                key={peer.id} 
                peer={peer} 
                x={Math.cos(i) * 250} 
                y={Math.sin(i) * 250} 
                onClick={() => {}} 
              />
            ))}
          </div>
        </div>

        {/* C. Bottom Identity Beacon Section - Matches Screenshot 1 Exactly */}
        <div className="mt-auto mb-16 flex flex-col items-center justify-center w-full">
          
          {/* Central Blue Beacon with Ripple */}
          <div className="relative flex items-center justify-center w-24 h-24 mb-6 cursor-pointer group" onClick={handleEditName}>
            {/* Multi-layered Animated Ripple */}
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ripple" style={{ animationDuration: '4s' }} />
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ripple" style={{ animationDuration: '4s', animationDelay: '2s' }} />
            <div className="absolute w-20 h-20 bg-primary/20 rounded-full animate-pulse-slow" />
            
            {/* Core Beacon Icon */}
            <div className="relative z-10 text-primary group-hover:scale-110 transition-transform duration-300">
              <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                <path d="M8.5 8.5a4 4 0 1 0 5.6 5.6" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* You are known as Row */}
          <div className="flex items-center gap-1.5 mb-3.5">
            <span className="text-[#9aa0a6] text-[15px]">You are known as:</span>
            <button 
              onClick={handleEditName}
              className="group flex items-center bg-[#202124] hover:bg-[#2d2e31] px-2 py-0.5 rounded transition-colors"
            >
              <span className="text-white font-bold text-[15px]">{settings.deviceName}</span>
              <Pencil className="w-3.5 h-3.5 ml-2 text-[#9aa0a6] group-hover:text-primary" />
            </button>
          </div>

          {/* Discovery Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[#9aa0a6] text-[15px]">You can be discovered:</span>
            <div className="bg-primary/90 hover:bg-primary px-3 py-1 rounded-full text-white text-xs font-bold shadow-[0_2px_10px_rgba(66,133,244,0.3)] transition-all cursor-pointer">
              on this network
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeTransfer && (
          <FileProgress 
            transfer={activeTransfer} 
            onDecline={() => setActiveTransfer(null)} 
          />
        )}
        {showHistory && (
          <HistoryModal 
            history={historyItems} 
            onClose={() => setShowHistory(false)} 
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}

export default App;