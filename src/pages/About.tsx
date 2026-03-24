import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const About: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white py-20 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto mt-20 mb-32">
        <div className="bg-white/60 backdrop-blur-3xl p-12 md:p-20 rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-black/5 relative hardware-accelerated">
          <motion.button
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-black/30 hover:text-black transition-all mb-12 group"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-bold tracking-tight text-[13px] uppercase">Back</span>
          </motion.button>
          
          <div className="space-y-12">
            <section>
              <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter text-black">MeroDrop</h1>
              <p className="text-xl md:text-2xl text-black/70 leading-relaxed font-bold">
                Simple. Fast. Private. <br /> The absolute standard for local P2P sharing.
              </p>
            </section>

            <div className="h-px bg-black/[0.04] w-full" />

            <section className="space-y-8">
              <div className="space-y-3">
                <h3 className="text-2xl font-black tracking-tight text-black">What is MeroDrop?</h3>
                <p className="text-black/50 text-lg leading-relaxed font-bold">
                  MeroDrop is a cross-platform local sharing tool that uses WebRTC to transfer files directly between devices on the same network. No servers, no tracking, just pure data.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black tracking-tight text-black">Privacy First</h3>
                <p className="text-black/50 text-lg leading-relaxed font-bold">
                  Since we don't use intermediate servers, your files never leave your local network. Your privacy isn't just a feature; it's the architecture.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>);
};

export default About;
