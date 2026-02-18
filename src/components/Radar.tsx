import React, { memo } from 'react';

interface RadarProps {
  theme: 'light' | 'dark';
}

const Radar: React.FC<RadarProps> = ({ theme }) => {
  // Theme-aware border color
  // Light: Subtle Black (0.08)
  // Dark: Subtle White (0.12)
  const borderColor = theme === 'light' 
    ? 'rgba(0, 0, 0, 0.08)' 
    : 'rgba(255, 255, 255, 0.12)';

  const delays = [0, 1500, 3000, 4500, 6000, 7500, 9000, 10500];

  return (
    <div 
        className="absolute top-1/2 left-1/2 w-[3000px] h-[3000px] pointer-events-none z-[-1] overflow-visible"
        style={{
            willChange: 'transform',
            transform: 'translate(-50%, -50%) translateZ(0)' // GPU acceleration
        }}
    >
      {/* Deep Sonar Rings - 8 Rings, 12s Cycle, Staggered 1.5s */}
      <div className="relative w-full h-full flex items-center justify-center">
        {delays.map((delay) => (
          <div 
            key={delay}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px]"
          >
             <div 
                className="w-full h-full rounded-full animate-sonar border box-border opacity-0"
                style={{ 
                  borderColor: borderColor,
                  animationDelay: `${delay}ms`,
                }} 
             />
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(Radar);
