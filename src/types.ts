export interface AppSettings {
  theme: 'light' | 'dark';
  deviceName: string;
}

export interface PeerData {
  id: string;
  name: string;
  device: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  ip?: string;
}

export interface TransferState {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  progress: number;
  speed: number; // bytes per second
  status: 'pending' | 'transferring' | 'completed' | 'error' | 'declined';
  direction: 'incoming' | 'outgoing';
  peerId: string;
  peerName?: string;
  error?: string;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType?: string;
  peerName: string;
  timestamp: number;
  direction: 'incoming' | 'outgoing' | 'sent' | 'received';
}

export interface FileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

// Re-export for compatibility with older imports if any
export type Peer = PeerData;
export type FileTransfer = TransferState;
