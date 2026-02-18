import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Send, MessageSquare, FileText, ArrowDown, Plus, ArrowUp } from 'lucide-react';
import { PeerData, HistoryItem } from '../types';
import { dbService } from '../services/db';
import PeerService from '../services/peer';
import { toast } from 'react-hot-toast';

interface Props {
  peer: PeerData | null;
  onSendMessage: (text: string) => void;
  onSendFile?: (file: File) => string | undefined;
  onAcceptFile?: (fileId: string) => void;
  onDeclineFile?: (fileId: string) => void;
  onClose: () => void;
  isTyping?: boolean;
}

const ChatDialog: React.FC<Props> = ({ peer, onSendMessage, onSendFile, onAcceptFile, onDeclineFile, onClose, isTyping }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load history and subscribe to new messages
  useEffect(() => {
    if (peer) {
      loadHistory();
      
      const handleNewChat = (data: { peerId: string, text: string, id: string }) => {
        if (data.peerId === peer.id) {
          const newItem: HistoryItem = {
            id: data.id,
            fileName: 'Chat Message',
            text: data.text,
            fileSize: data.text.length,
            fileType: 'text/plain',
            peerName: peer.name,
            peerId: peer.id,
            timestamp: Date.now(),
            direction: 'incoming',
            origin: 'chat'
          };
          setHistory(prev => [...prev, newItem]);
          setTimeout(scrollToBottom, 100);
        }
      };

      PeerService.on('chat-received', handleNewChat);

      const handleIncomingFile = (data: any) => {
        if (data.peerId === peer.id && data.origin === 'chat') {
             const newItem: HistoryItem = {
                id: data.fileId,
                fileName: data.fileName,
                text: '',
                fileSize: data.fileSize,
                fileType: data.fileType,
                peerName: peer.name,
                peerId: peer.id,
                timestamp: Date.now(),
                direction: 'incoming',
                origin: 'chat',
                status: 'pending',
                progress: 0
             };
             setHistory(prev => {
                 if (prev.some(item => item.id === newItem.id)) return prev;
                 return [...prev, newItem];
             });
             setTimeout(scrollToBottom, 100);
        }
      };
      PeerService.on('incoming-file-request', handleIncomingFile);

      const handleTransferUpdate = (data: any) => {
          setHistory(prev => prev.map(item => {
              if (item.id === data.fileId) {
                  return { ...item, status: data.status, progress: data.progress };
              }
              return item;
          }));
      };
      
      const handleFileReceived = (data: any) => {
          setHistory(prev => prev.map(item => {
              if (item.id === data.fileId) {
                  return { ...item, status: 'completed' };
              }
              return item;
          }));
      };

      PeerService.on('transfer-progress', handleTransferUpdate);
      PeerService.on('file-received', handleFileReceived);

      // Auto-focus input
      setTimeout(() => inputRef.current?.focus(), 300);

      return () => {
        PeerService.off('chat-received', handleNewChat);
        PeerService.off('incoming-file-request', handleIncomingFile);
        PeerService.off('transfer-progress', handleTransferUpdate);
        PeerService.off('file-received', handleFileReceived);
      };
    }
  }, [peer]);

  // Scroll to bottom when typing status changes
  useEffect(() => {
    if (isTyping) {
      scrollToBottom();
    }
  }, [isTyping]);

  const loadHistory = async () => {
    if (!peer) return;
    const allHistory = await dbService.getHistory();
    // Filter for this peer
    const peerHistory = allHistory
      .filter(item => item.peerName === peer.name || item.peerId === peer.id) // Check both just in case
      .slice(0, 5) // Keep only last 5
      .reverse(); // Newest is first in getHistory, reverse to show oldest at top

    setHistory(peerHistory);
    setTimeout(scrollToBottom, 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    
    // Optimistically add to history
    if (peer) {
        const tempItem: HistoryItem = {
            id: crypto.randomUUID(),
            fileName: 'Chat Message',
            text: input,
            fileSize: input.length,
            fileType: 'text/plain',
            peerName: peer.name,
            peerId: peer.id,
            timestamp: Date.now(),
            direction: 'outgoing',
            origin: 'chat'
        };
        setHistory(prev => [...prev, tempItem]);
        setInput('');
        
        // Clear typing status immediately on send
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        PeerService.sendTyping(peer.id, false);

        setTimeout(scrollToBottom, 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      
      if (peer) {
          PeerService.sendTyping(peer.id, true);
          
          if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
          }
          
          typingTimeoutRef.current = setTimeout(() => {
              PeerService.sendTyping(peer.id, false);
          }, 2000);
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendFile) {
        // Get the actual ID from the service
        const fileId = onSendFile(file);
        e.target.value = ''; // Reset
        
        // Optimistically add "Sent File" message
        if (peer && fileId) {
            // Updated to match new bubble format
            const tempItem: HistoryItem = {
                id: fileId, // Use the real ID
                fileName: file.name,
                text: '', // Empty text for file
                fileSize: file.size,
                fileType: file.type || 'application/octet-stream',
                peerName: peer.name,
                peerId: peer.id,
                timestamp: Date.now(),
                direction: 'outgoing',
                origin: 'chat',
                status: 'pending',
                progress: 0
            };
            setHistory(prev => [...prev, tempItem]);
            setTimeout(scrollToBottom, 100);
        }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <AnimatePresence>
      {peer && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-3xl pointer-events-auto"
            />

            {/* Modal Card */}
            <motion.div
                initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg h-[85vh] sm:h-[600px] bg-[#1c1c1e] sm:rounded-[32px] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden pointer-events-auto border border-white/10"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#1c1c1e]/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {peer.name[0]}
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-xl">{peer.name}</h2>
                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{peer.deviceType || 'Device'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Chat History List */}
                <div 
                    ref={listRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
                >
                    {/* Privacy Notice */}
                    <div className="flex justify-center mb-4">
                        <span className="text-[10px] font-bold text-gray-600 bg-[#2c2c2e] px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">
                            Limited messages stored for privacy!
                        </span>
                    </div>

                    {history.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 opacity-50 pb-20">
                            <MessageSquare size={48} strokeWidth={1} />
                            <p>No recent history</p>
                        </div>
                    ) : (
                        history.map((item) => {
                            const isMe = item.direction === 'outgoing' || item.direction === 'sent';
                            const isFile = item.fileType !== 'text/plain';
                            const isCancelled = item.status === 'declined' || item.status === 'cancelled';
                            // Fallback to fileName for backward compatibility with items saved before schema update
                            const content = item.text || item.fileName;

                            return (
                                <motion.div 
                                    key={item.id} 
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: isCancelled ? 0.5 : 1, y: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} will-change-transform gpu-accelerated`}
                                >
                                    <div 
                                        className={`relative max-w-[75%] p-3.5 rounded-2xl group shadow-sm break-words whitespace-pre-wrap [overflow-wrap:anywhere] ${
                                            isMe 
                                                ? 'bg-white text-black rounded-br-none' 
                                                : 'bg-gray-100 dark:bg-[#2c2c2e] text-gray-900 dark:text-gray-100 rounded-bl-none border border-black/5 dark:border-white/5'
                                        }`}
                                    >
                                        {isFile ? (
                                            <div className="flex items-center gap-3 pr-2">
                                                <div className={`p-2.5 rounded-xl ${isMe ? 'bg-gray-100 text-blue-600' : 'bg-white/10 text-blue-400'}`}>
                                                    <FileText size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-[14px] leading-tight line-clamp-1">{item.fileName}</span>
                                                    <span className={`text-[11px] font-medium ${isMe ? 'text-gray-500' : 'text-gray-400'}`}>{(item.fileSize / 1024).toFixed(1)} KB</span>
                                                </div>
                                                
                                                {/* Action Buttons for Incoming Pending Files */}
                                                {!isMe && item.status === 'pending' ? (
                                                    <div className="flex items-center gap-2 ml-2">
                                                        <button 
                                                            onClick={() => {
                                                                onDeclineFile?.(item.id);
                                                                setHistory(prev => prev.map(i => i.id === item.id ? { ...i, status: 'declined' } : i));
                                                            }}
                                                            className="p-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                                            title="Decline"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                onAcceptFile?.(item.id);
                                                                // Optimistic update
                                                                setHistory(prev => prev.map(i => i.id === item.id ? { ...i, status: 'transferring' } : i));
                                                            }}
                                                            className="p-1.5 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors"
                                                            title="Accept"
                                                        >
                                                            <ArrowDown size={14} />
                                                        </button>
                                                    </div>
                                                ) : !isMe && item.status === 'transferring' ? (
                                                     <div className="ml-2 p-1.5">
                                                         <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                                                     </div>
                                                ) : isCancelled ? (
                                                    <span className="text-[10px] uppercase font-bold text-red-400 ml-2">Cancelled</span>
                                                ) : (
                                                    <div className={`ml-2 p-1.5 rounded-full ${isMe ? 'bg-gray-100' : 'bg-white/10'}`}>
                                                         {isMe ? (
                                                             <ArrowUp size={14} className="text-gray-600" />
                                                         ) : (
                                                             <ArrowDown size={14} className="text-gray-300" />
                                                         )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-[15px] leading-snug whitespace-pre-wrap">{content}</p>
                                        )}
                                        
                                        {/* Copy Button (Bottom Right) */}
                                        {!isFile && !isCancelled && (
                                            <div className={`absolute bottom-0 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                <button 
                                                    onClick={() => copyToClipboard(content)}
                                                    className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                                    title="Copy"
                                                >
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[2010] animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-white/90 dark:bg-[#2c2c2e]/95 backdrop-blur-xl rounded-full px-6 py-3 flex items-center shadow-2xl border border-black/5 dark:border-white/10 gap-4">
                                <img 
                                    src="https://official.balrampathak.com.np/web/image/1417-e3c099ce/typing.gif" 
                                    alt="Typing..." 
                                    className="h-8 w-auto object-contain opacity-90 rounded-full" 
                                />
                                <span className="text-[14px] font-bold text-gray-600 dark:text-gray-300">Typing...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Scroll to Latest Button */}
                <AnimatePresence>
                    {showScrollButton && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            onClick={scrollToBottom}
                            className="absolute bottom-24 right-6 w-10 h-10 bg-[#2c2c2e] border border-white/10 rounded-full flex items-center justify-center text-white shadow-lg z-20 hover:bg-[#3a3a3c] transition-colors"
                        >
                            <ArrowDown size={20} />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Input Area (Gemini Style) */}
                <div className="p-4 bg-[#1c1c1e] border-t border-white/5">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect} 
                    />
                    
                    <div className="flex items-center gap-3 bg-[#2c2c2e] p-2 pl-2 pr-2 rounded-[24px] border border-white/5 focus-within:border-white focus-within:ring-1 focus-within:ring-white/20 transition-all duration-300 focus-white">
                        {/* File Icon (Left) - Circular Plus */}
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-10 rounded-full bg-[#3a3a3c] hover:bg-[#48484a] flex items-center justify-center text-white transition-colors shrink-0"
                        >
                            <Plus size={20} />
                        </button>

                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={handleInputChange}
                            onBlur={() => {
                                // Optional: We rely on timeout mostly, but can force stop here
                                // PeerService.sendTyping(peer.id, false) 
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none outline-none text-white px-2 py-2 min-h-[44px] max-h-[120px] resize-none scrollbar-hide placeholder-gray-500 text-[16px]"
                            rows={1}
                        />

                        {/* Send Button (Right) - Circular Up Arrow */}
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white disabled:bg-slate-700/50 disabled:text-gray-400 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95 shrink-0"
                        >
                            <ArrowUp size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChatDialog;