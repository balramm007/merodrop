import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white py-20 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto mt-20 mb-32">
        <div className="bg-white/60 backdrop-blur-3xl p-12 md:p-20 rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-black/5 relative hardware-accelerated">
          <motion.button
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-black/30 hover:text-black transition-all mb-12"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-[13px] uppercase">Back</span>
          </motion.button>

          <h1 className="text-5xl font-black mb-12 tracking-tight text-black">How it Works</h1>

          <div className="space-y-12">
            {[
              { step: "01", title: "Join Network", desc: "Open MeroDrop on two or more devices on the same Wi-Fi network." },
              { step: "02", title: "Discover Peers", desc: "Your devices will automatically find each other using local discovery." },
              { step: "03", title: "Share Instantly", desc: "Select a peer, choose your file, and watch it transfer at high speed." }
            ].map((item, index) => (
              <div key={index} className="flex gap-8">
                <span className="text-4xl font-black text-black/10 tabular-nums">{item.step}</span>
                <div>
                  <h3 className="text-2xl font-black text-black mb-2">{item.title}</h3>
                  <p className="text-black/50 text-lg font-bold leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>);
};

export default HowItWorks;
