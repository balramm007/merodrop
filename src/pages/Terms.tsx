import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Trash2, EyeOff, Gavel } from 'lucide-react';

const Terms: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#fffefa] pt-24 md:pt-8 pb-20 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto mb-32">
        <div className="bg-white/40 backdrop-blur-[10px] p-8 md:p-20 rounded-[60px] shadow-[0_50px_100px_rgba(0,0,0,0.02)] border border-black/5 relative">

          <motion.button
            whileHover={{ x: -8 }}
            onClick={() => navigate('/')}
            className="hidden md:flex items-center gap-3 text-black/40 hover:text-black transition-all mb-12 group"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold tracking-widest text-[12px] uppercase">Back to MeroDrop</span>
          </motion.button>

          <div className="space-y-4 mb-24 text-center md:text-left">
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-black leading-none">
              Privacy &<br />Governance.
            </h1>
            <p className="text-xl text-black/40 font-bold uppercase tracking-[0.3em] mt-4">Security Implementation details</p>
          </div>

          <div className="space-y-24">

            {/* Section 1 */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 text-blue-600">
                <FileText className="w-10 h-10" />
                <h2 className="text-3xl font-bold text-black uppercase tracking-tight">1. Academic & Functional Scope</h2>
              </div>
              <div className="prose prose-xl max-w-none text-black/60 font-medium leading-relaxed space-y-6">
                <p>
                  MeroDrop is a Proof-of-Concept (PoC) application developed exclusively for academic fulfillment within the B.Sc. CSIT curriculum. By accessing this web application, you acknowledge that its primary purpose is the demonstration of decentralized WebRTC networking capabilities.
                </p>
                <p>
                  As a purely frontend architecture, MeroDrop provides the interface and signaling logic required for devices to pair, but it does not act as an intermediary host. The actual transmission of data occurs via Datagram Transport Layer Security (DTLS) directly between the participating client nodes.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-8 p-10 md:p-16 bg-black/[0.02] rounded-[50px] border border-black/5">
              <div className="flex items-center gap-4 text-red-500">
                <Trash2 className="w-10 h-10" />
                <h2 className="text-3xl font-bold text-black uppercase tracking-tight">2. Volatile Storage & Wiping</h2>
              </div>
              <div className="text-black/60 text-xl font-medium leading-relaxed space-y-6">
                <p>
                  To ensure absolute privacy and prevent device memory bloat, MeroDrop implements a strict <strong>Session-Only Data Policy</strong>.
                </p>
                <p>
                  While active, chat messages and transfer metadata are mapped to the browser's <strong>IndexedDB (via Dexie.js)</strong> to maintain UI stability. However, the <code>clearSessionData()</code> method is intrinsically bound to the application's mount lifecycle. <strong>Upon every page refresh, tab closure, or new visit, the database stores for 'history' and 'chunks' are completely truncated.</strong> The only data persisted locally is your chosen display name and theme preference.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 text-green-600">
                <EyeOff className="w-10 h-10" />
                <h2 className="text-3xl font-bold text-black uppercase tracking-tight">3. Network Sovereignty</h2>
              </div>
              <p className="text-black/60 text-xl font-medium leading-relaxed">
                MeroDrop does not deploy traffic analysis, file scanning, or telemetric tracking. Consequently, the application cannot verify the safety, legality, or integrity of the files transferred. Users assume 100% liability for the data they transmit or accept. It is strictly advised to use MeroDrop only on trusted Local Area Networks (LAN) and only accept transfers from recognized peers.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 text-purple-600">
                <Gavel className="w-10 h-10" />
                <h2 className="text-3xl font-bold text-black uppercase tracking-tight">4. Open Source Dependencies</h2>
              </div>
              <p className="text-black/60 text-xl font-medium leading-relaxed">
                The execution of MeroDrop relies on several open-source ecosystems. We acknowledge the robust frameworks provided by the maintainers of React, Vite, Tailwind CSS, Framer Motion, PeerJS, and Dexie.js. MeroDrop does not claim ownership over these foundational routing and signaling abstractions.
              </p>
            </section>

            {/* Footer */}
            <footer className="pt-20 text-center border-t border-black/5 space-y-4">
              <p className="text-black/30 font-black text-sm tracking-widest uppercase">
                Designed & Engineered in Kathmandu, Nepal • B.Sc. CSIT
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Terms;