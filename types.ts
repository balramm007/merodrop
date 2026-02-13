
export interface PeerData {
  id: string;
  name: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  online?: boolean;
}

// Added FileMeta interface to fix missing export error in services/webrtc.ts
export interface FileMeta {
  id: string;
  name: string;
  size: number;
  type?: string;
}

export interface TransferState {
  id: string;
  peerId: string;
  fileName: string;
  fileSize: number;
  fileType?: string;
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'error' | 'declined';
  direction: 'incoming' | 'outgoing';
  speed?: string;
  error?: string;
}

export interface AppSettings {
  deviceName: string;
  theme: 'dark' | 'light';
}

export interface HistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  peerName: string;
  timestamp: number;
  direction: 'sent' | 'received';
}