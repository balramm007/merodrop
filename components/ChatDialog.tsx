
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PeerData } from '../types';

interface Props {
  peer: PeerData;
  onSendMessage: (text: string) => void;
  onClose: () => void;
  isIncoming?: boolean;
  incomingText?: string;
  style?: React.CSSProperties;
}

const ChatDialog: React.FC<Props> = ({ peer, onSendMessage, onClose, isIncoming, incomingText, style }) => {
  if (!peer) return null;
  const [input, setInput] = useState('');
  const springTransition = { type: "spring", stiffness: 300, damping: 25, mass: 0.8 } as const;

  const handleSend = () => {
    if (!input.trim()) return;
    if (typeof onSendMessage === 'function') {
      onSendMessage(input);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[500] p-4 bg-black/60 backdrop-blur-sm pointer-events-none">
      <motion.div 
        layout
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={springTransition}
        style={style}
        className="bg-[#1a1a1a] w-full max-w-[380px] rounded-[28px] shadow-[0_40px_100px_rgba(0,0,0,0.95)] border border-white/5 overflow-hidden flex flex-col pointer-events-auto"
      >
        <div className="bg-[#3d82f6] py-4.5 flex justify-center items-center">
          <h2 className="text-[22px] font-semibold text-white tracking-tight">
            {isIncoming ? 'Message Received' : 'Send Message'}
          </h2>
        </div>

        <div className="p-7 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[#9aa0a6] text-[16px] font-medium">{isIncoming ? 'From:' : 'To:'}</span>
            <span className="bg-[#3d82f6] text-white px-3.5 py-0.5 rounded-lg text-[16px] font-bold tracking-tight">
              {peer.name || "Mero Peer"}
            </span>
          </div>

          <div className="w-full bg-[#242424] rounded-xl overflow-hidden mb-7 border border-white/5 shadow-inner">
            {isIncoming ? (
              <div className="w-full p-5 text-white text-[16px] min-h-[80px] leading-relaxed font-medium overflow-y-auto max-h-[150px]">
                {incomingText}
              </div>
            ) : (
              <textarea
                autoFocus
                className="w-full bg-transparent p-5 text-white placeholder-[#5f6368] outline-none resize-none h-[80px] text-[16px] font-medium"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            )}
          </div>

          <div className="flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 bg-[#2c2c2c] hover:bg-[#353535] text-[#3d82f6] font-bold text-[15px] tracking-[0.1em] rounded-2xl transition-all uppercase active:scale-95"
            >
              CANCEL
            </button>
            {!isIncoming && (
              <button
                disabled={!input.trim()}
                onClick={handleSend}
                className={`flex-1 py-3.5 bg-[#2c2c2c] font-bold text-[15px] tracking-[0.1em] rounded-2xl transition-all uppercase active:scale-95 ${
                  input.trim() ? 'text-[#9aa0a6] hover:text-white hover:bg-[#353535]' : 'text-[#444444]'
                }`}
              >
                SEND
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatDialog;
