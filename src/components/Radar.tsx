import React, { memo } from 'react';

interface RadarProps {
  theme: 'light' | 'dark';
}

const Radar: React.FC<RadarProps> = ({ theme }) => {
  const borderColor = theme === 'light'
    ? 'rgba(0, 0, 0, 0.07)'
    : 'rgba(255, 255, 255, 0.12)';

  const delays = [0, 1500, 3000, 4500, 6000, 7500, 9000, 10500];

  return (
    <div
      // Fixed to bottom-center, aligned with the logo (logo is pb-8 + mb-4 + 32px = ~76px from bottom, center of 64px logo = 108px from bottom)
      style={{
        position: 'fixed',
        bottom: '108px',   // center of the 64px logo pill (pb-8=32px + mb-4=16px + 32px half of logo = 80px, approximated)
        left: '50%',
        width: '3000px',
        height: '3000px',
        transform: 'translateX(-50%) translateY(50%) translateZ(0)',
        willChange: 'transform',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'visible',
      }}
    >
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