import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PlayCircle, Signal, Lock, Layers, Zap } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#fffefa] pt-24 md:pt-8 pb-20 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto mb-32">
        <div className="bg-white/40 backdrop-blur-[10px] p-8 md:p-20 rounded-[60px] shadow-[0_50px_100px_rgba(0,0,0,0.02)] border border-black/5 relative">
          <motion.button
            whileHover={{ x: -8 }}
            onClick={() => navigate('/')}
            className="hidden md:flex items-center gap-2 text-black/40 hover:text-black transition-all mb-12"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold tracking-widest text-[12px] uppercase">Home</span>
          </motion.button>

          <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tight text-black leading-tight text-center md:text-left">
            Under the Hood.
          </h1>
          <p className="text-2xl text-black/50 font-bold mb-20 md:text-left text-center">
            How MeroDrop achieves serverless, high-speed data transmission.
          </p>

          <div className="space-y-32">

            {/* Step 1: Discovery */}
            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="w-20 h-20 rounded-[28px] bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                <Signal className="w-10 h-10 text-blue-600" />
              </div>
              <div className="space-y-6">
                <h3 className="text-4xl font-bold text-black">1. Sequential Batch Discovery</h3>
                <p className="text-black/60 text-xl font-medium leading-relaxed">
                  Upon opening the application, MeroDrop does not utilize a central database to find peers. Instead, it uses a predefined namespace (e.g., <code>merodrop-lan-[slot]</code>). To prevent crashing the browser's WebRTC engine with concurrent connection attempts, our algorithm scans <strong>50 possible slots in sequential batches of 5</strong>, with a 300ms delay between batches.
                </p>
                <p className="text-black/60 text-xl font-medium leading-relaxed">
                  Once a slot acknowledges the connection, an initial Handshake packet containing the peer's chosen Identity and Device Type is exchanged.
                </p>
              </div>
            </div>

            {/* Step 2: Protocol */}
            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="w-20 h-20 rounded-[28px] bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                <Lock className="w-10 h-10 text-purple-600" />
              </div>
              <div className="space-y-6">
                <h3 className="text-4xl font-bold text-black">2. The Permission Handshake</h3>
                <p className="text-black/60 text-xl font-medium leading-relaxed">
                  File transfers in MeroDrop are strictly permission-based. When a sender selects a file, the application first transmits a lightweight <code>file-metadata</code> packet over the WebRTC DataChannel.
                </p>
                <p className="text-black/60 text-xl font-medium leading-relaxed">
                  The receiver's UI then renders an iOS-style Prompt. The actual binary data of the file is <strong>blocked</strong> from transmission until the receiver explicitly clicks "Accept", returning an <code>accept-transfer</code> signal to the sender's node.
                </p>
              </div>
            </div>

            {/* Step 3: ArrayBuffers */}
            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="w-20 h-20 rounded-[28px] bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                <Layers className="w-10 h-10 text-orange-600" />
              </div>
              <div className="space-y-6">
                <h3 className="text-4xl font-bold text-black">3. Binary Chunking & Blobs</h3>
                <p className="text-black/60 text-xl font-medium leading-relaxed">
                  WebRTC cannot send a 1GB file as a single object. MeroDrop's engine reads the file using the browser's File API and slices it into smaller <strong>ArrayBuffer chunks</strong>. These chunks are streamed sequentially to prevent RAM overflow.
                </p>
                <p className="text-black/60 text-xl font-medium leading-relaxed">
                  On the receiving end, the chunks are collected in memory. Once 100% of the bytes are received, they are reassembled using the JavaScript <code>Blob</code> API: <br />
                  <code className="bg-black/5 px-2 py-1 rounded-md text-lg">new Blob([data], &#123; type: fileType &#125;)</code>. This ensures the file retains its exact original format (PDF, MP4, JPG) without defaulting to a text file.
                </p>
              </div>
            </div>

            {/* Video Section */}
            <section className="space-y-10 bg-black/[0.02] p-10 md:p-16 rounded-[50px]">
              <div className="flex items-center justify-center gap-4 text-red-500">
                <PlayCircle className="w-12 h-12" />
                <h2 className="text-4xl font-bold text-black">Live Demonstration</h2>
              </div>
              <div className="aspect-video w-full rounded-[40px] overflow-hidden bg-black shadow-2xl relative group">
                <video
                  className="w-full h-full object-cover"
                  src="/demo.mp4"
                  controls
                  poster="https://official.balrampathak.com.np/web/image/1415-70dfba13/mero-drop.webp"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HowItWorks;