import React from 'react';
import { motion } from 'framer-motion';
import { X, ArrowDownLeft, ArrowUpRight, File } from 'lucide-react';
import { HistoryItem } from '../types';

interface Props {
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
}

const HistorySidebar: React.FC<Props> = ({ history, isOpen, onClose }) => {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: isOpen ? 0 : '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 h-full w-80 bg-surface z-50 border-l border-white/10 shadow-2xl flex flex-col"
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
        <h2 className="text-lg font-bold text-white">History</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-10 text-[#9aa0a6] text-sm">No transfers yet.</div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-start gap-3">
              <div className={`p-2 rounded-lg ${(item.direction === 'sent' || item.direction === 'outgoing') ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                <File size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-semibold text-white truncate">{item.fileName}</p>
                  {(item.direction === 'sent' || item.direction === 'outgoing') ? <ArrowUpRight size={14} className="text-blue-400 shrink-0" /> : <ArrowDownLeft size={14} className="text-green-400 shrink-0" />}
                </div>
                <p className="text-xs text-[#9aa0a6] truncate">{item.peerName}</p>
                <div className="flex justify-between items-center mt-2 text-[10px] text-[#5f6368]">
                  <span>{(item.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default HistorySidebar;