import React from 'react';
import { motion } from 'framer-motion';

// Using the specific Splash Logo URL you provided earlier for high-quality launch
const SPLASH_LOGO_URL = 'https://official.balrampathak.com.np/web/image/1415-70dfba13/mero-drop.webp';

interface SplashScreenProps {
  theme: 'light' | 'dark';
}

const SplashScreen: React.FC<SplashScreenProps> = ({ theme }) => {
  return (
    <motion.div
      className={`fixed inset-0 z-[2000] flex items-center justify-center ${
        theme === 'dark' ? 'bg-black' : 'bg-[#f8f9fa]'
      }`}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      style={{ willChange: 'opacity, transform' }}
    >
      <motion.div
        className="relative"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ 
          scale: [0.8, 1, 1.03, 1], // iOS-style elastic pop
          opacity: 1 
        }}
        transition={{
          duration: 2,
          times: [0, 0.2, 0.5, 1],
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse"
        }}
      >
        {/* Just the image with curved edges, no extra borders */}
        <motion.img
          src={SPLASH_LOGO_URL}
          alt="MeroDrop Launch"
          className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
          style={{ 
            willChange: 'transform',
            transform: 'translateZ(0)' // Force GPU acceleration
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;