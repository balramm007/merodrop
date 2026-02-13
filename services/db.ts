
import { Dexie, type Table } from 'dexie';
import { AppSettings, HistoryItem } from '../types';
import { ANIMAL_NAMES } from '../constants';

export class MeroDropDB extends Dexie {
  settings!: Table<{ key: string; value: AppSettings }, string>;
  history!: Table<HistoryItem, string>;
  chunks!: Table<{ transferId: string; index: number; data: ArrayBuffer }, number>;

  constructor() {
    super('MeroDropCloneDB_v2');
    this.version(1).stores({
      settings: 'key',
      history: 'id, timestamp',
      chunks: '++id, transferId, index'
    });
  }
}

export const db = new MeroDropDB();

export const dbService = {
  async getSettings(): Promise<AppSettings> {
    const entry = await db.settings.get('main');
    if (entry) return entry.value;
    
    const defaults: AppSettings = {
      deviceName: ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)],
      theme: 'dark'
    };
    await db.settings.put({ key: 'main', value: defaults });
    return defaults;
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await db.settings.put({ key: 'main', value: settings });
  },

  async addHistory(item: HistoryItem): Promise<void> {
    await db.history.add(item);
  },

  async getHistory(): Promise<HistoryItem[]> {
    return await db.history.orderBy('timestamp').reverse().toArray();
  }
};
