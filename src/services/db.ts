
// Use named import for Dexie to ensure proper class inheritance and type resolution for 'version' method.
import { Dexie, type Table } from 'dexie';
import { AppSettings, HistoryItem } from '../types';
import { ANIMAL_NAMES } from '../constants';

export class PairDropDB extends Dexie {
  settings!: Table<{ key: string; value: AppSettings }, string>;
  history!: Table<HistoryItem, string>;

  constructor() {
    super('PairDropCloneDB');
    // Defining database schema versions.
    this.version(1).stores({
      settings: 'key',
      history: 'id, timestamp'
    });
  }
}

export const db = new PairDropDB();

export const dbService = {
  async getSettings(): Promise<AppSettings> {
    const entry = await db.settings.get('main');
    if (entry) return entry.value;
    
    const defaults: AppSettings = {
      deviceName: ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)],
      theme: 'dark'
    };
    await this.saveSettings(defaults);
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
