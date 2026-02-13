import { CHUNK_SIZE } from '../constants';
import { FileMeta } from '../types';

// Event types
export type WebRTCEventMap = {
  'progress': { id: string, progress: number, speed: string };
  'completed': { id: string, file?: Blob, meta?: FileMeta };
  'incoming-meta': { meta: FileMeta, peerId: string };
  'error': { id: string, error: string };
};

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private incomingBuffer: ArrayBuffer[] = [];
  private receivedSize = 0;
  private incomingMeta: FileMeta | null = null;
  private listeners: { [K in keyof WebRTCEventMap]?: ((data: any) => void)[] } = {};

  // For speed calculation
  private transferStartTime = 0;
  private lastBytesLogged = 0;

  constructor() {
    this.setupNewConnection();
  }

  // Basic Event Emitter logic
  on<K extends keyof WebRTCEventMap>(event: K, callback: (data: WebRTCEventMap[K]) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(callback as (data: any) => void);
  }

  emit<K extends keyof WebRTCEventMap>(event: K, data: WebRTCEventMap[K]) {
    this.listeners[event]?.forEach(cb => cb(data));
  }

  setupNewConnection() {
    // In a real app, STUN/TURN servers go here
    const config: RTCConfiguration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
    this.peerConnection = new RTCPeerConnection(config);

    // Handle Incoming Data Channel
    this.peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };
    
    // Debug ICE state
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE State:', this.peerConnection?.iceConnectionState);
    };
  }

  // Called by the initiator
  createDataChannel(label: string) {
    if (!this.peerConnection) return;
    const channel = this.peerConnection.createDataChannel(label);
    this.setupDataChannel(channel);
  }

  setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;
    this.dataChannel.binaryType = 'arraybuffer';

    this.dataChannel.onopen = () => console.log('Data Channel Open');
    this.dataChannel.onmessage = this.handleMessage.bind(this);
    this.dataChannel.onerror = (err) => console.error('Data Channel Error', err);
  }

  async handleMessage(event: MessageEvent) {
    const data = event.data;

    // If string, it's metadata
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'meta') {
          this.incomingMeta = parsed.payload;
          this.incomingBuffer = [];
          this.receivedSize = 0;
          this.transferStartTime = Date.now();
          this.emit('incoming-meta', { meta: this.incomingMeta!, peerId: 'peer-1' });
        }
      } catch (e) {
        console.error('Failed to parse signaling message', e);
      }
      return;
    }

    // If ArrayBuffer, it's file data
    if (data instanceof ArrayBuffer && this.incomingMeta) {
      this.incomingBuffer.push(data);
      this.receivedSize += data.byteLength;

      // Calculate progress
      const progress = (this.receivedSize / this.incomingMeta.size) * 100;
      
      // Calculate speed
      const now = Date.now();
      const elapsed = (now - this.transferStartTime) / 1000;
      const speedMbps = (this.receivedSize / (1024 * 1024)) / elapsed; 
      
      this.emit('progress', { 
        id: this.incomingMeta.id, 
        progress,
        speed: `${speedMbps.toFixed(1)} MB/s`
      });

      if (this.receivedSize >= this.incomingMeta.size) {
        const blob = new Blob(this.incomingBuffer, { type: this.incomingMeta.type });
        this.emit('completed', { id: this.incomingMeta.id, file: blob, meta: this.incomingMeta });
        this.incomingBuffer = [];
        this.receivedSize = 0;
        this.incomingMeta = null;
      }
    }
  }

  // Send File Logic
  async sendFile(file: File) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error("Connection not open");
    }

    const meta: FileMeta = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type
    };

    // 1. Send Metadata
    this.dataChannel.send(JSON.stringify({ type: 'meta', payload: meta }));

    // 2. Chunk and Send
    const buffer = await file.arrayBuffer();
    let offset = 0;
    this.transferStartTime = Date.now();

    const sendLoop = () => {
      if (!this.dataChannel || this.dataChannel.readyState !== 'open') return;

      // Create a bit of backpressure handling
      if (this.dataChannel.bufferedAmount > 16 * 1024 * 1024) { // 16MB buffer limit
        setTimeout(sendLoop, 50);
        return;
      }

      while (offset < buffer.byteLength) {
        if (this.dataChannel.bufferedAmount > 10 * 1024 * 1024) {
          setTimeout(sendLoop, 10);
          return;
        }

        const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
        this.dataChannel.send(chunk);
        offset += CHUNK_SIZE;

        const progress = Math.min((offset / file.size) * 100, 100);
         // Calculate speed
         const now = Date.now();
         const elapsed = (now - this.transferStartTime) / 1000;
         const sentMB = offset / (1024 * 1024);
         const speed = elapsed > 0 ? (sentMB / elapsed).toFixed(1) + ' MB/s' : 'Calculating...';

        this.emit('progress', { id: meta.id, progress, speed });
      }

      if (offset >= buffer.byteLength) {
        this.emit('completed', { id: meta.id });
      }
    };

    sendLoop();
    return meta.id;
  }

  // Getters for integration
  get rawConnection() { return this.peerConnection; }
}

// Singleton for simplicity in this demo, usually provided via Context
export const webRTC = new WebRTCService();