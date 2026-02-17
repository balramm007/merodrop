import React from 'react';
import { motion } from 'framer-motion';
import { X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { HistoryItem } from '../types';

interface Props {
  history: HistoryItem[];
  onClose: () => void;
}

const HistoryModal: React.FC<Props> = ({ history, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold dark:text-white">Transfer History</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
            <X className="w-5 h-5 dark:text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No transfers yet.</div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center space-x-3">
                  {item.direction === 'received' ? (
                    <ArrowDownCircle className="w-8 h-8 text-green-500" />
                  ) : (
                    <ArrowUpCircle className="w-8 h-8 text-blue-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium dark:text-slate-200">{item.fileName}</p>
                    <p className="text-xs text-slate-500">{item.peerName} • {(item.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default HistoryModal;