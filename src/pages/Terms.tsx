import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Terms: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white py-20 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto mt-20 mb-32">
        <div className="bg-white/60 backdrop-blur-3xl p-12 md:p-20 rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-black/5 relative hardware-accelerated">
          <motion.button
            whileHover={{ x: -5 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-black/30 hover:text-black transition-all mb-12"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-[13px] uppercase">Back</span>
          </motion.button>

          <h1 className="text-5xl font-black mb-12 tracking-tight text-black">Terms of Service</h1>

          <div className="space-y-10">
            <section className="space-y-3">
              <h3 className="text-xl font-black text-black uppercase tracking-widest">Local-Only</h3>
              <p className="text-black/50 text-lg font-bold leading-relaxed">
                MeroDrop is a local network tool. By using it, you acknowledge that file security depends on your network safety.
              </p>
            </section>
            <section className="space-y-3">
              <h3 className="text-xl font-black text-black uppercase tracking-widest">Privacy</h3>
              <p className="text-black/50 text-lg font-bold leading-relaxed">
                No data is collected, stored, or processed on any external servers. Your usage is entirely anonymous.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
