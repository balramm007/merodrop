
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { PeerData } from '../types';

interface PeerAvatarProps {
  peer: PeerData;
  onClick: (peer: PeerData) => void;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent, peer: PeerData) => void;
  progress?: number;
  isCompact?: boolean;
}

const PeerAvatar: React.FC<PeerAvatarProps> = ({ peer, onClick, onContextMenu, progress = 0, isCompact = false }) => {
  if (!peer) return null;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const startPos = useRef({ x: 0, y: 0 });
  const isHolding = useRef(false);
  const ringRef = useRef<SVGCircleElement>(null);
  const currentProgress = useRef(progress);

  useEffect(() => {
    let animationId: number;
    const size = isCompact ? 70 : 94;
    const strokeWidth = isCompact ? 4 : 5;
    const r = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * r;

    const update = () => {
      if (ringRef.current) {
        const diff = progress - currentProgress.current;
        currentProgress.current += diff * 0.1;
        const offset = circumference - (currentProgress.current / 100) * circumference;
        ringRef.current.style.strokeDashoffset = `${offset}`;
      }
      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [progress, isCompact]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    
    isHolding.current = true;
    startTimeRef.current = Date.now();
    startPos.current = { x: e.clientX, y: e.clientY };
    
    timerRef.current = setTimeout(() => {
      if (isHolding.current) {
        onContextMenu(null as any, peer);
        isHolding.current = false;
      }
    }, 2000);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (!isHolding.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const dist = Math.sqrt(
      Math.pow(e.clientX - startPos.current.x, 2) + 
      Math.pow(e.clientY - startPos.current.y, 2)
    );

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isHolding.current && dist < 10) {
      if (elapsed < 2000) {
        onClick(peer);
      }
    }
    
    isHolding.current = false;
  };

  const handlePointerCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isHolding.current = false;
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e as any, peer); // Right Click = File Open
  };

  const Icon = peer.deviceType === 'mobile' ? Smartphone : peer.deviceType === 'tablet' ? Tablet : Monitor;
  const size = isCompact ? 70 : 94;
  const strokeWidth = isCompact ? 4 : 5;
  const center = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  const springTransition = { type: "spring", stiffness: 300, damping: 25, mass: 0.8 } as const;

  return (
    <motion.div
      layout
      className="flex flex-col items-center justify-center cursor-pointer group pointer-events-auto select-none touch-none"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1, y: -8, filter: "brightness(1.1)" }}
      whileTap={{ scale: 0.9 }}
      transition={springTransition}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e as any, peer); }}
      style={{ willChange: "transform" }}
    >
      <div className={`relative ${isCompact ? 'mb-3' : 'mb-6'} flex items-center justify-center`} style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <circle
            cx={center}
            cy={center}
            r={r}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-white/5"
          />
          <circle
            ref={ringRef}
            cx={center}
            cy={center}
            r={r}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
            className="text-primary transition-colors duration-500"
          />
        </svg>

        {/* Core Icon Container */}
        <div className="relative w-[75%] h-[75%] rounded-full bg-[#1c1c1e] flex items-center justify-center shadow-2xl border border-white/5 group-hover:border-primary/50 transition-all duration-300">
          <Icon className="w-[45%] h-[45%] text-[#e8eaed] group-hover:text-primary transition-colors" strokeWidth={1.5} />
        </div>
        
        {/* Status dot */}
        <div className={`absolute bottom-[5%] right-[5%] ${isCompact ? 'w-4 h-4 border-2' : 'w-[25%] h-[25%] max-w-[24px] max-h-[24px] border-[3px]'} bg-green-500 border-black rounded-full shadow-[0_0_15px_rgba(34,197,94,0.7)] z-10`} />
      </div>

      {/* Name Label - Responsive */}
      <div className={`${isCompact ? 'px-3 py-1.5' : 'px-4 py-2'} bg-[#202124] rounded-2xl border border-white/5 shadow-2xl group-hover:bg-[#2d2e31] transition-all text-center min-w-[80px] max-w-[160px]`}>
        <span className={`${isCompact ? 'text-[11px]' : 'text-[13px] md:text-[15px]'} font-bold text-white truncate block leading-snug tracking-tight max-w-[100px] mx-auto`}>
          {peer.name}
        </span>
      </div>
    </motion.div>
  );
};

export default PeerAvatar;
