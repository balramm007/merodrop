import React, { memo } from 'react';

interface RadarProps {
  theme: 'light' | 'dark';
}

const Radar: React.FC<RadarProps> = () => {
  return (
    <div 
      className="absolute inset-0 z-[-1] pointer-events-none flex items-center justify-center gpu-accelerated"
      style={{ 
        transform: 'translateZ(0)', 
        backfaceVisibility: 'hidden' 
      }}
    >
      {/* Deep Sonar Rings - 5 Rings, 12s Cycle, Staggered 2.4s */}
      {/* Container is centered on the bottom logo. Rings expand from this center. */}
      <div className="relative flex items-center justify-center gpu-accelerated">
        <div className="absolute w-[300px] h-[300px] rounded-full animate-sonar delay-0" style={{ willChange: 'transform' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full animate-sonar delay-2400" style={{ willChange: 'transform' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full animate-sonar delay-4800" style={{ willChange: 'transform' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full animate-sonar delay-7200" style={{ willChange: 'transform' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full animate-sonar delay-9600" style={{ willChange: 'transform' }} />
      </div>
      
      {/* Soft Center Glow - GPU Accelerated */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-500/[0.03] blur-[150px] rounded-full gpu-accelerated" />
    </div>
  );
};

export default memo(Radar);
