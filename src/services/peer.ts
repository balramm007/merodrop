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

    // Use a fixed 'lan' hash for local discovery simulation + random slot
    // This allows peers to find each other by scanning the slots
    const ipHash = 'lan'; 
    const slot = Math.floor(Math.random() * MAX_DISCOVERY_SLOTS);
    const peerId = `merodrop-${ipHash}-${slot}`;

    this.peer = new Peer(peerId, {
      debug: 0 // Suppress internal logs
    });

    this.peer.on('open', (id) => {
      this.myId = id;
      this.emit('open', id);
      this.discoverPeers(ipHash, slot);
    });

    this.peer.on('connection', (conn) => {
      this.handleConnection(conn);
    });

    this.peer.on('error', (err) => {
      // Ignore peer-unavailable errors during discovery
      if (err.type === 'peer-unavailable') return;
      this.emit('error', err);
    });

    window.addEventListener('beforeunload', () => {
      this.peer?.destroy();
    });
  }

  private discoverPeers(ipHash: string, mySlot: number) {
    for (let i = 0; i < MAX_DISCOVERY_SLOTS; i++) {
      if (i === mySlot) continue;
      const targetId = `merodrop-${ipHash}-${i}`;
      this.connect(targetId);
    }
  }

  public connect(peerId: string) {
    // Prevent connecting to self
    if (peerId === this.myId) return;
    
    if (!this.peer || this.connections.has(peerId)) return;

    const conn = this.peer.connect(peerId, {
      reliable: true,
      metadata: { 
        name: this.myName, 
        device: this.myDevice,
        deviceType: this.myDeviceType
      }
    });
    
    this.handleConnection(conn);
  }

  public sendFile(file: File, peerId: string) {
    const conn = this.connections.get(peerId);
    if (!conn) return;

    const fileId = crypto.randomUUID();
    
    // 1. Send metadata
    conn.send({
      type: 'file-metadata',
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // 2. Send file
    conn.send({
      type: 'file-chunk',
      fileId,
      data: file
    });

    this.emit('transfer-progress', {
      fileId,
      peerId,
      progress: 100,
      direction: 'outgoing',
      status: 'completed',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
  }

  public sendChat(text: string, peerId: string) {
    const conn = this.connections.get(peerId);
    if (!conn) return;
    const id = crypto.randomUUID();
    conn.send({ type: 'chat', payload: text, id });
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
        peerId
      });
    } else if (data.type === 'file-chunk') {
        const file = data.data;
        this.emit('file-received', {
            fileId: data.fileId,
            file: file,
            peerId
        });
    } else if (data.type === 'chat') {
        const msgId = data.id || crypto.randomUUID();
        if (msgId === this.lastId) return;
        this.lastId = msgId;

        this.emit('chat-received', {
            peerId,
            text: data.payload,
            id: msgId
        });
    } else if (data.type === 'name-update') {
        this.emit('peer-updated', {
            id: peerId,
            name: data.name
        });
    }
  }

  public getMyId() {
    return this.myId;
  }
}

export default PeerService.getInstance();
