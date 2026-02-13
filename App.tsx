
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import PeerJS, { DataConnection } from 'peerjs';
import { PeerData, TransferState, AppSettings } from './types';
import { dbService } from './services/db';
import { CHUNK_SIZE, MAX_DISCOVERY_SLOTS, LOGO_URL, ANIMAL_NAMES } from './constants';
import { Pencil, X, Check } from 'lucide-react';

import Radar from './components/Radar';
import PeerAvatar from './components/PeerAvatar';
import FileProgress from './components/FileProgress';
import ChatDialog from './components/ChatDialog';
import Layout from './components/Layout';

const SPRING_CONFIG = { type: "spring", stiffness: 300, damping: 25, mass: 0.8 } as const;

function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedName = localStorage.getItem('mero-name');
    return {
      deviceName: savedName || ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)],
      theme: 'dark'
    };
  });
  
  const [peers, setPeers] = useState<Record<string, PeerData>>({});
  const [connections, setConnections] = useState<Record<string, DataConnection>>({});
  const [myId, setMyId] = useState<string | null>(null);
  const [activeTransfer, setActiveTransfer] = useState<TransferState | null>(null);
  const [chatTarget, setChatTarget] = useState<PeerData | null>(null);
  const [incomingChats, setIncomingChats] = useState<{ peer: PeerData; text: string; id: string }[]>([]);
  
  // Identity UI States
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(settings.deviceName);

  const peerInstance = useRef<PeerJS | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedPeerId = useRef<string | null>(null);
  
  // Storage for chunks and pending files
  const incomingTransfers = useRef<Map<string, { chunks: ArrayBuffer[], receivedSize: number, metadata: any, chunkCount: number }>>(new Map());
  const pendingOutgoingFiles = useRef<Map<string, File>>(new Map());

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const init = async () => {
      const saved = await dbService.getSettings();
      const initialName = localStorage.getItem('mero-name') || saved.deviceName;
      setSettings(prev => ({ ...saved, deviceName: initialName }));
      setTempName(initialName);

      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        // Fixed: Escaped the forward slash in regex to prevent SyntaxError
        const ipHash = btoa(data.ip).slice(0, 8).replace(/[\/+=]/g, '');
          initDiscovery(ipHash, initialName);
        } catch (e) {
          initDiscovery('local-net', initialName);
        }
      };
      init();
      return () => {
        if (peerInstance.current) {
          peerInstance.current.destroy();
        }
      };
    }, []);

  const initDiscovery = async (ipHash: string, name: string) => {
    for (let i = 0; i < MAX_DISCOVERY_SLOTS; i++) {
      const targetId = `md-${ipHash}-${i}`;
      const success = await tryJoin(targetId, name, ipHash, i);
      if (success) break;
    }
  };

  const tryJoin = (id: string, name: string, ipHash: string, slot: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const peer = new PeerJS(id, {
        debug: 0,
        config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
      });

      peer.on('open', (id) => {
        setMyId(id);
        peerInstance.current = peer;
        for (let i = 0; i < MAX_DISCOVERY_SLOTS; i++) {
          if (i === slot) continue;
          const otherId = `md-${ipHash}-${i}`;
          setupConn(peer.connect(otherId, { 
            metadata: { 
              type: 'HANDSHAKE',
              name: localStorage.getItem('mero-name') || settings.deviceName 
            } 
          }));
        }
        resolve(true);
      });

      peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          peer.destroy();
          resolve(false);
        } else {
          resolve(false);
        }
      });

      peer.on('connection', (conn) => {
        setupConn(conn);
      });
    });
  };

  const setupConn = (conn: DataConnection) => {
    if (Object.keys(connections).length >= 50) {
      conn.close();
      return;
    }

    conn.on('open', () => {
      // Robust self-connection check
      if (conn.peer === myId || conn.peer === peerInstance.current?.id) {
        conn.close();
        return;
      }
      
      // Strict unique peer check using current peers state
      setPeers(prev => {
        if (prev[conn.peer]) return prev;
        
        const initialName = (conn.metadata as any)?.name || ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)];
        return {
          ...prev,
          [conn.peer]: { id: conn.peer, name: initialName, deviceType: 'desktop' }
        };
      });

      setConnections(prev => ({ ...prev, [conn.peer]: conn }));
      
      // Immediately send handshake on open
      conn.send(JSON.stringify({ 
        type: 'HANDSHAKE', 
        name: localStorage.getItem('mero-name') || settings.deviceName,
        deviceType: 'desktop'
      }));
    });

    conn.on('data', (data: any) => {
      // Protocol Switchboard: Binary vs JSON
      if (typeof data === 'string') {
        try {
          const msg = JSON.parse(data);
          
          if (msg.type === 'NAME_SYNC' || msg.type === 'NAME_UPDATE' || msg.type === 'IDENTITY_SYNC' || msg.type === 'HANDSHAKE') {
            setPeers(prev => ({
              ...prev,
              [conn.peer]: {
                ...prev[conn.peer],
                id: conn.peer,
                name: msg.name || prev[conn.peer]?.name || 'Peer',
                deviceType: msg.deviceType || prev[conn.peer]?.deviceType || 'desktop'
              }
            }));
          } else if (msg.type === 'TRANSFER_HEADER') {
            // New Incoming File
            incomingTransfers.current.set(conn.peer, { chunks: [], receivedSize: 0, metadata: msg, chunkCount: 0 });
            setActiveTransfer({
              id: msg.id, peerId: conn.peer, fileName: msg.name, fileSize: msg.size,
              fileType: msg.mime, progress: 0, status: 'pending', direction: 'incoming'
            });
          } else if (msg.type === 'FILE_ACCEPTED') {
            const file = pendingOutgoingFiles.current.get(msg.id);
            if (file) {
              streamFile(file, conn.peer, msg.id);
              pendingOutgoingFiles.current.delete(msg.id);
            }
          } else if (msg.type === 'FILE_DECLINED') {
            setActiveTransfer(null);
            toast.error("File transfer declined");
          } else if (msg.type === 'TRANSFER_PROGRESS') {
            // Update local progress based on receiver's report
            if (activeTransfer && activeTransfer.id === msg.id) {
              setActiveTransfer(prev => prev ? { ...prev, progress: msg.progress, speed: msg.speed } : null);
            }
          } else if (msg.type === 'chat') {
            // Fix: Ensure the sender object matches PeerData interface by providing a default deviceType
            const sender: PeerData = peers[conn.peer] || { id: conn.peer, name: 'Peer', deviceType: 'desktop' };
            setIncomingChats(prev => [...prev, { peer: sender, text: msg.payload, id: crypto.randomUUID() }]);
          }
        } catch (e) {
          console.error("Signal error:", e);
        }
      } else if (data instanceof ArrayBuffer) {
        // Binary chunk received - Restore processing
        handleIncomingBinary(conn.peer, data);
      }
    });

    conn.on('close', () => {
      setPeers(prev => { const n = { ...prev }; delete n[conn.peer]; return n; });
      setConnections(prev => { const n = { ...prev }; delete n[conn.peer]; return n; });
      incomingTransfers.current.delete(conn.peer);
    });
  };

  const handleIncomingBinary = (peerId: string, chunk: ArrayBuffer) => {
    const transfer = incomingTransfers.current.get(peerId);
    if (!transfer || !activeTransfer || activeTransfer.status !== 'transferring') return;
    
    transfer.chunks.push(chunk);
    transfer.receivedSize += chunk.byteLength;
    transfer.chunkCount++;
    
    const progress = (transfer.receivedSize / transfer.metadata.size) * 100;
    const speed = `${(transfer.receivedSize / (1024 * 1024)).toFixed(1)} MB received`;
    
    setActiveTransfer(prev => prev ? { ...prev, progress, speed } : null);

    // Sync progress back to sender every 10 chunks
    if (transfer.chunkCount % 10 === 0) {
      const conn = connections[peerId];
      if (conn?.open) {
        conn.send(JSON.stringify({ 
          type: 'TRANSFER_PROGRESS', 
          id: transfer.metadata.id, 
          progress, 
          speed 
        }));
      }
    }
    
    if (transfer.receivedSize >= transfer.metadata.size) {
      finalizeReceiverDownload(peerId);
    }
  };

  const finalizeReceiverDownload = (peerId: string) => {
    const transfer = incomingTransfers.current.get(peerId);
    if (!transfer) return;
    
    try {
      // Robust reassembly and download
      const blob = new Blob(transfer.chunks, { type: transfer.metadata.mime || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = transfer.metadata.name;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        incomingTransfers.current.delete(peerId);
      }, 300);

      setActiveTransfer(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null);
      setTimeout(() => setActiveTransfer(null), 3000);
    } catch (err) {
      setActiveTransfer(prev => prev ? { ...prev, status: 'error', error: 'Download failed' } : null);
    }
  };

  const initiateSend = (file: File, pid: string) => {
    const conn = connections[pid];
    if (!conn?.open) return;
    
    const tid = crypto.randomUUID();
    pendingOutgoingFiles.current.set(tid, file);
    
    conn.send(JSON.stringify({ 
      type: 'TRANSFER_HEADER', id: tid, name: file.name, size: file.size, mime: file.type 
    }));
    
    setActiveTransfer({
      id: tid, peerId: pid, fileName: file.name, fileSize: file.size, 
      fileType: file.type, progress: 0, status: 'pending', direction: 'outgoing'
    });
  };

  const streamFile = async (file: File, pid: string, tid: string) => {
    const conn = connections[pid];
    if (!conn?.open) return;

    const dc = (conn as any).dataChannel as RTCDataChannel;
    if (!dc) return;

    setActiveTransfer(prev => prev ? { ...prev, status: 'transferring' } : null);
    let offset = 0;

    const sendNextChunk = () => {
      if (!conn.open || offset >= file.size) {
        if (offset >= file.size) {
          setActiveTransfer(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null);
          setTimeout(() => setActiveTransfer(null), 3000);
        }
        return;
      }

      // Check buffer before sending
      if (dc.bufferedAmount > 1024 * 1024) { // 1MB buffer limit
        return;
      }

      const reader = new FileReader();
      const blob = file.slice(offset, offset + CHUNK_SIZE);
      
      reader.onload = (e) => {
        if (!e.target?.result) return;
        const buffer = e.target.result as ArrayBuffer;
        conn.send(buffer);
        offset += buffer.byteLength;

        if (offset < file.size) {
          if (dc.bufferedAmount > 1024 * 1024) {
            // Wait for buffer to drain
            const checkBuffer = () => {
              if (dc.bufferedAmount < 512 * 1024) {
                sendNextChunk();
              } else {
                setTimeout(checkBuffer, 50);
              }
            };
            checkBuffer();
          } else {
            // Send next chunk quickly
            setTimeout(sendNextChunk, 1);
          }
        } else {
          sendNextChunk(); // Finalize
        }
      };
      reader.readAsArrayBuffer(blob);
    };

    // Set threshold for bufferedAmountLow if available
    if ('bufferedAmountLowThreshold' in dc) {
      dc.bufferedAmountLowThreshold = 512 * 1024; // 512KB
      dc.onbufferedamountlow = () => {
        sendNextChunk();
      };
    }

    sendNextChunk();
  };

  const saveIdentity = () => {
    if (!tempName || !tempName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    const cleanName = tempName.trim();
    const updated = { ...settings, deviceName: cleanName };
    setSettings(updated);
    dbService.saveSettings(updated);
    localStorage.setItem('mero-name', cleanName);
    
    Object.values(connections).forEach(c => {
      if (c.open) c.send(JSON.stringify({ type: 'NAME_UPDATE', name: cleanName, deviceType: 'desktop' }));
    });
    
    setIsEditingName(false);
    toast.success("Identity Updated");
  };

  const handleAcceptTransfer = () => {
    if (!activeTransfer) return;
    const conn = connections[activeTransfer.peerId];
    if (conn?.open) {
      conn.send(JSON.stringify({ type: 'FILE_ACCEPTED', id: activeTransfer.id }));
      setActiveTransfer(prev => prev ? { ...prev, status: 'transferring' } : null);
    }
  };

  const handleDeclineTransfer = () => {
    if (!activeTransfer) return;
    const conn = connections[activeTransfer.peerId];
    if (conn?.open) conn.send(JSON.stringify({ type: 'FILE_DECLINED', id: activeTransfer.id }));
    incomingTransfers.current.delete(activeTransfer.peerId);
    setActiveTransfer(null);
  };

  const peerList = useMemo(() => {
    if (!myId) return [];
    return Object.values(peers).filter(p => p.id !== myId && p.id !== undefined && p.id !== null);
  }, [peers, myId]);

  return (
    <Layout settings={settings} toggleTheme={() => {
      const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
      setSettings(prev => ({ ...prev, theme: newTheme }));
      dbService.saveSettings({ ...settings, theme: newTheme });
    }} onOpenSettings={() => {}} onOpenHistory={() => {}}>
      <Toaster position="bottom-center" />
      
      <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
          if (e.target.files?.[0] && selectedPeerId.current) {
            initiateSend(e.target.files[0], selectedPeerId.current);
          }
          e.target.value = '';
        }} 
      />
      
      <Radar />

      <div className="relative w-full h-full flex flex-col mt-24 mb-24 min-h-[calc(100vh-12rem)] overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {peerList.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col items-center justify-center"
            >
              <h1 className="text-black text-4xl font-bold mb-4">Waiting for users...</h1>
              <p className="text-[#9aa0a6] text-xl font-medium">MeroDrop is searching for nearby devices</p>
            </motion.div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Header Spacer / Title Area */}
              <div className="w-full flex flex-col items-center px-6 pointer-events-none select-none z-10 flex-shrink-0 transition-all duration-700 ease-in-out">
                <motion.h1 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: (window.innerWidth < 768 ? 0.5 : 0.7)
                  }} 
                  className="text-[42px] md:text-[56px] font-black text-primary text-center mb-4 leading-tight drop-shadow-2xl origin-center"
                >
                  Open MeroDrop to share files easily!
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }} 
                  animate={{ 
                    opacity: 1,
                    scale: (window.innerWidth < 768 ? 0.5 : 0.7),
                    y: -10
                  }} 
                  transition={{ delay: 0.2 }} 
                  className="text-[#9aa0a6] text-[19px] md:text-[25px] max-w-2xl text-center font-semibold origin-center"
                >
                  Simple, Fast, Private Sharing
                </motion.p>
              </div>

              {/* Peer Grid Zone */}
              <div className="w-full px-8 flex items-center justify-center overflow-hidden">
                <motion.div 
                  layout 
                  className={`flex flex-wrap justify-center items-center gap-12 md:gap-20 max-w-[1200px] mx-auto w-full py-10 transition-all duration-500 ${peerList.length >= 10 ? 'scale-75 gap-6 md:gap-10' : peerList.length > 12 ? 'scale-75 gap-8 md:gap-12' : 'scale-100'}`}
                >
                  <AnimatePresence mode="popLayout">
                    {peerList.map((peer) => (
                      <PeerAvatar 
                        key={peer.id} 
                        peer={peer} 
                        progress={activeTransfer?.peerId === peer.id ? activeTransfer.progress : 0} 
                        onClick={(p) => { selectedPeerId.current = p.id; fileInputRef.current?.click(); }} 
                        onContextMenu={(e, p) => setChatTarget(p)} 
                        isCompact={peerList.length >= 10}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PROFILE SECTION: ENTIRE BLOCK TRIGGER EDITING */}
      <div className="fixed bottom-0 inset-x-0 h-24 flex flex-col items-center justify-center z-50 bg-gradient-to-t from-black to-transparent pointer-events-none">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto flex items-center cursor-pointer group px-6 h-full" 
          onClick={() => { setTempName(settings.deviceName); setIsEditingName(true); }}
        >
          <div className="relative w-12 h-12 mr-4 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ripple" style={{ animationDuration: '4s' }} />
            <div className="relative z-10 w-10 h-10 bg-[#1c1c1e] rounded-full flex items-center justify-center shadow-lg border border-primary/40 group-hover:scale-110 group-hover:border-primary transition-all duration-500 overflow-hidden">
              <img src={LOGO_URL} alt="MeroDrop Logo" className="w-6 h-6 object-contain" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#9aa0a6] text-[15px] font-bold group-hover:text-white transition-colors">You are known as:</span>
            <div className="flex items-center bg-[#202124] group-hover:bg-[#2d2e31] px-4 py-2 rounded-xl transition-all border border-white/5 group-hover:border-primary/40 active:scale-95">
              <span className="text-white font-black text-[15px] tracking-tight">{settings.deviceName}</span>
              <Pencil size={14} className="ml-2.5 text-[#9aa0a6] group-hover:text-primary transition-colors" />
            </div>
            <div className="bg-[#22c55e] px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-[0.1em] ml-2">Connected</div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isEditingName && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-[#1c1c1e] w-full max-w-md rounded-[40px] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,1)] p-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8"><Pencil className="w-8 h-8 text-primary" /></div>
              <h2 className="text-3xl font-black text-white mb-2">Change Identity</h2>
              <p className="text-[#9aa0a6] font-medium mb-8 text-center">Update your name to be discoverable by nearby peers.</p>
              <div className="w-full bg-[#242426] rounded-[24px] p-2 border border-white/5 focus-within:border-primary/50 transition-all mb-8 shadow-inner">
                <input autoFocus type="text" maxLength={20} className="w-full bg-transparent px-6 py-4 text-white text-xl font-bold outline-none placeholder-[#444]" placeholder="Enter Name" value={tempName} onChange={(e) => setTempName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveIdentity()} />
              </div>
              <div className="flex w-full gap-4">
                <button onClick={() => setIsEditingName(false)} className="flex-1 py-5 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[#9aa0a6] font-black text-[14px] uppercase tracking-widest rounded-3xl transition-all active:scale-95">Cancel</button>
                <button onClick={saveIdentity} className="flex-1 py-5 bg-primary hover:bg-primary/90 text-white font-black text-[14px] uppercase tracking-widest rounded-3xl transition-all shadow-2xl shadow-primary/30 active:scale-95 flex items-center justify-center gap-2"><Check className="w-5 h-5" /> Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ChatDialog 
        peer={chatTarget} 
        onClose={() => setChatTarget(null)}
        onSendMessage={(text) => {
          if (!chatTarget) return;
          const conn = connections[chatTarget.id];
          if (conn?.open) {
            conn.send(JSON.stringify({ type: 'chat', payload: text }));
          }
        }}
      />

      <AnimatePresence>
        {activeTransfer && (
          <FileProgress 
            transfer={activeTransfer} 
            onAccept={handleAcceptTransfer}
            onDecline={handleDeclineTransfer}
            onClose={() => setActiveTransfer(null)}
          />
        )}
      </AnimatePresence>

      <div className="fixed top-24 right-6 z-[60] flex flex-col gap-4">
        <AnimatePresence>
          {incomingChats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="bg-[#1c1c1e]/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl max-w-xs cursor-pointer"
              onClick={() => {
                setChatTarget(chat.peer);
                setIncomingChats(prev => prev.filter(c => c.id !== chat.id));
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-primary">{chat.peer.name}</span>
              </div>
              <p className="text-white text-sm font-medium line-clamp-2">{chat.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

export default App;
