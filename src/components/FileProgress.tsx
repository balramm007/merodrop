import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileIcon, ArrowDown, ArrowUp, X, Check, FileText } from 'lucide-react';
import { TransferState } from '../types';

interface FileProgressProps {
  transfer: TransferState;
  onAccept: (fileId: string, peerId: string) => void;
  onDecline: (fileId: string, peerId: string) => void;
  onClose: () => void;
}

const FileProgress: React.FC<FileProgressProps> = ({ transfer, onAccept, onDecline, onClose }) => {
  if (!transfer) return null;
  const barRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const currentProgress = useRef(transfer.progress);
  
  const handleAccept = () => onAccept(transfer.fileId, transfer.peerId);
  const handleDecline = () => onDecline(transfer.fileId, transfer.peerId);
  
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
  
  // iOS-style spring transition
  const springTransition = { type: "spring", stiffness: 350, damping: 25 } as const;

  return (
    <motion.div
      layout
      initial={{ y: 120, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ x: 400, opacity: 0, scale: 0.95 }} // Slide to right off-screen
      transition={springTransition}
      className="fixed bottom-6 inset-x-4 md:inset-auto md:bottom-8 md:right-8 md:w-[400px] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-3xl rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 dark:border-white/10 z-[100] overflow-hidden"
    >
      <div className="p-5">
          {/* Header Section */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-blue-600/20 dark:from-blue-500/20 dark:to-blue-600/30 rounded-2xl flex items-center justify-center border border-blue-500/10 dark:border-blue-500/20">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#2c2c2e] p-1.5 rounded-full border border-white/10 shadow-sm">
                {isIncoming ? (
                  <ArrowDown className="w-3.5 h-3.5 text-green-500" strokeWidth={3} />
                ) : (
                  <ArrowUp className="w-3.5 h-3.5 text-blue-500" strokeWidth={3} />
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-[17px] font-semibold text-black dark:text-white truncate leading-tight">
                {transfer.fileName}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                  {isIncoming ? 'From' : 'To'} <span className="text-black dark:text-gray-200">{transfer.peerName || 'Unknown'}</span>
                </span>
                <span className="text-[13px] text-gray-300 dark:text-gray-600">•</span>
                <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                  {(transfer.fileSize / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            </div>
          </div>

          {/* Action Area */}
          {transfer.status === 'pending' && isIncoming ? (
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleDecline}
                className="py-3.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-black dark:text-white text-[15px] font-semibold rounded-xl transition-colors"
              >
                Decline
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAccept}
                className="py-3.5 bg-blue-500 hover:bg-blue-600 text-white text-[15px] font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
              >
                Accept
              </motion.button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  transfer.status === 'error' || transfer.status === 'declined' ? 'text-red-500' : 
                  transfer.status === 'completed' ? 'text-green-500' : 'text-blue-500'
                }`}>
                  {transfer.status === 'transferring' ? 'Sending...' : transfer.status}
                </span>
                <span ref={textRef} className="text-[13px] font-semibold text-gray-900 dark:text-white tabular-nums">
                  {Math.round(transfer.progress)}%
                </span>
              </div>
              
              <div className="h-2 w-full bg-[#f2f2f7] dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  ref={barRef}
                  className={`h-full rounded-full ${
                    transfer.status === 'error' || transfer.status === 'declined' ? 'bg-red-500' : 
                    transfer.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  initial={{ width: 0 }}
                  style={{ width: `${transfer.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
  );
};

export default FileProgress;
