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
      // removed console.log
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
        // failed to parse
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
    }
  }
}
