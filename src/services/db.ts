// Use named import for Dexie to ensure proper class inheritance and type resolution for 'version' method.
import { Dexie, type Table } from 'dexie';
import { AppSettings, HistoryItem } from '../types';
import { ANIMAL_NAMES } from '../constants';

export class MeroDropDB extends Dexie {
  settings!: Table<{ key: string; value: AppSettings }, string>;
  history!: Table<HistoryItem, string>;

  chunks!: Table<any, string>;

  constructor() {
    super('MeroDropDB');
    this.version(1).stores({
      settings: 'key',
      history: 'id, timestamp'
    });
    
    this.version(2).stores({
      settings: 'key',
      history: 'id, timestamp',
      chunks: 'id'
    });
  }
}

export const db = new MeroDropDB();

export const dbService = {
  async getSettings(): Promise<AppSettings | undefined> {
    const entry = await db.settings.get('main');
    return entry?.value;
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await db.settings.put({ key: 'main', value: settings });
  },

  async addHistory(item: HistoryItem): Promise<void> {
    await db.history.put(item);
  },

  async updateHistoryStatus(id: string, status: string): Promise<void> {
    await db.history.update(id, { status: status as any });
  },

  async getHistory(): Promise<HistoryItem[]> {
    return await db.history.orderBy('timestamp').reverse().toArray();
  },

  async clearHistory(): Promise<void> {
    await db.history.clear();
  },

  async clearChunks(): Promise<void> {
    await db.chunks.clear();
  },

  async clearSessionData(): Promise<void> {
    await db.history.clear();
    await db.chunks.clear();
    // We explicitly do NOT clear settings
  }
};
