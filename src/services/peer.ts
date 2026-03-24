import Peer, { DataConnection } from 'peerjs';
import { MAX_DISCOVERY_SLOTS } from '../constants';

type Listener = (...args: any[]) => void;

class EventEmitter {
  private events: Record<string, Listener[]> = {};

  on(event: string, listener: Listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(l => l(...args));
  }
}

class PeerService extends EventEmitter {
  private static instance: PeerService;
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private myId: string = '';
  private myName: string = '';
  private myDevice: string = '';
  private myDeviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  private lastId: string | null = null;
  private pendingTransfers: Map<string, { file: File, peerId: string }> = new Map();
  private discoveryInterval: any = null;

  private constructor() {
    super();
    this.myDeviceType = this.getDeviceType();
  }

  public static getInstance(): PeerService {
    if (!PeerService.instance) {
      PeerService.instance = new PeerService();
    }
    return PeerService.instance;
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  public init(name: string = 'Anonymous', device: string = 'Unknown Device') {
    if (this.peer) return;

    this.myName = name;
    this.myDevice = device;

    this.attemptConnection();
  }

  private attemptConnection() {
    // Clear any existing discovery interval
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }

    const slot = Math.floor(Math.random() * 51); // 0-50
    const peerId = `merodrop-lan-${slot}`;

    if (this.peer) {
        this.peer.destroy();
        this.peer = null;
    }

    this.peer = new Peer(peerId, {
      debug: 0 // Suppress internal logs
    });

    this.peer.on('open', (id) => {
      this.myId = id;
      this.emit('open', id);
      this.startDiscoveryLoop();
    });

    this.peer.on('connection', (conn) => {
      this.handleConnection(conn);
    });

    this.peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        // ID collision - retry with a new slot immediately
        console.warn(`Peer ID ${peerId} is taken, retrying...`);
        this.attemptConnection();
        return;
      }
      
      // Ignore peer-unavailable errors during discovery
      if (err.type === 'peer-unavailable') return;
      
      this.emit('error', err);
    });

    window.addEventListener('beforeunload', () => {
      if (this.discoveryInterval) {
        clearInterval(this.discoveryInterval);
      }
      this.peer?.destroy();
    });
  }

  private async startDiscoveryLoop() {
    if (this.discoveryInterval) clearInterval(this.discoveryInterval);
    
    const loop = async () => {
        const batchSize = 5;
        const delay = 500;
        const totalSlots = 51;

        for (let i = 0; i < totalSlots; i += batchSize) {
            for (let j = 0; j < batchSize && (i + j) < totalSlots; j++) {
                const targetSlot = i + j;
                const targetId = `merodrop-lan-${targetSlot}`;
                if (targetId !== this.myId) {
                    this.connect(targetId);
                }
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    };
    
    loop(); // Initial scan
    this.discoveryInterval = setInterval(loop, 10000); // Re-scan every 10s
  }

  private async discoverPeers(ipHash: string, mySlot: number) {
      // Deprecated in favor of startDiscoveryLoop
  }

  public connect(peerId: string) {
    if (peerId === this.myId) return;
    if (!this.peer || this.connections.has(peerId)) return;

    try {
      const conn = this.peer.connect(peerId, {
        reliable: true,
        metadata: { 
          name: this.myName, 
          device: this.myDevice,
          deviceType: this.myDeviceType
        }
      });
      
      // Self-Healing Strategy: Catch and cleanup immediately
      const cleanup = () => {
        conn.close();
        this.connections.delete(peerId);
      };

      conn.on('error', cleanup);
      conn.on('close', () => this.connections.delete(peerId));
      
      this.handleConnection(conn);
    } catch (err) {
      // Silent catch for connection initialization errors
    }
  }

  public sendFile(file: File, peerId: string, origin: 'main' | 'chat') {
    const conn = this.connections.get(peerId);
    if (!conn) return;

    const fileId = crypto.randomUUID();
    
    // Store file for later (Handshake Protocol)
    this.pendingTransfers.set(fileId, { file, peerId });
    
    // 1. Send metadata (Handshake Request)
    conn.send({
      type: 'file-metadata',
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      senderName: this.myName,
      origin: origin // Propagate origin
    });

    this.emit('transfer-progress', {
      fileId,
      peerId,
      progress: 0,
      direction: 'outgoing',
      status: 'pending', // Waiting for acceptance
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      origin: origin // Set origin
    });
    
    return fileId;
  }

  public acceptTransfer(fileId: string, peerId: string) {
    const conn = this.connections.get(peerId);
    if (!conn) return;
    conn.send({ type: 'accept-transfer', fileId, senderName: this.myName });
  }

  public declineTransfer(fileId: string, peerId: string) {
    const conn = this.connections.get(peerId);
    if (!conn) return;
    conn.send({ type: 'decline-transfer', fileId, senderName: this.myName });
  }

  public sendChat(text: string, peerId: string) {
    const conn = this.connections.get(peerId);
    if (!conn) return;
    const id = crypto.randomUUID();
    conn.send({ 
      type: 'chat', 
      payload: text, 
      id,
      senderName: this.myName 
    });
  }

  public sendTyping(peerId: string, isTyping: boolean) {
    const conn = this.connections.get(peerId);
    if (!conn) return;
    conn.send({
      type: 'typing',
      isTyping
    });
  }

  public updateName(name: string) {
    this.myName = name;
    this.broadcast({
      type: 'name-update',
      name: name
    });
  }

  public broadcast(data: any) {
    this.connections.forEach(conn => {
        if (conn.open) {
            conn.send(data);
        }
    });
  }

  private handleConnection(conn: DataConnection) {
    // Immediate filter for self-connection
    if (conn.peer === this.myId) {
        conn.close();
        return;
    }

    // Ensure we don't register duplicate connections
    if (this.connections.has(conn.peer)) {
        const existing = this.connections.get(conn.peer);
        if (existing && existing.open) {
            conn.close();
            return;
        }
    }

    this.connections.set(conn.peer, conn);

    conn.on('open', () => {
      // Send handshake immediately
      conn.send({
        type: 'handshake',
        metadata: {
            name: this.myName,
            device: this.myDevice,
            deviceType: this.myDeviceType
        }
      });

      // Emit peer-found immediately if metadata exists
      if (conn.metadata) {
        this.emit('peer-found', {
            id: conn.peer,
            name: conn.metadata.name || 'Unknown',
            device: conn.metadata.device || 'Unknown Device',
            deviceType: conn.metadata.deviceType || 'desktop'
        });
      }
    });

    conn.on('data', (data: any) => {
      // Prioritize handshake data
      if (data && data.type === 'handshake') {
        this.handleData(data, conn.peer, conn);
        return;
      }
      this.handleData(data, conn.peer, conn);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.emit('peer-disconnected', conn.peer);
    });
    
    conn.on('error', (err) => {
      this.connections.delete(conn.peer);
      // Silently handle error or emit if critical
    });
  }

  private handleData(data: any, peerId: string, conn: DataConnection) {
    if (data.type === 'handshake') {
        // We do NOT update conn.metadata here as it is read-only.
        // We trust the handshake data for the event.
        
        this.emit('peer-found', {
            id: peerId,
            name: data.metadata.name || 'Unknown',
            device: data.metadata.device || 'Unknown Device',
            deviceType: data.metadata.deviceType || 'desktop'
        });
        
    } else if (data.type === 'file-metadata') {
      this.emit('incoming-file-request', {
        ...data,
        peerId,
        origin: data.origin || 'main' // Default to main if not present (backward compatibility)
      });
    } else if (data.type === 'accept-transfer') {
        const transfer = this.pendingTransfers.get(data.fileId);
        if (transfer) {
            const { file } = transfer;
            // Send actual file now
            conn.send({
                type: 'file-chunk',
                fileId: data.fileId,
                fileName: file.name,
                fileType: file.type || 'application/octet-stream',
                data: file,
                senderName: this.myName
            });
            
            // Cleanup
            this.pendingTransfers.delete(data.fileId);
            
            this.emit('transfer-progress', {
                fileId: data.fileId,
                peerId,
                progress: 100,
                direction: 'outgoing',
                status: 'completed',
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type || 'application/octet-stream'
            });
        }
    } else if (data.type === 'decline-transfer') {
        const transfer = this.pendingTransfers.get(data.fileId);
        if (transfer) {
            this.pendingTransfers.delete(data.fileId);
            this.emit('transfer-progress', {
                fileId: data.fileId,
                peerId,
                progress: 0,
                direction: 'outgoing',
                status: 'declined',
                fileName: transfer.file.name,
                fileSize: transfer.file.size,
                fileType: transfer.file.type || 'application/octet-stream'
            });
        }
    } else if (data.type === 'file-chunk') {
        const file = data.data;
        this.emit('file-received', {
            fileId: data.fileId,
            file: file,
            fileName: data.fileName,
            fileType: data.fileType,
            peerId,
            senderName: data.senderName // Propagate sender name
        });
    } else if (data.type === 'chat') {
        const msgId = data.id || crypto.randomUUID();
        if (msgId === this.lastId) return;
        this.lastId = msgId;

        this.emit('chat-received', {
            peerId,
            text: data.payload,
            id: msgId,
            senderName: data.senderName // Propagate sender name
        });
    } else if (data.type === 'name-update') {
        this.emit('peer-updated', {
            id: peerId,
            name: data.name
        });
    } else if (data.type === 'typing') {
        this.emit('typing-update', {
            peerId,
            isTyping: data.isTyping
        });
    }
  }

  public getMyId() {
    return this.myId;
  }
}

export default PeerService.getInstance();
