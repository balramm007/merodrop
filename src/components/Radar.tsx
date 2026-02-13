
import React from 'react';

const Radar: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none -z-10 bg-black">
      {/* 
        PairDrop Radar: Static thin grey rings.
        These are precisely spaced to cover the entire view.
      */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <div
          key={`ring-${i}`}
          className="absolute rounded-full border border-[#ffffff10]"
          style={{
            width: `${i * 15}vw`,
            height: `${i * 15}vw`,
            minWidth: `${i * 150}px`,
            minHeight: `${i * 150}px`,
          }}
        />
      ))}
      
      {/* Subtle radial gradient to make the edges darker/softer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_80%)]" />
    </div>
  );
};

export default Radar;