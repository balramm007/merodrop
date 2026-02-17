import React from 'react';

const BackgroundWaves = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none overflow-hidden">
      {/* Circle 1 */}
      <div className="absolute w-[40vmin] h-[40vmin] border border-white/10 rounded-full animate-ripple" />
      {/* Circle 2 */}
      <div className="absolute w-[40vmin] h-[40vmin] border border-white/10 rounded-full animate-ripple animate-ripple-delay-1" />
      {/* Circle 3 */}
      <div className="absolute w-[40vmin] h-[40vmin] border border-white/10 rounded-full animate-ripple animate-ripple-delay-2" />
      
      {/* Static center circles to match MeroDrop aesthetic */}
      <div className="absolute w-[20vmin] h-[20vmin] border border-white/5 rounded-full" />
      <div className="absolute w-[40vmin] h-[40vmin] border border-white/5 rounded-full" />
      <div className="absolute w-[60vmin] h-[60vmin] border border-white/5 rounded-full" />
      <div className="absolute w-[80vmin] h-[80vmin] border border-white/5 rounded-full" />
    </div>
  );
};

export default BackgroundWaves;
