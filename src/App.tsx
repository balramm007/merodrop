import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Pencil } from 'lucide-react';

import PeerService from './services/peer';
import { dbService } from './services/db';
import { LOGO_URL, ANIMAL_NAMES } from './constants';
import { PeerData, TransferState, AppSettings } from './types';

import Radar from './components/Radar';
import PeerAvatar from './components/PeerAvatar';
import FileProgress from './components/FileProgress';
import ChatDialog from './components/ChatDialog';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';

const App: React.FC = () => {
  // --- State ---
  const [settings, setSettings] = useState<AppSettings>({
    deviceName: localStorage.getItem('mero-name') || ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)],
    theme: 'light'
  });

  const [isAppLoading, setIsAppLoading] = useState(true);

  const [peers, setPeers] = useState<Record<string, PeerData>>({});
  const [myId, setMyId] = useState<string | null>(null);
  
  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('mero-name'));
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingName, setOnboardingName] = useState('');
  
  // File Transfer State
  const [activeTransfer, setActiveTransfer] = useState<TransferState | null>(null);
  
  // Chat State
  const [chatTarget, setChatTarget] = useState<PeerData | null>(null);
  const [incomingChats, setIncomingChats] = useState<{ peer: PeerData; text: string; id: string }[]>([]);

  // Identity UI State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(settings.deviceName);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedPeerId = useRef<string | null>(null);
  const lastProcessedMessageId = useRef<string | null>(null);

  // --- Initialization ---
  useEffect(() => {
    // Splash Screen Timer
    const timer = setTimeout(() => setIsAppLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 1. Load Settings
    const loadSettings = async () => {
      const saved = await dbService.getSettings();
      if (saved) {
        setSettings(prev => ({ ...prev, ...saved }));
        setTempName(saved.deviceName);
      }
    };
    loadSettings();

    // 2. Init PeerService if we have a name
    if (!showOnboarding) {
        PeerService.init(settings.deviceName, navigator.platform);
    }

    // 3. Define Handlers
    const handleOpen = (id: string) => setMyId(id);
    
    const handlePeerFound = (peer: PeerData) => {
      setPeers(prev => {
        if (peer.id === myId) return prev;
        return { ...prev, [peer.id]: peer };
      });
    };

    const handlePeerUpdated = (data: { id: string, name: string }) => {
        setPeers(prev => {
            if (!prev[data.id]) return prev;
            return {
                ...prev,
                [data.id]: { ...prev[data.id], name: data.name }
            };
        });
    };

    const handlePeerDisconnected = (peerId: string) => {
      setPeers(prev => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
    };

    const handleIncomingFileRequest = (data: any) => {
      setActiveTransfer({
        fileId: data.fileId,
        peerId: data.peerId,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        progress: 0,
        speed: 0,
        status: 'pending',
        direction: 'incoming'
      });
    };

    const handleTransferProgress = (data: any) => {
        setActiveTransfer(prev => {
            if (prev && prev.fileId === data.fileId) {
                return { ...prev, progress: data.progress, status: data.status };
            }
            return prev;
        });
    };

    const handleFileReceived = (data: any) => {
      const url = URL.createObjectURL(data.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("File Received!");
      setActiveTransfer(null);
    };

    const handleChatReceived = (data: { peerId: string, text: string, id: string }) => {
        // Deduplication using UUID
        if (lastProcessedMessageId.current === data.id) {
            return; 
        }
        lastProcessedMessageId.current = data.id;

        setPeers(currentPeers => {
            const sender = currentPeers[data.peerId] || { id: data.peerId, name: 'Unknown', device: 'Unknown', deviceType: 'desktop' };
            setIncomingChats(prev => [...prev, { peer: sender, text: data.text, id: crypto.randomUUID() }]);
            return currentPeers; 
        });
    };

    // 4. Subscribe
    PeerService.on('open', handleOpen);
    PeerService.on('peer-found', handlePeerFound);
    PeerService.on('peer-updated', handlePeerUpdated);
    PeerService.on('peer-disconnected', handlePeerDisconnected);
    PeerService.on('incoming-file-request', handleIncomingFileRequest);
    PeerService.on('transfer-progress', handleTransferProgress);
    PeerService.on('file-received', handleFileReceived);
    PeerService.on('chat-received', handleChatReceived);

    // 5. Cleanup
    return () => {
      PeerService.off('open', handleOpen);
      PeerService.off('peer-found', handlePeerFound);
      PeerService.off('peer-updated', handlePeerUpdated);
      PeerService.off('peer-disconnected', handlePeerDisconnected);
      PeerService.off('incoming-file-request', handleIncomingFileRequest);
      PeerService.off('transfer-progress', handleTransferProgress);
      PeerService.off('file-received', handleFileReceived);
      PeerService.off('chat-received', handleChatReceived);
    };
  }, [showOnboarding, myId]); 

  // --- Handlers ---
  
  const finishOnboarding = () => {
    if (!onboardingName.trim()) return;
    const name = onboardingName.trim();
    localStorage.setItem('mero-name', name);
    setSettings(prev => ({ ...prev, deviceName: name }));
    dbService.saveSettings({ ...settings, deviceName: name });
    setShowOnboarding(false);
    
    // Init PeerService immediately
    PeerService.init(name, navigator.platform);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedPeerId.current) {
      PeerService.sendFile(file, selectedPeerId.current);
      
      setActiveTransfer({
        fileId: crypto.randomUUID(),
        peerId: selectedPeerId.current,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        progress: 0,
        speed: 0,
        status: 'transferring',
        direction: 'outgoing'
      });
      
      toast.success(`Sending ${file.name}...`);
      e.target.value = '';
    }
    selectedPeerId.current = null;
  };

  const saveIdentity = () => {
    if (!tempName.trim()) return;
    const newName = tempName.trim();
    
    setSettings(prev => ({ ...prev, deviceName: newName }));
    localStorage.setItem('mero-name', newName);
    dbService.saveSettings({ ...settings, deviceName: newName });
    
    PeerService.updateName(newName);
    setIsEditingName(false);
    toast.success("Identity Updated");
  };

  const peerList = useMemo(() => Object.values(peers), [peers]);

  // --- Render ---
  return (
    <AnimatePresence mode="wait">
      {isAppLoading ? (
        <SplashScreen key="splash" theme={settings.theme} />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="h-full w-full"
        >
          <Layout 
            settings={settings} 
            toggleTheme={() => {
              const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
              setSettings(prev => ({ ...prev, theme: newTheme }));
              dbService.saveSettings({ ...settings, theme: newTheme });
            }} 
            onOpenSettings={() => {}} 
            onOpenHistory={() => {}}
          >
            <Toaster position="bottom-center" />

            {/* Onboarding Overlay */}
            <AnimatePresence>
              {showOnboarding && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.8 } }}
                  className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center"
                >
                  {/* Purple Radial Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

                  <AnimatePresence mode="wait">
                    {onboardingStep === 1 ? (
                      <motion.div
                        key="step1"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.1, opacity: 0 }}
                        className="relative z-10 flex flex-col items-center"
                      >
                        <motion.div 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6"
                        >
                          MeroDrop
                        </motion.div>
                        <motion.p 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-xl text-gray-400 mb-12 max-w-md"
                        >
                          Simple. Fast. Private. <br/> Share files instantly across your local network.
                        </motion.p>
                        <motion.button
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setOnboardingStep(2)}
                          className="px-8 py-4 bg-white text-black text-lg font-bold rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all"
                        >
                          Get Started
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="step2"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.1, opacity: 0 }}
                        className="relative z-10 flex flex-col items-center w-full max-w-md"
                      >
                        <h2 className="text-4xl font-bold text-white mb-8">What should I call you?</h2>
                        <input
                          autoFocus
                          type="text"
                          placeholder="Enter a name..."
                          className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-2xl text-white placeholder-white/30 text-center outline-none focus:border-purple-500/50 focus:bg-white/15 transition-all mb-8"
                          value={onboardingName}
                          onChange={(e) => setOnboardingName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && finishOnboarding()}
                        />
                        <button
                          onClick={finishOnboarding}
                          disabled={!onboardingName.trim()}
                          className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25 transition-all"
                        >
                          Start Sharing
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Hidden Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileSelect} 
            />

            {/* Main Content */}
            <div className="relative w-full h-full flex flex-col mt-24 mb-32 min-h-[calc(100vh-12rem)] overflow-hidden z-10">
              <div className="flex-1 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  {peerList.length === 0 ? (
                    <motion.div 
                      key="waiting"
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center justify-center -translate-y-[200px] gpu-accelerated"
                    >
                      <h1 className={`text-4xl font-bold mb-4 transition-colors duration-300 ${settings.theme === 'light' ? 'text-[#000000]' : 'text-[#FFFFFF]'}`}>Waiting for users...</h1>
                      <p className={`text-xl font-medium transition-colors duration-300 ${settings.theme === 'light' ? 'text-[#000000]' : 'text-[#FFFFFF]'}`}>MeroDrop is searching for nearby devices</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="active"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="w-full flex flex-col items-center gpu-accelerated"
                      style={{ willChange: 'transform' }}
                    >
                      {/* Header */}
                      <div className="w-full flex flex-col items-center px-6 pointer-events-none select-none flex-shrink-0">
                        <motion.h1 
                          layout
                          className={`text-[30px] md:text-[40px] font-bold text-center mb-4 leading-tight drop-shadow-2xl transition-colors duration-300 ${settings.theme === 'light' ? 'text-[#000000]' : 'text-[#FFFFFF]'}`}
                        >
                          Open MeroDrop to share files easily!
                        </motion.h1>
                        <motion.p 
                          layout
                          className="text-[#9aa0a6] text-[14px] md:text-[18px] max-w-2xl text-center font-semibold transition-colors duration-300"
                        >
                          Simple, Fast, Private Sharing
                        </motion.p>
                      </div>

                      {/* Peer Grid */}
                      <div className="w-full px-8 flex items-center justify-center overflow-hidden mt-10">
                        <motion.div layout className="flex flex-wrap justify-center items-center gap-12 md:gap-20 max-w-[1200px] mx-auto w-full py-10">
                          <AnimatePresence mode="popLayout">
                            {peerList.map((peer) => (
                              <PeerAvatar 
                                key={peer.id} 
                                peer={peer} 
                                onClick={(p) => { selectedPeerId.current = p.id; fileInputRef.current?.click(); }} 
                                onContextMenu={(e, p) => setChatTarget(p)} 
                                isCompact={peerList.length >= 10}
                              />
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer / Identity */}
            <div className="fixed bottom-0 inset-x-0 flex flex-col items-center justify-end z-50 pointer-events-none pb-8">
              
              {/* Logo with 4 High-Energy Rings */}
              <div className="relative mb-4 pointer-events-auto cursor-pointer group" onClick={() => { setTempName(settings.deviceName); setIsEditingName(true); }}>
                {/* Radar Anchored to Logo */}
                <Radar theme={settings.theme} />
                
                <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ripple" style={{ animationDelay: '0s', willChange: 'transform, opacity' }} />
                <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ripple" style={{ animationDelay: '1s', willChange: 'transform, opacity' }} />
                <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ripple" style={{ animationDelay: '2s', willChange: 'transform, opacity' }} />
                <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ripple" style={{ animationDelay: '3s', willChange: 'transform, opacity' }} />
                
                <div className="relative w-16 h-16 bg-black/50 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center shadow-2xl z-10 transition-transform duration-300 group-hover:scale-110 gpu-accelerated">
                  <img src={LOGO_URL} alt="Logo" className="w-10 h-10 object-contain" />
                </div>
              </div>

              {/* Identity Pill */}
              <motion.div 
                className={`pointer-events-auto flex items-center cursor-pointer group px-6 py-3 rounded-full border backdrop-blur-md transition-colors gpu-accelerated shadow-2xl ${
                  settings.theme === 'light' 
                    ? 'bg-[#000000] border-black/10 hover:bg-black/90' 
                    : 'bg-[#FFFDD0] border-white/10 hover:bg-[#FFFDD0]/90'
                }`}
                onClick={() => { setTempName(settings.deviceName); setIsEditingName(true); }}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[13px] font-bold transition-colors duration-300 ${settings.theme === 'light' ? 'text-white' : 'text-black'}`}>You are known as:</span>
                  <div className={`flex items-center px-3 py-1.5 rounded-full transition-all border group-hover:border-primary/40 ${
                    settings.theme === 'light'
                      ? 'bg-[#ffffff]/10 group-hover:bg-[#ffffff]/20 border-white/10'
                      : 'bg-[#000000]/5 group-hover:bg-[#000000]/10 border-black/5'
                  }`}>
                    <span className={`font-black text-[13px] tracking-tight transition-colors duration-300 ${settings.theme === 'light' ? 'text-white' : 'text-black'}`}>{settings.deviceName}</span>
                    <Pencil size={12} className={`ml-2 transition-colors ${settings.theme === 'light' ? 'text-gray-400 group-hover:text-primary' : 'text-gray-500 group-hover:text-primary'}`} />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Identity Editor Modal */}
            <AnimatePresence>
              {isEditingName && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
                  <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      exit={{ scale: 0.9, opacity: 0 }} 
                      className="bg-[#1c1c1e] w-full max-w-md rounded-[32px] border border-white/10 p-10 flex flex-col items-center"
                  >
                    <h2 className="text-3xl font-black text-white mb-2 transition-colors duration-300">Change Identity</h2>
                    <input 
                      autoFocus 
                      type="text" 
                      maxLength={20} 
                      className="w-full bg-[#242426] px-6 py-4 text-white text-xl font-bold rounded-2xl border border-white/5 mb-8 outline-none focus:border-primary/50 transition-all duration-300" 
                      value={tempName} 
                      onChange={(e) => setTempName(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && saveIdentity()} 
                    />
                    <div className="flex w-full gap-4">
                      <button onClick={() => setIsEditingName(false)} className="flex-1 py-4 bg-[#2c2c2e] text-[#9aa0a6] font-bold rounded-full transition-colors duration-300">Cancel</button>
                      <button onClick={saveIdentity} className="flex-1 py-4 bg-primary text-white font-bold rounded-full flex items-center justify-center gap-2 transition-colors duration-300">Save</button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Chat Dialog */}
            <ChatDialog 
              peer={chatTarget} 
              onClose={() => setChatTarget(null)}
              onSendMessage={(text) => {
                if (!chatTarget) return;
                PeerService.sendChat(text, chatTarget.id);
                setChatTarget(null);
              }}
            />

            {/* File Progress */}
            <AnimatePresence>
              {activeTransfer && (
                <FileProgress 
                  transfer={activeTransfer} 
                  onAccept={() => {
                      setActiveTransfer(prev => prev ? { ...prev, status: 'transferring' } : null);
                  }}
                  onDecline={() => {
                      setActiveTransfer(null);
                  }}
                  onClose={() => setActiveTransfer(null)}
                />
              )}
            </AnimatePresence>

            {/* Incoming Chat Bubbles */}
            <div className="fixed top-24 right-6 z-[60] flex flex-col gap-4">
              <AnimatePresence>
                {incomingChats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    className="bg-[#1c1c1e]/90 backdrop-blur-md border border-white/10 p-4 rounded-[32px] shadow-2xl max-w-xs cursor-pointer"
                    onClick={() => {
                        setChatTarget(chat.peer);
                        setIncomingChats(prev => prev.filter(c => c.id !== chat.id));
                    }}
                  >
                      <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                              {chat.peer.name[0]}
                          </div>
                          <span className="text-white font-bold text-sm">{chat.peer.name}</span>
                      </div>
                      <p className="text-gray-300 text-sm">{chat.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Layout>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;
