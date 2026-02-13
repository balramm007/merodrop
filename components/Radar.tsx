
import React from 'react';
import { motion } from 'framer-motion';

const Radar: React.FC = () => {
  const arcRadii = [300, 480, 660, 840, 1020, 1200];
  const springTransition = { type: "spring", stiffness: 300, damping: 25, mass: 0.8 } as const;

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none -z-10 bg-black">
      <div className="absolute bottom-[100px] left-1/2 flex items-center justify-center">
        {/* Background Arcs */}
        {arcRadii.map((radius, i) => (
          <motion.div
            key={radius}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springTransition, delay: i * 0.1 }}
            className="absolute rounded-t-full border-t border-l border-r border-white/[0.04]"
            style={{
              width: radius * 2,
              height: radius,
              bottom: 0,
              left: -radius,
            }}
          />
        ))}

        {/* Sonar Pulses */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`pulse-${i}`}
            className="absolute rounded-t-full border-t border-l border-r border-primary/20"
            initial={{ width: 0, height: 0, bottom: 0, left: 0, opacity: 0.8 }}
            animate={{ 
              width: 2000, 
              height: 1000, 
              bottom: 0, 
              left: -1000,
              opacity: 0,
              scale: 1.5
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              delay: i * 1.33,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
      
      {/* Soft Bottom Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1400px] h-[700px] bg-primary/[0.03] blur-[150px] rounded-full" />
    </div>
  );
};

export default Radar;
