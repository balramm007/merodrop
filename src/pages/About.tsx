import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Globe, Users, Cpu, Database, Blocks, Network } from 'lucide-react';

const About: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#fffefa] pt-24 md:pt-8 pb-20 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto mb-32">
        <div className="bg-white/40 backdrop-blur-[10px] p-8 md:p-20 rounded-[60px] shadow-[0_50px_100px_rgba(0,0,0,0.02)] border border-black/5 relative">
          <motion.button
            whileHover={{ x: -8 }}
            onClick={() => navigate('/')}
            className="hidden md:flex items-center gap-3 text-black/30 hover:text-black transition-all mb-12 group"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold tracking-widest text-[12px] uppercase">Back to MeroDrop</span>
          </motion.button>

          <div className="space-y-24">
            {/* Massive Heading */}
            <section className="space-y-8 text-center md:text-left">
              <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tighter text-black leading-none">The MeroDrop Project.</h1>
              <p className="text-2xl md:text-4xl text-black/60 leading-tight font-medium max-w-4xl">
                A Serverless, Browser-Native Peer-to-Peer File Sharing Ecosystem.
              </p>
              <div className="inline-block mt-6 px-6 py-3 rounded-full bg-black/5 border border-black/10">
                <p className="text-black/60 font-bold text-sm uppercase tracking-widest">B.Sc. CSIT 3rd Semester • Internal Project</p>
              </div>
            </section>

            <div className="h-px bg-black/[0.05] w-full" />

            {/* Deep Content Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-black flex items-center gap-3">
                  <Globe className="text-blue-500" /> The Core Problem
                </h2>
                <p className="text-black/60 text-xl leading-relaxed">
                  In modern computing, sharing a large file with a colleague sitting right next to you usually involves uploading the file to a centralized cloud server (like Google Drive) and having them download it. This is a massive waste of global bandwidth, highly dependent on internet speed, and poses significant data privacy risks.
                </p>
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-black flex items-center gap-3">
                  <Network className="text-green-500" /> The P2P Solution
                </h2>
                <p className="text-black/60 text-xl leading-relaxed">
                  MeroDrop solves this by creating a direct network tunnel between devices. By leveraging the client-side browser engine, we bypass central hosting entirely. The data is transmitted directly over your Local Area Network (LAN) using encrypted data channels, resulting in Gigabit-level transfer speeds limited only by your router's hardware.
                </p>
              </div>
            </div>

            {/* Technical Detail Section */}
            <section className="space-y-12">
              <h2 className="text-4xl font-bold text-black flex items-center gap-4">
                <Blocks className="text-purple-500 w-10 h-10" /> Frontend Architecture
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 rounded-[32px] bg-black/5 border border-black/5 space-y-4">
                  <Cpu className="w-8 h-8 text-black" />
                  <h3 className="text-2xl font-bold text-black">React & Vite</h3>
                  <p className="text-black/60 font-medium leading-relaxed">
                    The core application is built on <strong>React 18</strong>, utilizing concurrent rendering to manage complex WebRTC state without freezing the UI. <strong>Vite</strong> powers the build system, providing ultra-fast Hot Module Replacement (HMR) and optimized, code-split production bundles.
                  </p>
                </div>
                <div className="p-8 rounded-[32px] bg-black/5 border border-black/5 space-y-4">
                  <Database className="w-8 h-8 text-black" />
                  <h3 className="text-2xl font-bold text-black">IndexedDB (Dexie)</h3>
                  <p className="text-black/60 font-medium leading-relaxed">
                    Instead of external databases, MeroDrop uses the browser's native <strong>IndexedDB</strong> via the <strong>Dexie.js</strong> wrapper. This handles the volatile storage of chat history and file metadata purely on the client side, ensuring zero data leakage.
                  </p>
                </div>
                <div className="p-8 rounded-[32px] bg-black/5 border border-black/5 space-y-4">
                  <Shield className="w-8 h-8 text-black" />
                  <h3 className="text-2xl font-bold text-black">GPU Styling</h3>
                  <p className="text-black/60 font-medium leading-relaxed">
                    The UI utilizes <strong>Tailwind CSS</strong> and <strong>Framer Motion</strong>. Complex animations, like the 8-ring Sonar Radar, are forced onto the Graphics Card using <code>translate3d(0,0,0)</code>, guaranteeing 120fps smoothness even during heavy browser-level zooming.
                  </p>
                </div>
              </div>
            </section>

            {/* Team Section */}
            <section className="space-y-12 bg-black/[0.02] p-10 md:p-20 rounded-[50px]">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-6xl font-bold text-black">The Engineering Team</h2>
                <p className="text-black/40 font-bold uppercase tracking-[0.2em]">B.Sc. CSIT 3rd Semester</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { name: "Balram Pathak", role: "Lead System Architect", bio: "Designed the overarching architecture. Engineered the WebRTC signaling logic, the sequential batch discovery system, and the 120fps hardware-accelerated UI rendering pipeline." },
                  { name: "Kiran Mahara", role: "UI/UX & Frontend Engineer", bio: "Developed the Frosted Glass design language. Implemented the dynamic iOS-style spring animations, the responsive grid layouts, and the real-time messaging interface." },
                  { name: "Bikash Pandey", role: "WebRTC & Network Specialist", bio: "Handled the implementation of PeerJS. Managed the Session Description Protocol (SDP) exchanges and ICE candidate gathering for seamless local device pairing." },
                  { name: "Mahesh Bhatta", role: "Database & Privacy Admin", bio: "Structured the client-side Dexie.js schemas. Implemented the strict volatile-storage protocols that automatically purge all transfer history upon browser refresh." }
                ].map((m, i) => (
                  <div key={i} className="p-10 rounded-[42px] bg-white border border-black/5 shadow-xl shadow-black/[0.01] hover:-translate-y-2 transition-transform duration-500">
                    <p className="text-3xl font-bold text-black mb-2">{m.name}</p>
                    <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-6">{m.role}</p>
                    <p className="text-black/60 leading-relaxed font-medium">{m.bio}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
export default About;