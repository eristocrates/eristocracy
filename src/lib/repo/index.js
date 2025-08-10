import { db, liveQuery } from './dexie';
import { v4 as uuidv4 } from 'uuid';

// Validation placeholders (you can plug Ajv/Effect Schema here)
function validateMeta(meta) {
  if (typeof meta.name !== 'string') throw new Error('name must be string');
  if (typeof meta.type !== 'string') throw new Error('type must be string');
}

function now() { return Date.now(); }

export const repo = {
  async init() {
    await db.open();
  },

  async list() {
    return db.table('catalog').orderBy('createdAt').reverse().toArray();
  },

  watchAll() {
    return liveQuery(() => db.table('catalog').orderBy('createdAt').reverse().toArray());
  },

  watchOne(id) {
    return liveQuery(async () => {
      const meta = await db.table('catalog').get(id);
      if (!meta) return null;
      const doc = await db.table('docs').get(id);
      return doc ? { ...meta, content: doc.content } : null;
    });
  },

  async create({ name, type, content, path }) {
    validateMeta({ name, type });
    const id = uuidv4();
    const createdAt = now();
    const modifiedAt = createdAt;
    const meta = { id, name, type, createdAt, modifiedAt };
    if (path) meta.path = path;
    await db.transaction('rw', db.catalog, db.docs, async () => {
      await db.table('catalog').put(meta);
      await db.table('docs').put({ id, content });
    });
    return id;
  },

  async updateMeta(id, patch) {
    const meta = await db.table('catalog').get(id);
    if (!meta) return;
    const next = { ...meta, ...patch, modifiedAt: now() };
    await db.table('catalog').put(next);
  },

  async updateContent(id, content) {
    await db.table('docs').put({ id, content });
    await db.table('catalog').update(id, { modifiedAt: now() });
  },

  async remove(id) {
    await db.transaction('rw', db.catalog, db.docs, async () => {
      await db.table('catalog').delete(id);
      await db.table('docs').delete(id);
    });
  }
}; 