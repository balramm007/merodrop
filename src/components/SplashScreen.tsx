import React from 'react';
import { motion } from 'framer-motion';
import { SPLASH_LOGO_URL } from '../constants';

interface SplashScreenProps {
  theme: 'light' | 'dark';
}

const SplashScreen: React.FC<SplashScreenProps> = ({ theme }) => {
  return (
    <motion.div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden ${
        theme === 'dark' ? 'bg-black' : 'bg-[#fcf7f0]'
      }`}
      // 1. OUTRO: The entire background fades and scales slightly as it leaves
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] } 
      }}
    >
      {/* Dynamic Background Glow */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.5, scale: 1 }}
        exit={{ opacity: 0, scale: 1.5 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.15)_0%,_transparent_70%)] pointer-events-none"
      />

      {/* 
        3. EXIT: High-speed zoom through the screen (The Portal)
        Note: We use Framer Motion ONLY for exit. Entry is handled by Native CSS (.splash-logo-animated)
      */}
      <motion.div
        className="relative gpu-accelerated"
        exit={{ 
          scale: 5, 
          opacity: 0,
          filter: "blur(20px)", 
          transition: { 
            duration: 0.6, 
            ease: [0.4, 0, 0.2, 1] 
          } 
        }}
        style={{
          willChange: "transform, opacity",
          transform: "translate3d(0,0,0)"
        }}
      >
        <div className="relative shadow-[0_50px_100px_rgba(0,0,0,0.4)] rounded-[60px] overflow-hidden splash-logo-animated">
          <img
            src={SPLASH_LOGO_URL}
            alt="MeroDrop Launch"
            className="w-64 h-64 md:w-80 md:h-80 object-cover image-rendering-pixel"
            style={{ 
              willChange: 'transform',
              transform: 'translate3d(0,0,0)',
              WebkitBackfaceVisibility: 'hidden'
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;