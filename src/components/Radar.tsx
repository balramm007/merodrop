import React, { memo } from 'react';

interface RadarProps {
  theme: 'light' | 'dark';
}

const Radar: React.FC<RadarProps> = () => {
  // Theme-adaptive ring color is now handled in index.css for better performance and clean separation
  
  return (
    <div 
      className="fixed bottom-0 left-1/2 z-[-1] pointer-events-none flex items-center justify-center gpu-accelerated"
      style={{ 
        transform: 'translate3d(-50%, 0, 0)', 
        backfaceVisibility: 'hidden' 
      }}
    >
      {/* Deep Sonar Rings - 8 Rings, 12s Cycle, Staggered 1.5s */}
      {/* Container is centered on the bottom logo. Rings expand from this center. */}
      <div className="relative flex items-center justify-center gpu-accelerated">
        <div className="absolute w-[300px] h-[300px] rounded-full animate-sonar delay-0" />
        <div className="absolute w-[300px] h-[300px] rounded-full animate-sonar delay-1500" />
        <div className="absolute w-[300px] h-[300px] rounded-full animate-sonar delay-3000" />
        <div className="absolute w-[300px] h-[300px] rounded-full animate-sonar delay-4500" />
        <div className="absolute w-[300px] h-[300px] rounded-full animate-sonar delay-6000" />
        <div className="absolute w-[300px] h-[300px] rounded-full animate-sonar delay-7500" />
        <div className="absolute w-[300px] h-[300px] rounded-full animate-sonar delay-9000" />
        <div className="absolute w-[300px] h-[300px] rounded-full animate-sonar delay-10500" />
      </div>
      
      {/* Soft Center Glow - GPU Accelerated */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-500/[0.03] blur-[150px] rounded-full gpu-accelerated" />
    </div>
  );
};

export default memo(Radar);
