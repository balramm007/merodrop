import React from 'react';
import { motion } from 'framer-motion';
import { LOGO_URL } from '../constants';

interface SplashScreenProps {
  theme: 'light' | 'dark';
}

const SplashScreen: React.FC<SplashScreenProps> = ({ theme }) => {
  return (
    <motion.div
      className={`fixed inset-0 z-[2000] flex items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-[#f8f9fa]'}`}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      style={{ willChange: 'opacity' }}
    >
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: [0.8, 1, 1.05, 1],
          opacity: [0, 1, 1, 1],
        }}
        transition={{
          duration: 1.5,
          times: [0, 0.33, 0.66, 1],
          ease: "easeInOut"
        }}
      >
        <motion.img
          src={LOGO_URL}
          alt="MeroDrop Logo"
          className="w-32 h-32 object-contain rounded-[32px] shadow-2xl"
          style={{ willChange: 'transform, opacity' }}
        />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
