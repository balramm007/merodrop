
import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { Peer } from '../types';

interface PeerAvatarProps {
  peer: Peer;
  onClick: (peer: Peer) => void;
  x: number;
  y: number;
}

const PeerAvatar: React.FC<PeerAvatarProps> = ({ peer, onClick, x, y }) => {
  const Icon = peer.deviceType === 'mobile' ? Smartphone : peer.deviceType === 'tablet' ? Tablet : Monitor;

  return (
    <motion.div
      className="absolute flex flex-col items-center justify-center cursor-pointer group"
      initial={{ scale: 0, opacity: 0, x, y }}
      animate={{ scale: 1, opacity: 1, x, y }}
      whileHover={{ scale: 1.05 }}
      onClick={() => onClick(peer)}
      style={{
        width: 120,
        height: 120,
        marginLeft: -60,
        marginTop: -60,
      }}
    >
      {/* Device Icon Circle */}
      <div className="w-22 h-22 rounded-full bg-[#202124] flex items-center justify-center shadow-xl border border-[#3c4043] group-hover:border-primary transition-all duration-300">
        <Icon className="w-9 h-9 text-[#e8eaed] group-hover:text-primary transition-colors" strokeWidth={1.5} />
      </div>

      {/* Name Pill */}
      <div className="mt-3 px-3 py-1 rounded bg-[#202124] shadow-md border border-[#3c4043] group-hover:bg-[#2d2e31]">
        <span className="text-[13px] font-bold text-[#e8eaed] whitespace-nowrap">
          {peer.name}
        </span>
      </div>
    </motion.div>
  );
};

export default PeerAvatar;