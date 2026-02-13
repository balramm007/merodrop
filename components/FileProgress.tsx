
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileIcon, Check, AlertCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { TransferState } from '../types';

interface FileProgressProps {
  transfer: TransferState;
  onAccept?: () => void;
  onDecline: () => void;
  onClose: () => void;
}

const FileProgress: React.FC<FileProgressProps> = ({ transfer, onAccept, onDecline, onClose }) => {
  if (!transfer) return null;
  const barRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const currentProgress = useRef(transfer.progress);
  
  useEffect(() => {
    let animationId: number;
    
    const update = () => {
      if (barRef.current) {
        // Interpolate progress for smoothness
        const diff = transfer.progress - currentProgress.current;
        currentProgress.current += diff * 0.1;
        
        barRef.current.style.width = `${currentProgress.current}%`;
        if (textRef.current) {
          textRef.current.textContent = `${Math.round(currentProgress.current)}%`;
        }
      }
      animationId = requestAnimationFrame(update);
    };
    
    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [transfer.progress]);

  const isIncoming = transfer.direction === 'incoming';
  const springTransition = { type: "spring", stiffness: 300, damping: 25, mass: 0.8 } as const;
  
  return (
    <motion.div
      layout
      initial={{ y: 100, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 50, opacity: 0, scale: 0.9 }}
      transition={springTransition}
      className="fixed bottom-10 right-10 w-84 bg-[#1c1c1e] rounded-[32px] shadow-[0_32px_80px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden z-50"
    >
      <div className="p-7">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3.5 bg-primary/10 rounded-2xl relative">
            <FileIcon className="w-6 h-6 text-primary" />
            <div className="absolute -bottom-1 -right-1 bg-[#1c1c1e] p-1 rounded-full border border-white/5">
              {isIncoming ? <ArrowDown className="w-3 h-3 text-green-500" /> : <ArrowUp className="w-3 h-3 text-blue-500" />}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[16px] font-bold text-white truncate">
              {transfer.fileName}
            </h4>
            <p className="text-[13px] text-[#9aa0a6] font-semibold">
              {(transfer.fileSize / (1024 * 1024)).toFixed(1)} MB • {isIncoming ? 'Incoming' : 'Outgoing'}
            </p>
          </div>
        </div>

        {transfer.status === 'pending' && isIncoming ? (
          <div className="flex space-x-3 mt-4">
            <button
              onClick={onDecline}
              className="flex-1 py-4 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[14px] font-bold text-[#9aa0a6] rounded-2xl transition-all active:scale-95"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              className="flex-1 py-4 bg-primary hover:bg-primary/90 text-[14px] font-bold text-white rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              Accept
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest text-[#9aa0a6]">
              <span className={transfer.status === 'error' ? 'text-red-500' : ''}>
                {transfer.status === 'transferring' ? (transfer.speed || 'Transferring...') : 
                 transfer.status === 'pending' ? 'WAITING FOR PEER...' : transfer.status.toUpperCase()}
              </span>
              <span ref={textRef} className="text-primary">{Math.round(transfer.progress)}%</span>
            </div>
            
            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                ref={barRef}
                className={`h-full ${transfer.status === 'error' ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${transfer.progress}%` }}
              />
            </div>

            <AnimatePresence mode="wait">
              {transfer.status === 'completed' && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center text-green-500 text-[14px] font-bold pt-1"
                >
                  <Check className="w-4 h-4 mr-2" /> Transfer Complete
                </motion.div>
              )}
              {transfer.status === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3 pt-1"
                >
                  <div className="flex items-center text-red-500 text-[14px] font-bold">
                    <AlertCircle className="w-4 h-4 mr-2" /> {transfer.error || 'Transfer failed'}
                  </div>
                  <button onClick={onDecline} className="text-[11px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 underline underline-offset-4">Dismiss</button>
                </motion.div>
              )}
            </AnimatePresence>

            {(transfer.status === 'transferring' || transfer.status === 'pending') && (
              <div className="flex justify-center pt-2">
                <button onClick={onDecline} className="text-[11px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors">
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FileProgress;
