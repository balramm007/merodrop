import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Pencil } from 'lucide-react';

import PeerService from './services/peer';
import { dbService } from './services/db';
import { LOGO_URL, SPLASH_LOGO_URL, ANIMAL_NAMES } from './constants';
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
  const [resourcesReady, setResourcesReady] = useState(false);

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
  const [typingPeers, setTypingPeers] = useState<Set<string>>(new Set());

  // Identity UI State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(settings.deviceName);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedPeerId = useRef<string | null>(null);
  const lastProcessedMessageId = useRef<string | null>(null);
  const processedChatIds = useRef<Set<string>>(new Set());

  // --- Initialization ---
  useEffect(() => {
    // 1. Preload Splash Logo
    const img = new Image();
    img.src = SPLASH_LOGO_URL;
    img.onload = () => {
      // 2. Double-RAF to ensure browser painting is ready before starting timer
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
           setResourcesReady(true);
        });
      });
    };
  }, []);

  useEffect(() => {
    // 2. Splash Screen Timer + Resource Check
    if (resourcesReady) {
      // Wait for at least the pop animation to finish + hold (2000ms total)
      // This ensures we don't cut the animation short even if resources load instantly
      const timer = setTimeout(() => setIsAppLoading(false), 2000); 
      return () => clearTimeout(timer);
    }
  }, [resourcesReady]);

  // Sync theme with HTML class whenever it changes
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    // 1. Load Settings
    const loadSettings = async () => {
      // Clean up privacy data on mount (Session Only)
      await dbService.clearSessionData();

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
      // Lookup sender name immediately
      const senderName = data.senderName || peers[data.peerId]?.name || 'Anonymous';

      setActiveTransfer({
        fileId: data.fileId,
        peerId: data.peerId,
        peerName: senderName,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        progress: 0,
        speed: 0,
        status: 'pending',
        direction: 'incoming',
        origin: data.origin // Set origin from metadata
      });

      // If origin is chat, add a pending history item so it shows in chat bubble
      if (data.origin === 'chat') {
         dbService.addHistory({
            id: data.fileId,
            fileName: data.fileName,
            fileSize: data.fileSize,
            fileType: data.fileType || 'application/octet-stream',
            peerName: senderName,
            peerId: data.peerId,
            timestamp: Date.now(),
            direction: 'incoming',
            origin: 'chat',
            status: 'pending'
         });
      }
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
      // FIX: Use new Blob([data.file]) to prevent .txt extension bug
      // We rely on the download attribute for the filename and extension
      const blob = new Blob([data.file]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // FIX: Use original fileName
      a.download = data.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Add to History
      const peer = peers[data.peerId];
      dbService.addHistory({
        id: data.fileId || crypto.randomUUID(),
        fileName: data.fileName || 'unknown',
        fileSize: data.file.size || 0,
        fileType: data.fileType || 'application/octet-stream',
        peerName: peer ? peer.name : 'Unknown',
        peerId: data.peerId, // Added peerId
        timestamp: Date.now(),
        direction: 'incoming'
      });

      toast.success("File Received!");
      setActiveTransfer(null);
    };

  const handleChatReceived = (data: any) => {
        // Deduplication using Set and Ref
        if (processedChatIds.current.has(data.id) || lastProcessedMessageId.current === data.id) return;
        processedChatIds.current.add(data.id);
        
        lastProcessedMessageId.current = data.id;

        // Access latest peers state to identify sender correctly without stale closure issues
        setPeers(currentPeers => {
            const sender = currentPeers[data.peerId] || { id: data.peerId, name: 'Unknown', device: 'Unknown', deviceType: 'desktop' };
            
            // 3. Save to history
            dbService.addHistory({
              id: data.id,
              fileName: 'Chat Message',
              text: data.text,
              fileSize: data.text.length,
              fileType: 'text/plain',
              peerName: data.senderName || sender.name || 'Unknown', // Use propagated sender name
              peerId: data.peerId, // Added peerId
              timestamp: Date.now(),
              direction: 'incoming'
            });

            setIncomingChats(prev => {
              // Ensure we don't add duplicates to state if they somehow got through
              if (prev.some(c => c.id === data.id)) return prev;

              const newChat = { peer: sender, text: data.text, id: data.id };
              const updated = [...prev, newChat].slice(-5); // Keep last 5
              return updated;
            });

            // Set timeout to remove this specific message
            setTimeout(() => {
              setIncomingChats(current => current.filter(c => c.id !== data.id));
            }, 8000);

            return currentPeers;
        });
    };

    const handleTypingUpdate = ({ peerId, isTyping }: { peerId: string; isTyping: boolean }) => {
      setTypingPeers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(peerId);
        } else {
          newSet.delete(peerId);
        }
        return newSet;
      });
    };

    // 4. Subscribe
    PeerService.on('open', handleOpen);
    PeerService.on('peer-found', handlePeerFound);
    PeerService.on('peer-disconnected', handlePeerDisconnected);
    PeerService.on('incoming-file-request', handleIncomingFileRequest);
    PeerService.on('transfer-progress', handleTransferProgress);
    PeerService.on('file-received', handleFileReceived);
    PeerService.on('chat-received', handleChatReceived);
    PeerService.on('peer-updated', handlePeerUpdated);
    PeerService.on('typing-update', handleTypingUpdate);

    // 5. Cleanup
    return () => {
      PeerService.off('open', handleOpen);
      PeerService.off('peer-found', handlePeerFound);
      PeerService.off('peer-disconnected', handlePeerDisconnected);
      PeerService.off('incoming-file-request', handleIncomingFileRequest);
      PeerService.off('transfer-progress', handleTransferProgress);
      PeerService.off('file-received', handleFileReceived);
      PeerService.off('chat-received', handleChatReceived);
      PeerService.off('peer-updated', handlePeerUpdated);
      PeerService.off('typing-update', handleTypingUpdate);
    };
  }, [showOnboarding, settings.deviceName]); 

  // File Transfer Auto-Dismiss
  useEffect(() => {
    // Dismiss if completed, error, or declined
    if (activeTransfer && ['completed', 'error', 'declined', 'cancelled'].includes(activeTransfer.status)) {
      const timer = setTimeout(() => {
        setActiveTransfer(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeTransfer?.status]);

  // Chat Auto-Dismiss (15s)
  useEffect(() => {
    if (incomingChats.length > 0) {
      const timer = setTimeout(() => {
        setIncomingChats([]);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [incomingChats]); 

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
      // ORIGIN: 'main'
      const fileId = PeerService.sendFile(file, selectedPeerId.current, 'main');
      
      if (fileId) {
          const targetPeer = peers[selectedPeerId.current];
          setActiveTransfer({
            fileId: fileId,
            peerId: selectedPeerId.current,
            peerName: targetPeer?.name || 'Unknown',
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            progress: 0,
            speed: 0,
            status: 'pending', // Waiting for acceptance
            direction: 'outgoing',
            origin: 'main'
          });
          
          toast.success(`Requesting to send ${file.name}...`);
      }
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

  const handleAcceptTransfer = (fileId?: string, peerId?: string) => {
    // 1. Specific Transfer (e.g. from Chat)
    if (fileId && peerId) {
        PeerService.acceptTransfer(fileId, peerId);
        // Also update activeTransfer if it matches
        if (activeTransfer && activeTransfer.fileId === fileId) {
            setActiveTransfer(prev => prev ? { ...prev, status: 'transferring' } : null);
        }
        return;
    }

    // 2. Global Active Transfer
    if (!activeTransfer) return;
    PeerService.acceptTransfer(activeTransfer.fileId, activeTransfer.peerId);
    setActiveTransfer(prev => prev ? { ...prev, status: 'transferring' } : null);
  };

  const handleDeclineTransfer = (fileId?: string, peerId?: string) => {
    // 1. Specific Transfer
    if (fileId && peerId) {
        PeerService.declineTransfer(fileId, peerId);
        dbService.updateHistoryStatus(fileId, 'declined');
         if (activeTransfer && activeTransfer.fileId === fileId) {
            setActiveTransfer(null);
        }
        return;
    }

    // 2. Global Active Transfer
    if (!activeTransfer) return;
    PeerService.declineTransfer(activeTransfer.fileId, activeTransfer.peerId);
    dbService.updateHistoryStatus(activeTransfer.fileId, 'declined');
    setActiveTransfer(null);
  };

  const peerList = useMemo(() => Object.values(peers), [peers]);

  // Group incoming chats by peer for Stacked UI
  const groupedChats = useMemo(() => {
    const groups: Record<string, typeof incomingChats> = {};
    incomingChats.forEach(chat => {
      if (!groups[chat.peer.id]) {
        groups[chat.peer.id] = [];
      }
      groups[chat.peer.id].push(chat);
    });
    return groups;
  }, [incomingChats]);

  // --- Render ---
  return (
    <AnimatePresence mode="wait">
      {isAppLoading ? (
        <SplashScreen key="splash" theme={settings.theme} />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
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

            {/* Global Background Radar - Fixed Position via CSS */}
            <Radar theme={settings.theme} />

            {/* Main Content */}
            <div className="relative w-full h-full flex flex-col min-h-[calc(100vh-12rem)] overflow-hidden z-10">
              <div className="flex-1 flex flex-col items-center justify-center pb-20">
                
                {/* Header Section - Slides up when peers are found */}
                <motion.div
            layout
            initial={{ y: 0, scale: 1 }}
            animate={{ 
                y: peerList.length > 0 ? -200 : 0, 
                scale: peerList.length > 0 ? 0.6 : 1 
            }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex flex-col items-center z-20 relative max-w-4xl px-4 will-change-transform gpu-accelerated"
        >
            <h1 className={`text-4xl md:text-6xl font-bold mb-6 text-center tracking-tight transition-colors duration-300 leading-tight ${settings.theme === 'light' ? 'text-[#000000]' : 'text-[#ffffff]'}`}>
                Open MeroDrop to share files easily!
            </h1>
            <p className="text-lg md:text-2xl text-gray-500 dark:text-gray-400 font-medium max-w-md text-center">
                Simple, Fast, Private Sharing
            </p>
        </motion.div>

                {/* Dynamic Content Area */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <AnimatePresence mode="wait">
                        {peerList.length === 0 ? (
                            null
                        ) : (
                            <motion.div 
                                key="grid"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                className="w-full px-8 flex items-center justify-center pointer-events-auto mt-20"
                            >
                                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 max-w-[1200px] mx-auto w-full">
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
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

              </div>
            </div>

            {/* Footer / Identity */}
            <div className="fixed bottom-0 inset-x-0 flex flex-col items-center justify-end z-50 pointer-events-none pb-8">
              
              {/* Logo with 4 High-Energy Rings */}
              <div className="relative mb-4 pointer-events-auto group">
                {/* Global Radar Anchored Here */}
                <Radar theme={settings.theme} />
                
                {/* Ripple Animations */}
                <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ripple" style={{ animationDelay: '0s', willChange: 'transform, opacity' }} />
                <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ripple" style={{ animationDelay: '1s', willChange: 'transform, opacity' }} />
                <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ripple" style={{ animationDelay: '2s', willChange: 'transform, opacity' }} />
                <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ripple" style={{ animationDelay: '3s', willChange: 'transform, opacity' }} />
                
                <div className="relative w-16 h-16 bg-black/50 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center shadow-2xl z-10 transition-transform duration-300 group-hover:scale-110 gpu-accelerated animate-logo-beat overflow-hidden">
                  <img src={LOGO_URL} alt="Logo" className="w-14 h-14 rounded-full object-contain" />
                </div>
              </div>

              {/* Identity Pill */}
              <motion.div 
                className={`pointer-events-auto flex items-center cursor-pointer group px-6 py-3 rounded-full border backdrop-blur-md transition-colors gpu-accelerated shadow-2xl ${
                  settings.theme === 'light' 
                    ? 'bg-[#000000] border-white/10 hover:bg-black/90' 
                    : 'bg-[#fcf7f0] border-black/10 hover:bg-[#fcf7f0]/90'
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
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/30 backdrop-blur-2xl">
                  <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      exit={{ scale: 0.9, opacity: 0 }} 
                      className="bg-[#1c1c1e]/80 backdrop-blur-xl w-full max-w-md rounded-[32px] border border-white/10 p-10 flex flex-col items-center shadow-2xl"
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
                      <button onClick={() => setIsEditingName(false)} className="flex-1 py-4 bg-[#2c2c2e] text-[#9aa0a6] font-bold rounded-full transition-colors duration-300 hover:bg-[#3a3a3c]">Cancel</button>
                      <button onClick={saveIdentity} className="flex-1 py-4 bg-gradient-to-r from-blue-900 to-green-900 text-white font-bold rounded-full flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 active:scale-95">Save</button>
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
              }}
              onAcceptFile={(fileId) => {
                 if (!chatTarget) return;
                 handleAcceptTransfer(fileId, chatTarget.id);
              }}
              onDeclineFile={(fileId) => {
                 if (!chatTarget) return;
                 handleDeclineTransfer(fileId, chatTarget.id);
              }}
              onSendFile={(file) => {
                if (!chatTarget) return undefined;
                // ORIGIN: 'chat'
                const fileId = PeerService.sendFile(file, chatTarget.id, 'chat');
                if (fileId) {
                    // We do NOT set activeTransfer here to avoid the main popup!
                    // Chat handles its own UI via HistoryItem
                    
                    toast.success(`Sending ${file.name}...`);
                    
                    // Add to local history with origin 'chat'
                    dbService.addHistory({
                        id: fileId,
                        fileName: file.name,
                        text: '', // Empty for file
                        fileSize: file.size,
                        fileType: file.type || 'application/octet-stream',
                        peerName: chatTarget.name,
                        peerId: chatTarget.id,
                        timestamp: Date.now(),
                        direction: 'outgoing',
                        origin: 'chat',
                        status: 'pending'
                    });
                }
                return fileId;
              }}
              isTyping={chatTarget ? typingPeers.has(chatTarget.id) : false}
            />

            {/* File Progress (Only show if origin is 'main') */}
            <AnimatePresence>
              {activeTransfer && activeTransfer.origin === 'main' && (
                <FileProgress 
                  transfer={activeTransfer} 
                  onAccept={handleAcceptTransfer}
                  onDecline={handleDeclineTransfer}
                  onClose={() => setActiveTransfer(null)}
                />
              )}
            </AnimatePresence>

            {/* Incoming Chat Stacks */}
            <div className="fixed top-24 right-4 md:right-8 z-[60] flex flex-col gap-6 pointer-events-none items-end max-w-[calc(100vw-32px)]">
              <AnimatePresence mode="popLayout">
                {Object.entries(groupedChats).map(([peerId, chats]) => {
                  const latestChat = chats[chats.length - 1];
                  const count = chats.length;
                  
                  return (
                    <motion.div
                      key={peerId}
                      layout
                      initial={{ x: 100, opacity: 0, scale: 0.8 }}
                      animate={{ x: 0, opacity: 1, scale: 1 }}
                      exit={{ x: 100, opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="relative cursor-pointer pointer-events-auto group perspective-1000"
                      onClick={() => {
                        setChatTarget(latestChat.peer);
                        // Clear chats for this peer as we are opening the dialog
                        setIncomingChats(prev => prev.filter(c => c.peer.id !== peerId));
                      }}
                    >
                      {/* Visual Stack Layers */}
                      {count > 1 && (
                         <div className="absolute top-1 left-1 w-full h-full bg-white/10 dark:bg-white/5 rounded-[24px] border border-white/5 -z-10 transform translate-x-1 translate-y-1" />
                      )}
                      {count > 2 && (
                         <div className="absolute top-2 left-2 w-full h-full bg-white/5 dark:bg-white/5 rounded-[24px] border border-white/5 -z-20 transform translate-x-2 translate-y-2" />
                      )}

                      <div className="bg-[#1c1c1e]/90 backdrop-blur-md border border-white/10 p-5 rounded-[24px] shadow-2xl w-full max-w-[340px] md:w-80 transition-transform group-hover:scale-[1.02] group-active:scale-95">
                          <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
                                  {latestChat.peer.name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-white font-bold text-[15px] block truncate">{latestChat.peer.name}</span>
                                    {count > 1 && (
                                      <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-blue-500/40 shrink-0">
                                        {count}
                                      </span>
                                    )}
                                </div>
                                <span className="text-gray-400 text-xs font-medium">
                                  {latestChat.peer.deviceType || 'Device'}
                                </span>
                              </div>
                          </div>
                          <p className="text-gray-200 text-[15px] font-medium leading-relaxed line-clamp-2 pl-1">
                            {latestChat.text}
                          </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </Layout>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;
